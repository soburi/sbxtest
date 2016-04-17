new (function() {
  var ext_ = this;

  // Extension name
  var name = 'WebSocket Eject client extension';

  // Block and block menu descriptions
    var descriptor = {
        blocks: [
            [ '', 'connect to %s', 'connect'],
            [ '', 'disconnect', 'disconnect'],
            [ '', '(☝ ՞ਊ ՞)☝', 'send_eject'],
            [ '', 'close drive', 'send_close'],
            ['h', 'when disc ejected', 'onDiskEjected'],
            ['h', 'when drive closed', 'onDriveClosed'],
        ]
    };


    var eject_ext_init = function(ext) {

        ext.send_eject = function() {
            var data = {command: 'eject'};
            ext.send(JSON.stringify(data), null);
        };

        ext.send_close = function() {
            var data = {command: 'close'};
            ext.send(JSON.stringify(data), null);
        };

        ext.onDiskEjected = function() {
            var ws = ws_conn.get_(null);
            if(JSON.parse(ws.message.data).command == 'eject' && ws.message.onDiscEjectedCheck != true) {
                ws.message.onDiscEjectedCheck = true;
                return true;
            }
            return false;
        }

        ext.onDriveClosed = function() {
            var ws = ws_conn.get_(null);
            if(JSON.parse(ws.message.data).command == 'close' && ws.message.onDriveClosedCheck != true) {
                ws.message.onDriveClosedCheck = true;
                return true;
            }
            return false;
        }


        // Register the extension
        ScratchExtensions.register(name, descriptor, ext);
    };

    if(document._ext_init == undefined) {
        var scriptpath = document.currentScript.src.match(/.*\//);
        $.getScript(scriptpath + 'ws-ext.js', function(wsext, textStatus, jqxhr) {
            document._ext_init = function(ext) {
                document._ext_init(ext);
                eject_ext_init(ext);
            };
            document.ext_init(ext_);
        });
    }
    else {
        // Suppress reload with differnt url for easy to debugging.
        document._ext_init(ext_);
    }

})();
