new (function() {
    let ext_ = this;

    // Extension name
    let name = 'Fake-PicoBoard extension';

    // Block and block menu descriptions
    let descriptor = {
        blocks: [
            ['w', 'connect to %s', 'connect'],
            ['w', 'disconnect', 'disconnect'],
            ['R', 'sensor %m.buttonStatus sensor value', 'getSensorValue'],
            ['R', '%m.sensorType sensor value', 'getSensorValue'],
            ['h', 'when %m.buttonStatus', 'onButtonChanged'],
            ['h', 'when %m.sensorType %m.lessMore %n', 'onSensorValueChanged'],
        ],
        menus: {
            lessMore: ['<', '>'],
            buttonStatus: ['button pressed', 'A connected', 'B connected', 'C connected', 'D connected'],
            sensorType: ['slider'],
            //sensorType: ['slider', 'light', 'sound', 'resistance-A', 'resistance-B', 'resistance-C', 'resistance-D'],
        },
    };

    let fake_picoboard_ext_init = function(ext) {

        let state_cache = {};

        ext.getSensorValue = function(prop, callback) {
            console.log("ext.getSensorValue: %s %o", prop, callback);
            let req = {"request": prop};

            let ws = ext.getConnection(null);
            if(ws == null) {
                console.log("%s getSensorValue: not yet init", ws.url);
                callback(-1);
                return;
            }

            let callbacked = false;
            
            setTimeout( function() {
                if(!callbacked) {
                    callbacked = true;
                    ext.setErrorStatus(1, "getSensorValue: Request timeout");
                    console.log("%s: getSensorValue: timeout, callback", ws.url);
                    callback(-1);
                }
            }, 3000 );

            ext.addEventListener('message-received', function(event) {
                let resp = JSON.parse(event.data);
                if(!callbacked) {
                    if(resp.response != undefined && resp.value != undefined && resp.response == prop) {
                        callbacked = true;
                        console.log("%s onmessage: getSensorValue callback:%d response:%o", ws.url, resp.value, resp);
                        let state = state_cache[prop];
                        if(state != null) {
                            state_cache[prop].value = resp.value;
                        }
                        else {
                            state_cache[prop] = { last_probed: resp.value, value: resp.value };
                        }
                        callback(resp.value);
                    }
                }
            });

            ext.send(JSON.stringify(req), null);
        };

        ext.isInternalProcessEvent = function(event) {
            let recv = JSON.parse(event.data);
            return (recv.response == undefined);
        };

        ext.addEventListener('message-received', function(event) {
            let recv = JSON.parse(event.data);
            if(recv.notify != undefined) {

                for(k in recv.notify) {

                    let state = state_cache[k];
                    if(state != null) {
                        state_cache[k].value = recv.notify[k];
                    }
                    else {
                        state_cache[k] = { last_probed: recv.notify[k], value: recv.notify[k] };
                    }

                }
            }
        });

        ext.onButtonChanged = function(prop) {
            //console.log("ext.onButtonChanged: %s", prop);
            let ws = ext.getConnection(null);
            if(ws == null) return false;

            let last_probed = state_cache[prop].last_probed;
            let new_value = state_cache[prop].value;
            state_cache[prop].last_probed = state_cache[prop].value;
            if(last_probed != new_value) {
                return true;
            }
            return false;
        };

        ext.onSensorValueChanged = function(prop, lessmore, threshold) {
            //console.log("ext.onSensorValueChanged: %s %s %d", prop, lessmore, threshold);
            let ws = ext.getConnection(null);
            if(ws == null) return false;

            let last_probed = state_cache[prop].last_probed;
            let new_value = state_cache[prop].value;
            state_cache[prop].last_probed = state_cache[prop].value;
            if(last_probed != new_value) {
                if( (lessmore == '<' && last_probed >= threshold && new_value < threshold)  &&
                    (lessmore == '>' && last_probed <= threshold && new_value > threshold) ) {
                        return true;
                }
            }
            
            return false;
        };

        ScratchExtensions.register(name, descriptor, ext);
    };

    let scriptpath = document.currentScript.src.match(/.*\//);
    $.getScript(scriptpath + 'ws-ext.js')
        .done( function(ws_ext, textStatus) {
            ws_ext_init(ext_);
            fake_picoboard_ext_init(ext_);
        });
    
})();
