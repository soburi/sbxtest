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

    ext.connect = function(ipaddr, nodename) {
	    addr_name[ipaddr] = nodename;
	    name_addr[nodename] = ipaddr;
	    ws_conn[ipaddr] = new WebSocket('ws://' + ipaddr);
    };

    ext.send = function(data, node) {
         
    }

    // Block and block menu descriptions
    var descriptor = {
        blocks: [
            ['', 'connect to IPAddress:%s as NodeName:%s', 'connect'],
            ['', 'send %s to %s', 'send']
        ]
    };

    // Register the extension
    ScratchExtensions.register('WebSocket extension', descriptor, ext);
})();
