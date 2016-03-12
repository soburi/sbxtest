var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({port: 80});

wss.on('connection', function(ws) {
    ws.on('message', function(message) {
        console.log('received: %s', message);
        var msg = message;
        ws.send(msg.toUpperCase());
    });

    ws.on('error', function(err) {
        console.log('error: %s', error);
    });
});

process.on('SIGINT', function() {
    console.log("Caught interrupt signal");

    wss.close();

    process.exit();
});

