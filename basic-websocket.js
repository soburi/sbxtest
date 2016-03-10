/* Extension demonstrating a hat block */
/* Sayamindu Dasgupta <sayamindu@media.mit.edu>, May 2014 */

new (function() {
    var ext = this;

    var addr_name = {};
    var ws_conn = {};

    // Cleanup function when the extension is unloaded
    ext._shutdown = function() {
        for(k in ws_conn) {
            ws_conn[k].close();
        }
    };

    // Status reporting code
    // Use this to report missing hardware, plugin or unsupported browser
    ext._getStatus = function() {
        return {status: 2, msg: 'Ready'};
    };

    ext.connect = function(destHost) {
        if(destHost in ws_conn) {
            switch(ws_conn[destHost].readyState) {
                case 0:
                case 1:
                    return;
                default:
                    //fall through
            }
        }

        try {
            var ws = new WebSocket('ws://' + destHost);
            ws.onerror = function(err) {
                console.log('Error:' + err);
            };
            
            ws.onmessage = function(msg) {
                ws.message_received = true;
                ws.message = msg;
            };
            
            ws.message_received = false;
            ws.message = null;
            
            ws_conn[destHost] = ws;
        }
        catch(e) {
            console.log('Catch:' + e);
            throw "XXX";
        }
    };

    ext.disconnect = function(destHost) {
        if(destHost in ws_conn) {
            switch(ws_conn[destHost].readyState) {
                case 0:
                case 1:
                ws_conn[destHost].close();
            }
        }
    };

    ext.send = function(data, destHost) {
        if(destHost in ws_conn) {
            ws_conn[destHost].send(data);
        }
    };

    ext.onMessageReceived = function(destHost) {
        if(destHost in ws_conn && ws_conn[destHost].message_received) {
            ws_conn[destHost].message_received = false;
            return true;
        }
        return false;
    };

    ext.getMessage = function(destHost) {
        if(destHost in ws_conn && ws_conn[destHost].message != null) {
            var ret = ws_conn[destHost].message.data;
            ws_conn[destHost].message = null;
            return ret;
        }
        return "";
    };

    /*
    ext.onMessageReceivedAny = function() {
        for(k in ws_conn) {
                if(ws_conn[k].message != null) {
                        return true;
                }
        }
        return false;
    };

    ext.getSender = function() {
        for(k in ws_conn) {
                if(ws_conn[k].message != null) {
                        return k;
                }
        }
        return null;
    };

    ext.testcall = function(arg) {
            console.log(arg);
            return arg;
    };
    */

    // Block and block menu descriptions
    var descriptor = {
        blocks: [
            ['', 'connect to %s', 'connect'],
            ['', 'disconnect %s', 'disconnect'],
            ['', 'send %s to %s', 'send'],
            ['h', 'when data received from %s', 'onMessageReceived'],
            ['r', 'data from %s', 'getMessage'],
            //['h', 'when data received', 'onMessageReceivedAny'],
            //['r', 'receive from', 'getSender'],
            //['r', 'testcall %s', 'testcall']
        ]
    };

    // Register the extension
    ScratchExtensions.register('BasicWebSocket extension', descriptor, ext);
})();
