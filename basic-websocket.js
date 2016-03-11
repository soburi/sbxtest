/* Extension demonstrating a hat block */
/* Sayamindu Dasgupta <sayamindu@media.mit.edu>, May 2014 */

new (function() {
    var ext = this;

    var ws_conn = {};
    var last_message = null;
    var message_received = false;

    // Cleanup function when the extension is unloaded
    ext._shutdown = function() {
        for(k in ws_conn) {
            ws_conn[k].close();
        }
    };

    // Status reporting code
    // Use this to report missing hardware, plugin or unsupported browser
    var status_ = {status: 2, msg: 'Ready'};
    ext._getStatus = function() {
        return status_;
    };

    ext.connect = function(_url) {
        if(_url in ws_conn) {
            switch(ws_conn[_url].readyState) {
                case 0:
                case 1:
                    return;
                default:
                    //fall through
            }
        }

        try {
            var ws = new WebSocket(_url);
            ws.onerror = function(err) {
                console.log('Error:' + err);
            };
            
            ws.onmessage = function(msg) {
                message_received = true;
                ws.message = msg;
                last_message = msg;
            };
            
            ws.message = null;
            ws_conn[_url] = ws;
        }
        catch(e) {
            console.log('Catch:' + e);
            throw "XXX";
        }
    };

    ext.disconnect = function(_url) {
        if(_url in ws_conn) {
            switch(ws_conn[_url].readyState) {
                case 0:
                case 1:
                ws_conn[_url].close();
            }
        }
    };

    ext.send = function(data, _url) {
        if(_url in ws_conn) {
            ws_conn[_url].send(data);
        }
    };

    ext.getMessage = function(_url) {
        if(_url in ws_conn && ws_conn[_url].message != null) {
            var ret = ws_conn[_url].message.data;
            if(last_message === ws_conn[_url].message) {
                last_message = null;
            }
            ws_conn[_url].message = null;
            return ret;
        }
        return null;
    };

    ext.getLastReceivedMessage = function() {
	var tmp = last_message;
	last_message = null;
	return tmp;
    };
    
    ext.getMessageOrigin = function() {
        if(last_message != null) {
            return last_message.origin;
        }
        return null;
    };

    ext.onMessageReceived = function() {
        if(message_received == true) {
            message_received = false;
            return true;
        }
        return false;
    };

    // Block and block menu descriptions
    var descriptor = {
        blocks: [
            [ '', 'connect to %s', 'connect'],
            [ '', 'disconnect %s', 'disconnect'],
            [ '', 'send %s to %s', 'send'],
            ['r', 'message from %s', 'getMessage'],
            ['r', 'last received message', 'getLastReceivedMessage'],
            ['r', 'message origin', 'getMessageOrigin'],
            ['h', 'when data received', 'onMessageReceived'],
        ]
    };

    // Register the extension
    ScratchExtensions.register('BasicWebSocket extension', descriptor, ext);
})();
