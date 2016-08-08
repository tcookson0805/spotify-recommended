var unirest = require('unirest');
var express = require('express');
var events = require('events');

// contains two arguments:
  //  1. endpoint name
  //  2. object containing arguments to provide in the query string of the endpoint

var getFromApi = function(endpoint, args){
  
  //  First the event emitter is created, which is used to communicate whether getting
  //  the information was either successful or failed
  
  var emitter = new events.EventEmitter();

  //  Use Unirest to make a GET request adding the args as a query string using the qs method.
  //  When the end function is called from the HTTP response to tell you that all of the data
  //    has been received, you trigger your own end event on the emitter, attaching the 
  //    response body which has been parsed by Unirest
  
  unirest.get('https://api.spotify.com/v1/' + endpoint)
    .qs(args)
    .end(function(response){
      if(response.ok){
        emitter.emit('end', response.body);
      }else{
        emitter.emit('emit', response.code);
      }
    });
    
  return emitter;      
};

//  creation of HTTP server, using node-static to serve the front end

var app = express();
app.use(express.static('public'));

//  When request to /search/:name is made, getFromApi is called...telling it to use the
//    endpoint /search?q=<name>&limit=1&type=artist

app.get('/search/:name', function(req, res){

  var searchReq = getFromApi('search', {
    q: req.params.name,
    limit: 1,
    type: 'artist'
  });
  
  //  add event listeners to the EventEmitter returned from the getFromApi for the end
  //    and error events
  
  //  when end event is emitted, the function is called which then extracts the artist from
  //    the object and returns it in a response 
  
  searchReq.on('end', function(item){
    
    var artist = item.artists.items[0];
    
    var searchRelated = getFromApi('artists/' + artist.id + '/related-artists', {});
    
    searchRelated.on('end', function(relatedObj){
      artist.related = relatedObj.artists;
      
      // setting variables to determine when complete
      var total = artist.related.length;
      var complete = 0;

      // fn makes call to API to grab top tracks
      var grabTracks = function(relArtist){
        var searchTracks = getFromApi('artists/' + relArtist.id + '/top-tracks', {country: 'US'});
        searchTracks.on('end', function(obj){
          relArtist.tracks = obj.tracks;
          console.log(complete);
          checkComplete();
        })
      }

      // fn checks to see if all related artists top tracks are returned
      var checkComplete = function(){
        complete += 1;
        if(total === complete){
          res.send(artist)
        }
      }

      // runs through each rel artist to call grabTracks
      artist.related.forEach(function(relArtist){ 
        grabTracks(relArtist);
      });
  
    });
  });
  
  searchReq.on('error', function(){
    res.sendStatus(code);
  });
  
});




app.listen(8080, function(){
  console.log('listening on port: 8080')
});












