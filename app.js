var express = require('express'),
    config = require('./config.json'),
    socketio = require('socket.io'),
    path = require('path'),
    http = require('http'),
    app = express();

app.set('port', config.port || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', function(req, res) {
    res.render('index', {
        title : 'Chatunga',
        port : app.get('port'),
        ip : config.ip
    });
});

var io = socketio.listen(app.listen(app.get('port'))),
    clients = {},
    usernames = [];

io.sockets.on('connection', function(sock) {
    try {
        var ip = sock.handshake.address.address;

        setInterval(function() {
            for (var i in clients) {
                if ((new Date().getTime() / 1000) - clients[i].lastAction > 5000) {
                    delete clients[i];
                    if (i == ip) {
                        sock.emit('logged-out');
                    }
                }
            }

            sock.emit('user-login', clients);
            sock.broadcast.emit('user-login', clients);
        }, 5000);

        sock.on('access', function(data) {
            if (data.username in usernames) {
                sock.emit('message', {
                    message: data.username + ' already exists. Choose another username.',
                    type: 'error'
                });
            } else {
                // Setup user
                sock.emit('ready');
                usernames.push(data.username);
                clients[ip] = {
                    username: data.username,
                    color: function() {
                        var colors = ['crimson', 'royalblue', 'purple', 'red', 'green'];
                        return colors[Math.floor(Math.random()*colors.length)];
                    }(),
                    lastAction: new Date().getTime() / 1000
                };
                
                // Send the list of logged users
                sock.emit('user-login', clients);
                sock.broadcast.emit('user-login', clients);
                
                // Send the notification message
                data = {
                    message: data.username + ' has logged in.',
                    type: 'system'
                };
                sock.emit('message', data);
                sock.broadcast.emit('message', data);
            }
        });

        sock.on('send', function(data) {

            if (data.message[0] === '/' && ip === config.ip) {
                // TODO: Admin commands
            } else {
                // TODO: Parse urls
                var msgData = {
                    message: data.message,
                    time: new Date().getTime() / 1000,
                    type: 'user',
                    user: clients[ip].username,
                    color: clients[ip].color
                };
            }

            clients[ip].lastAction = new Date().getTime() / 1000;

            sock.emit('message', msgData);
            sock.broadcast.emit('message', msgData);

            if (/over 9000/gi.test(data.message)) {
                var msgDataBot = {
                    message: 'WHAT? NINE THOUSAND?',
                    time: new Date().getTime() / 1000,
                    type: 'user',
                    user: "Napa BOT",
                    color: "red"
                };

                sock.emit('message', msgDataBot);
                sock.broadcast.emit('message', msgDataBot);
            }
        });
    } catch (e) {
        console.log(e);
    }
});
