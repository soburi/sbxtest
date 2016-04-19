new (function() {
    let ext_ = this;

    // Extension name
    let name = 'WebSocket Eject client extension';

    // Block and block menu descriptions
    let descriptor = {
        blocks: [
            ['w', 'connect to %s', 'connect'],
            ['w', 'disconnect', 'disconnect'],
            [ '', '(☝ ՞ਊ ՞)☝', 'send_eject'],
            [ '', 'close drive', 'send_close'],
            ['h', 'when disc ejected', 'onDiskEjected'],
            ['h', 'when drive closed', 'onDriveClosed'],
        ]
    };


    let eject_ext_init = function(ext) {

        ext.send_eject = function() {
            let data = {command: 'eject'};
            ext.api.send(JSON.stringify(data), null);
        };

        ext.send_close = function() {
            let data = {command: 'close'};
            ext.api.send(JSON.stringify(data), null);
        };

	let prev_state = '';
	let curr_state = '';

        ext.api.setInternalEventCheckHook( function(event) {
            return true;
        });

        ext.api.addEventListener('message-received', function(event) {
            let recv = JSON.parse(event.data);
            if(recv.command != undefined) {
		curr_state = recv.command;
            }
        });

	let state_check = function(check_state) {
	    if(prev_state != curr_state && curr_state == check_state) {
		prev_state = curr_state;
                return true;
            }
            return false;
        };
        ext.onDiskEjected = function() { return state_check('eject'); }
        ext.onDriveClosed = function() { return state_check('close'); }

        // Register the extension
        ScratchExtensions.register(name, descriptor, ext);
    };

    let scriptpath = document.currentScript.src.match(/.*\//);
    $.getScript(scriptpath + 'ws-ext.js')
        .done( function(ws_ext, textStatus) {
            let eventTarget = document.createDocumentFragment();
            ws_ext_init(ext_, eventTarget);
            eject_ext_init(ext_);
        });

})();
