var express = require('express'),
    app = express(),
    config = require('./config.json'),
    socketio = require('socket.io');

app.set('views', __dirname + '/templates');
app.set('view engine', 'jade');
app.engine('jade', require('jade').__express);
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.render('index');
});

var io = socketio.listen(app.listen(config.port)),
    clients = {},
    usernames = [];

io.sockets.on('connection', function(sock) {
    var ip = sock.handshake.address;

    sock.on('access', function(data) {
        if (data.username in usernames) {
            io.sockets.emit('message', {
                message: data.username + ' already exists. Choose another username.',
                type: 'error'
            });
        } else {
            usernames.push(data.username);
            clients[ip] = {
                username: data.username,
                color: function() {
                    var colors = ['crimson', 'royalblue', 'purple', 'red', 'green'];
                    return colors[Math.floor(Math.random()*colors.length)];
                }(),
                lastAction: new Date().getTime() / 1000
            };

            io.sockets.emit('message', {
                message: data.username + ' has logged in.',
                type: 'system'
            });
        }
    });

    sock.on('send', function(data) {
        io.sockets.emit('message', {
            message: data.message,
            time: new Date().getTime() / 1000,
            type: 'user',
            user: clients[ip].username,
            color: clientes[ip].color
        });
    });
});
