new (function() {
    /*
    var script = document.createElement('script');
    script.src = './ws-ext.js';
    document.getElementsByTagName("head")[0].appendChild(script);
    
    document.addEventListener('DOMContentLoaded', function() {
    */
    var scriptpath = document.currentScript.src;
    $.getScript('http://soburi.github.io/sbxtest/ws-ext.js', function(wsext, textStatus, jqxhr) {
        ws_ext_init(this);

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
