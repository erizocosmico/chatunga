function addLZero(n) {
    return (n < 10) ? '0' + n : n;
}

function renderMessage(data) {
    if (data.type == 'user') {
        var date = new Date(data.time * 1000);
    }
    return '<div class="message message-' + data.type +
        '">' + ((data.type == 'user') ? '<span class="time">' +
        (addLZero(date.getHours()) + ':' + addLZero(date.getMinutes()) + ':' + addLZero(date.getSeconds())) +
        '</span> <span class="username" style="color: ' + data.color +
        '">&lt;' + data.user + '&gt;</span>:&nbsp;' : '') +
        '<span class="message">' + data.message + '</span></div>';
}

function renderUser(user) {
    return '<li style="color: ' + user.color + '">' + user.username + '</li>';
}

document.addEventListener("DOMContentLoaded", function() {
    var socket = io.connect('http://'+serverIp+':'+port),
        messageList = document.getElementById('chatbox-messages'),
        setUsernameBtn = document.getElementById('set-username-btn'),
        msgText = document.getElementById('message-text'),
        usernameText = document.getElementById('username'),
        sendMessageBtn = document.getElementById('send-message-btn'),
        usersList = document.getElementById('online-list'),
        msgForm = document.getElementById('message-form')
        sendMessageCallback = function(e) {
            e.preventDefault();
            var tmp = document.createElement("DIV");
            tmp.innerHTML = msgText.value;
            msgText.value = tmp.textContent || tmp.innerText || "";
            if (msgText.value.length > 0) {
                socket.emit('send', { message: msgText.value });
                msgText.value = '';
            }

            return false;
        };

    setUsernameBtn.addEventListener('click', function() {
        if (usernameText.value.length > 0) {
            socket.emit('access', {
                username: usernameText.value
            });
            usernameText.value = '';
        }
    });

    msgForm.addEventListener('submit', sendMessageCallback, false);
    sendMessageBtn.addEventListener('click', sendMessageCallback);
    
    socket.on('ready', function(data) {
        var chatbox = document.getElementById('chatbox');
        document.getElementById('username-selection').className = 'hidden';
        chatbox.className = chatbox.className.replace(' hidden', '');
    });

    socket.on('logged-out', function(data) {
        var chatbox = document.getElementById('chatbox');
        var uSel = document.getElementById('username-selection');
        chatbox.className = 'hidden';
        uSel.className = uSel.className.replace(' hidden', '');
    });
    
    socket.on('message', function(data) {
        if (data.type == 'error') {
            alert(data.message);
        } else {
            messageList.innerHTML += renderMessage(data);
            messageList.scrollTop = messageList.scrollHeight
        }
    });
    
    socket.on('user-login', function(data) {
        var users = [];
        if ('username' in data) {
            users.push(data);
        } else {
            for (var i in data) {
                data[i].ip = i;
                users.push(data[i]);
            }
        }

        usersList.innerHTML = '';
        for (var i = 0; i < users.length; i++) {
            usersList.innerHTML += renderUser(users[i]);
        }
    });
});