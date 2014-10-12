//Server Management
//=================

var express = require('express')
//  , $       = require('jquery')
  , $       = require('jquery')(require("jsdom").jsdom().parentWindow)
  , routes  = require('./routes')
  , app     = express()
  , http    = require('http').createServer(app)
  , io      = require('socket.io').listen(http)
  , path    = require('path');

  app.set('port', process.env.PORT || 1337);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.static(path.join(__dirname, '/public')));


app.get('/', routes.index);
app.get('/game', routes.game);

http.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

//Game Management
//===============
var players = [];
var requiredPlayerCount = 2;

//connected player event
io.sockets.on('connection', function (socket) {
  console.log("connection event ...");

  // Check if there is enough place in the current game for a new player
  if(checkNumberOfPlayers()) {
    socket.emit('info', {info: 'waiting player'});

    socket.on('newPlayer', function (data) {
      if(data.hasOwnProperty("name")) {
        var player = createNewPlayer(socket, data.name);
        console.log("Player connected: " + players.length + " - " + data.name);

        // Send an ACK to the client
        socket.emit('confirmPlayer', {name: player.name, id: player.id}); 

        // Check if we're ready to play
        if(!checkNumberOfPlayers()) {
          var playersName = [];
          $.each(players, function(index, value) {
            playersName.push(value.name);
          });
          informPlayers('info', 
            {'info':   'ready to play',
             'players': playersName }
          );
          
        }
        
        socket.on('disconnect', function () {
          //players = $.grep(players, function(row) {
          //  return row != player;
          //});
          //console.log('Player disconnect: ' + players.length);
        });
      }
    });
  } else {
    socket.emit('info', {info: 'game full'});
    console.log("user rejected due to full game");
  }

  socket.on("changeWindow", function (){
    //save players array
    //playersBackup = players.slice();
  });

  socket.on('update', function (data) {
    socket.broadcast.emit('updated', data);
  });

  //receive game loaded message and send player identifications to games (game.js)
  socket.on("gameInit", function(){
    //restore players array
    //players = playersBackup.slice();
    //send back gameInitData
    var gameInitData = new Object();
    gameInitData.players = [];
    for(var i = 0; i < players.length; i++) {

      if(i%2==0){
        gameInitData.players.push({"id": players[i].id, "name":players[i].name, "role":"disponent"});
      }else{
        gameInitData.players.push({"id": players[i].id, "name":players[i].name, "role":"operator"});
      }
    }
    socket.broadcast.emit("gameInitData", gameInitData);
  });

  socket.on("directionChanged", function(data){
    socket.broadcast.emit("directionChanged",data);
  });

  socket.on("carUpdate", function(data){
    socket.broadcast.emit("carUpdate", data);
  });

  socket.on("newCar", function(data){
    socket.broadcast.emit("newCar", data);
  });

  socket.on("carHitSpawn", function(data){
    socket.broadcast.emit("carHitSpawn", data);
  });
});

//assisting functions collection
function createNewPlayer(socket, name) {
  var player = new Object();
  player.socket = socket;
  player.name = name;
  player.id = players.length+1;
  player.emit = function(dataName, data) {
    player.socket.emit(dataName, data);
  };
  players.push(player);
  return player;
}

function checkNumberOfPlayers() {
  if(players.length < requiredPlayerCount) {
    return true;
  } else {
    return false;
  }
}

function informPlayers(dataName, data) {
  for(var i = 0; i < players.length; i++) {
    players[i].emit(dataName, data);
  }
}
