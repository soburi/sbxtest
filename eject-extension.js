new (function() {
    var ext = this;

    var ws_conn = null;

    ext._shutdown = function() {
        ws_conn[k].close();
    };

    var status_ = {status: 2, msg: 'Ready'};
    ext._getStatus = function() {
        return status_;
    };

    ext.connect = function(_url) {
        if(ws_conn != null) {}
            switch(ws_conn.readyState) {
                case 0:
                case 1:
                    return;
                default: //fall through
            }
        }

        var reason = "";
        try {
            var ws = new WebSocket(_url);
            ws.message = null;
            ws_conn = ws;

            ws.onmessage = function(msg) {
                ws.message = msg;
            };

            ws.onclose = function(event) {
                if(event.code != 1000) {
                    status_.status = 1;
                    status_.msg = 'onerror: ' + reason;
                }
            };

            ws.onerror = function(err) {
                status_.status = 1;
                status_.msg = 'onerror: ' + reason;
            };

        }
        catch(e) {
            status_.status = 1;
            status_.msg = 'exception: ' + reason;
        }
    };

    ext.disconnect = function() {
        ws_conn.close();
    };

    ext.send_eject = function() {
        ws_conn.send('eject');
    };

    ext.onDiskEject = function() {
        if(ws_conn.msg == 'ejected') {
            ws_conn.msg = null;
             return true;
        }
    }

    // Block and block menu descriptions
    var descriptor = {
        blocks: [
            [ '', 'connect to %s', 'connect'],
            [ '', 'disconnect', 'disconnect'],
            [ '', '(☝ ՞ਊ ՞)☝', 'send_eject'],
            ['h', 'when disc ejected', 'onDiskEject'],
        ]
    };

    // Register the extension
    ScratchExtensions.register('BasicWebSocket extension', descriptor, ext);
})();
