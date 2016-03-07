/* Extension demonstrating a hat block */
/* Sayamindu Dasgupta <sayamindu@media.mit.edu>, May 2014 */

new (function() {
    var ext = this;

    var addr_name = {};
    var name_addr = {};
    var ws_conn = {};

    // Cleanup function when the extension is unloaded
    ext._shutdown = function() {};

    // Status reporting code
    // Use this to report missing hardware, plugin or unsupported browser
    ext._getStatus = function() {
        return {status: 2, msg: 'Ready'};
    };

    ext.connect = function(destHost) {
	    ws_conn[destHost] = new WebSocket('ws://' + destHost);
	    ws_conn[destHost].onerror = function(err) {
	    };

	    ws_conn[destHost].message_received = false;
	    ws_conn[destHost].message_received = false;

	    ws_conn[destHost].onmessage = function(msg) {
		    ws_conn[destHost].message_received = true;
		    ws_conn[destHost].message = msg;
	    };
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
	    	var ret = ws_conn[destHost].message;
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
            ['h', 'when message receive from %s', 'onMessageReceived'],
	    ['r', 'message from %s', 'getMessage']
        ]
    };

    // Register the extension
    ScratchExtensions.register('WebSocket extension', descriptor, ext);
})();
