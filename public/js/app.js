function renderMessage(data) {
    // TODO
}

document.addEventListener("DOMContentLoaded", function() {
    var socket = io.connect('http://'+serverIp+':'+port),
        messageList = document.getElementById('chatbox-messages');
    
    socket.on('connect', function() {
        socket.emit('access', { username : "pepito" });
    });
    
    socket.on('ready', function(data) {
        document.getElementById('username-selection').className = 'hidden';
        document.getElementById('chatbox').className = '';
    });
    
    socket.on('message', function(data) {
        messageList.appendChild(renderMessage(data));
    });
    
    socket.on('user-login', function(data) {
        // TODO
    });
});