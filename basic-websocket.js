/* Extension demonstrating a hat block */
/* Sayamindu Dasgupta <sayamindu@media.mit.edu>, May 2014 */

new (function() {
    var ext = this;

    var addr_name = {};
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

    /*
    ext.onMessageReceived = function(_url) {
        if(_url in ws_conn && ws_conn[_url].message_received) {
            ws_conn[_url].message_received = false;
            return true;
        }
        return false;
    };
    */

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

    
    ext.onMessageReceivedAny = function() {
        if(last_message_flag == true) {
            last_message_flag = false;
            return true;
        }
        return false;
    };

    ext.getMessageOrigin = function() {
        if(last_message != null) {
            return last_message.origin;
        }
        return null;
    };

    /*
    ext.testcall = function(arg) {
            console.log(arg);
            return arg;
    };
    */

    // Block and block menu descriptions
    var descriptor = {
        blocks: [
            [ '', 'connect to %s', 'connect'],
            [ '', 'disconnect %s', 'disconnect'],
            [ '', 'send %s to %s', 'send'],
            ['r', 'get message from %s', 'getMessage'],
            ['r', 'message origin', 'getMessageOrigin'],
            ['h', 'when data received', 'onMessageReceivedAny'],
            //['h', 'when data received from %s', 'onMessageReceived'],
            //['r', 'testcall %s', 'testcall']
        ]
    };

    // Register the extension
    ScratchExtensions.register('BasicWebSocket extension', descriptor, ext);
})();
