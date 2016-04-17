new (function() {
    var doc = $(document);
    var src = $(document).createElement('script');
    src.src = './ws-ext.js';
    $(document).getElementsByTagName("head")[0].appendChild(scr);

    $(document).ready( function() {

        wsext(this);

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

        // Register the extension
        ScratchExtensions.register('WebSocket extension', descriptor, ext);
    });
})();
