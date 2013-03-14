
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3020);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/users', user.list);

app.get('/test', function(req, res){
  console.dir(req.app.settings.port);
//  res.send(res);
});

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

var io = require('socket.io').listen(server);
var userId = 0;
//var socket = require('socket.io').listen(app);
io.sockets.on('connection', function(socket) {
  socket.handshake.userId = userId;
  userId++;

  // myconnect
  socket.on('myconnect', function(data) {
    var data = { userId: socket.handshake.userId, data:data };
    socket.emit("myconnect", data);
    socket.broadcast.emit("other connect", data);
  });
  // disconnect
  socket.on('disconnect', function(data) {
    var data = { userId: socket.handshake.userId, data:data };
    socket.emit("disconnect", data);
    socket.broadcast.emit("other disconnect", data);
  });

  // update
  socket.on('update', function(data) {
    var data = { userId: socket.handshake.userId, data:data };
    socket.broadcast.emit("other update", data);
  });
  socket.on('drag', function(data) {
    var data = { userId: socket.handshake.userId, data:data };
    socket.broadcast.emit("other dialogdrag", data);
  });

  socket.on('change message', function(data) {
    var data = { userId: socket.handshake.userId, data:data };
    socket.broadcast.emit("other change message", data);
  });

  socket.on('send message', function(data) {
    var data = { userId: socket.handshake.userId, data:data };
    socket.emit("send message", data);
    socket.broadcast.emit("send message", data);
  });
});
