var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
 
app.use(express.static(__dirname));
 
app.get('/', function(req, res){
  res.render('/index.html');
});
 
var playerCount = 0;
var id = 0;
 
io.on('connection', function (socket) {
  playerCount++;
  id++;
  setTimeout(function () {
    socket.emit('connected', { playerId: id });
    io.emit('count', { playerCount: playerCount });
  }, 1500);
 
  socket.on('update', function (data) {
    socket.broadcast.emit('updated', data);
  });

  socket.on('disconnect', function () {
    playerCount--;
    io.emit('count', { playerCount: playerCount });
  });
});
 

server.listen(1337);
console.log("Multiplayer app listening");