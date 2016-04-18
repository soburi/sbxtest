new (function() {
    let ext_ = this;

    // Extension name
    let name = 'Fake-PicoBoard extension';

    // Block and block menu descriptions
    let descriptor = {
        blocks: [
            ['w', 'connect to %s', 'connect'],
            ['w', 'disconnect', 'disconnect'],
            ['r', 'sensor %m.buttonStatus sensor value', 'getSensorBoolValue'],
            ['r', '%m.sensorType sensor value', 'getSensorValue'],
            ['h', 'when %m.buttonStatus', 'onButtonChanged'],
            ['h', 'when %m.sensorType %m.lessMore %n', 'onSensorValueChanged'],
        ],
        menus: {
            lessMore: ['<', '>'],
            buttonStatus: ['button pressed', 'A connected', 'B connected', 'C connected', 'D connected'],
            sensorType: ['slider', 'light', 'sound', 'resistance-A', 'resistance-B', 'resistance-C', 'resistance-D'],
        },
    };

    let fake_picoboard_ext_init = function(ext) {

        let state_cache = {};

        let proptable = {
            'button pressed': "button",
            'A connected': "connectorA",
            'B connected': "connectorB",
            'C connected': "connectorC",
            'D connected': "connectorD",
            'slider': "slider",
            'light': "light",
            'sound': "sound",
            'resistance-A': "resistance-A",
            'resistance-B': "resistance-B",
            'resistance-C': "resistance-C",
            'resistance-D': "resistance-D"
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

        ext.getSensorValue = function(prop) {
            //console.log("ext.getSensorValue: %s %o", prop, callback);

            let key = proptable[prop];

            if(status_cache[key] == undefined) return "";
            if(status_cache[key].value == undefined) return "";
            
            return state_cache[key].value;
        };

        ext.getSensorBoolValue = function(prop) {
            return (ext.getSensorValue(prop) ? true : false);
        };

        ext.onButtonChanged = function(prop) {
            //console.log("ext.onButtonChanged: %s", prop);
            let ws = ext.getConnection(null);
            if(ws == null) return false;

            let key = proptable[prop];
            if(key == undefined) return false;

            let state = state_cache[key];
            if(state == undefined) return false;

            let last_probed = state.last_probed;
            let new_value = state.value;
            state_cache[key].last_probed = state.value;
            if(last_probed != new_value && new_value == true) {
                return true;
            }
            return false;
        };

        ext.onSensorValueChanged = function(prop, lessmore, threshold) {
            //console.log("ext.onSensorValueChanged: %s %s %d", prop, lessmore, threshold);
            let ws = ext.getConnection(null);
            if(ws == null) return false;

            let key = proptable[prop];
            if(key == undefined) return false;

            let state = state_cache[key];
            if(state == undefined) return false;

            let last_probed = state.last_probed;
            let new_value = state.value;
            state_cache[prop].last_probed = state.value;
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
