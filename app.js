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
    usernames = [],
    banList = [];

io.sockets.on('connection', function(sock) {
    try {
        var ip = sock.handshake.address.address;

        setInterval(function() {
            for (var i in clients) {
                if ((new Date().getTime() / 1000) - clients[i].lastAction > 72000) {
                    delete clients[i];
                    if (i == ip) {
                        sock.emit('logged-out');
                    }
                }
            }

            sock.emit('user-login', clients);
            sock.broadcast.emit('user-login', clients);
        }, 60000);

        sock.on('access', function(data) {
            if (data.username.length > 30) {
                data.username = data.username.substring(0, 30);
            }
            
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
                        return config.colors[Math.floor(Math.random()*config.colors.length)];
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

            if (data.message[0] === '/' &&
                (ip === config.ip || config.adminIps.indexOf(ip) !== -1) &&
                config.enableAdminCommands) {
                    var command = data.message.substring(1, data.message.indexOf(' '));
                    
                    switch (command) {
                    case 'ban':
                        var msgParts = data.message.split(' ');
                        if (msgParts.length > 1) {
                            // Ban by IP
                            var ipToBan = msgParts[1];
                            if (/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/.test(ipToBan)
                                && banList.indexOf(ipToBan) === -1) {
                                banList.push(ipToBan);
                            } else {
                                // Ban by username
                                var username = data.message.substring(data.message.indexOf(' ') + 1);
                                for (var i in clients) {
                                    if (clients[i].username === username
                                        && banList.indexOf(i) === -1) {
                                        banList.push(i);
                                    }
                                }
                            }
                        }
                        break;
                    case 'unban':
                        var msgParts = data.message.split(' ');
                        if (msgParts.length > 1) {
                            // Unban by IP
                            var ipToUnBan = msgParts[1];
                            if (/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/.test(ipToUnBan)
                                && banList.indexOf(ipToUnBan) !== -1) {
                                var i = banList.indexOf(ipToUnBan);
                                banList.splice(i, i+1);
                            } else {
                                // Unban by username
                                var username = data.message.substring(data.message.indexOf(' ') + 1);
                                for (var i in clients) {
                                    if (clients[i].username === username
                                        && banList.indexOf(i) !== -1) {
                                        var index = banList.indexOf(i);
                                        banList.splice(index, index+1);
                                    }
                                }
                            }
                        }
                        break;
                    }
                    return;
            } else {
                // Is the user banned?
                for (var i = 0; i < banList.length; i++) {
                    if (banList[i] === ip) {
                        sock.emit('message', {
                            message: 'Sorry, you are banned.',
                            type: 'system' 
                        });
                        return;
                    }
                }

                // Parse urls
                var pattern = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig;
                if (data.message.match(pattern)) {
                    data.message = data.message.
                        replace(pattern, '<a href="$1" target="_blank">$1</a>');
                }

                // Message data
                var msgData = {
                    message: data.message,
                    time: new Date().getTime() / 1000,
                    type: 'user',
                    user: clients[ip].username,
                    color: clients[ip].color
                };
            }

            // Update last action
            clients[ip].lastAction = new Date().getTime() / 1000;

            sock.emit('message', msgData);
            sock.broadcast.emit('message', msgData);

            // Napa bot
            if (/over 9000/gi.test(data.message) && config.enableNapaBot) {
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
