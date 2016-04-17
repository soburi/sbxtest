new (function() {
    // Extension name
    var name = 'WebSocket extension';
    // Block and block menu descriptions
    var descriptor = {
        blocks: [
            ['w', 'connect to %s', 'connect'],
            ['w', 'disconnect %s', 'disconnect'],
            [ '', 'send %s to %s', 'send'],
            ['R', 'message from %s', 'getMessage'],
            ['r', 'message origin', 'getLastReceivedMessageOrigin'],
            ['h', 'when data received', 'onMessageReceived'],

            ['r', 'JSON', 'emptyObject'],
            ['r', 'add string %s:%s to %s', 'addJsonProperty'],
            ['r', 'add number %s:%n to %s', 'addJsonProperty'],
            ['r', 'get property:%s from JSON:%s', 'getJsonProperty'],
        ]
    };

    var ext = this;
    var scriptpath = document.currentScript.src.match(/.*\//);
    $.getScript(scriptpath + 'ws-ext.js', function(ws_ext, textStatus, jqxhr) {
        ws_ext_init(ext);
        ScratchExtensions.register(name, descriptor, ext);
    });

})();
