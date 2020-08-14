let express = require('express');
let app = express();
let path = require('path');
let http = require('http').createServer(app);
let io = require('socket.io')(http);
let port = process.env.PORT || 3000;

http.listen(port, function(){
    console.log('server rlistening on port %d', port)
});

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', function(socket){
    socket.broadcast.emit('chat connect', 'user ' + socket.id + ' connected');
    socket.on('disconnect', function(){
        socket.broadcast.emit('chat disconnect', 'user ' + socket.id + ' disconnected');
    });
    socket.on('chat message', function(msg){
        socket.broadcast.emit('chat message', msg);
    });

});