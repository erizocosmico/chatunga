chatunga
========

Simple realtime webchat made just for educational and recreational purposes.

## Install

Requirements:

* npm and nodejs
* bower (```npm install -g bower```)

```bash
git clone https://github.com/mvader/chatunga
npm install
bower install
```

Now you have to edit ```config.json``` and change whatever you want. The options are pretty straightforward.
The ```ip``` setting is the IP address of the computer where the chat server will run and that IP is treated as an admin IP (you don't have to add your own IP to the admins IPs array).

When you're done with the configuration you just have to run it.
```bash
npm start
```

## Running chatunga forever
```bash
npm install -g forever
NODE_ENV=production forever start app.js
```
