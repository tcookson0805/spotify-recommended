var unirest = require('unirest');
var express = require('express');
var events = require('events');

// contains two arguments:
  //  1. endpoint name
  //  2. object containing arguments to provide in the query string of the endpoint

var getFromAPI = function(endpoint, args){
  
  //  First the event emitter is created, which is used to communicate that getting
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
    res.json(artist);
  });
  
  searchReq.on('error', function(){
    res.sendStatus(code);
  });
});

app.listen(8080, function(){
  console.log('listening on port: 8080')
});












