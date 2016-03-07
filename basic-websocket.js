/* Extension demonstrating a hat block */
/* Sayamindu Dasgupta <sayamindu@media.mit.edu>, May 2014 */

new (function() {
    var ext = this;

    var addr_name = {};
    var ws_conn = {};

    // Cleanup function when the extension is unloaded
    ext._shutdown = function() {};

    // Status reporting code
    // Use this to report missing hardware, plugin or unsupported browser
    ext._getStatus = function() {
        return {status: 2, msg: 'Ready'};
    };

    ext.connect = function(destHost) {
        var ws = new WebSocket('ws://' + destHost);
        ws.onerror = function(err) {
        };

        ws.onmessage = function(msg) {
            ws.message_received = true;
            ws.message = msg;
        };

        ws.message_received = false;

        ws_conn[destHost] = ws;
    };

    ext.send = function(data, destHost) {
        ws_conn[destHost].send(data);
    };

    ext.onMessageReceived = function(destHost) {
        if(ws_conn[destHost].message_received) {
            ws_conn[destHost].message_received = false;
            return true;
        }
        return false;
    };

    ext.getMessage = function(destHost) {
        if(ws_conn[destHost].message) {
            var ret = ws_conn[destHost].message.data;
            ws_conn[destHost].message = null;
            return ret;
        }
        return "";
    };
   
    // Block and block menu descriptions
    var descriptor = {
        blocks: [
            ['', 'connect to Host:%s', 'connect'],
            ['', 'send %s to %s', 'send'],
            ['h', 'when data received from %s', 'onMessageReceived'],
            ['r', 'data from %s', 'getMessage']
        ]
    };

    // Register the extension
    ScratchExtensions.register('BasicWebSocket extension', descriptor, ext);
})();
