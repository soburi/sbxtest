new (function() {
    // Extension name
    var name = 'Fake-PicoBoard extension';
    var state_cache = {};
    var reqid = 0;

    var ext_ = this;
    
    // Block and block menu descriptions
    var descriptor = {
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
            sensorType: ['slider', 'light', 'sound', 'resistance-A', 'resistance-B', 'resistance-C', 'resistance-D'],
        },
    };

    var fake_picoboard_ext_init = function(ext) {
        ext.getSensorValue = function(prop, callback) {
            console.log("ext.getSensorValue: %s %o", prop, callback);
            var req = {"request": prop, "reqid":reqid};

            var ws = ext.connection.get_(null);
            if(ws == null) {
                console.log("%s getSensorValue: not yet init", ws.url);
                callback(-1);
                return;
            }

            var callbacked = false;
            
            setTimeout( function() {
                if(!callbacked) {
                    callbacked = true;
		    ext.setErrorStatus(1, "getSensorValue: Request timeout");
                    console.log("%s: getSensorValue: timeout, callback", ws.url);
                    callback(-1);
                }
            }, 3000 );

            ws.addEventListener('message', function(event) {
                var resp = JSON.parse(event.data);
                var _req = req;
                if(!callbacked) {
                    if(resp.response == prop) {
                        callbacked = true;
                        console.log("%s onmessage: getSensorValue callback:%d response:%o", ws.url, resp.value, resp);
                        callback(resp.value);
                    }
                }
            });

            ext.send(JSON.stringify(req), null);
            reqid++;
        };


        var state_received = function(event) {
            var resp = JSON.parse(event.data);
            var oldval = state_cache[resp.notify];
            state_cache[resp.notify] = { update: (oldval == resp.value), value: resp.value };
        };

        ext.onButtonChanged = function(prop) {
            console.log("ext.onButtonChanged: %s", prop);
            var ws = ext.connection.get_(null);
            if(ws == null) return false;

            ws.addEventListener('message', function(event) {
                var resp = JSON.parse(event.data);
                var oldval = state_cache[resp.notify];
                state_cache[resp.notify] = { update: (oldval == resp.value), value: resp.value };
                
                if(state_cache[prop].update && state_cache[prop].value != 0) {
                    return true;
                }
            })
        };

        ext.onSensorValueChanged = function(prop, lessmore, threshold) {
            console.log("ext.onSensorValueChanged: %s %s %d", prop, lessmore, threshold);
            var ws = ext.connection.get_(null);
            if(ws == null) return false;

            ws.addEventListener('message', function(event) {
                var resp = JSON.parse(event.data);
                var oldval = state_cache[resp.notify];
                state_cache[resp.notify] = { update: (oldval == resp.value), value: resp.value };
                
                var value = state_cache[prop].value;
                if(state_cache[prop].update) {
                    if(lessmore == '<') {
                        return (value < threshold);
                    }
                    else {
                        return (value > threshold);
                    }
                }
            });
        };
    };

    var xinit = function(initfunc) {
        initfunc(this);
        fake_picoboard_ext_init(this);
        ScratchExtensions.register(name, descriptor, this);
    };

    var init = function(ext) {
        if(document.ws_ext_init == undefined) {
            var scriptpath = document.currentScript.src.match(/.*\//);
            $.getScript(scriptpath + 'ws-ext.js', function(wsext, textStatus, jqxhr) {
                document.ws_ext_init = ws_ext_init;
                xinit(document.ws_ext_init);
            });
        }
        else {
            var f = function() {
                xinit(document.ws_ext_init);
            };
            f();
        }
    };

    init(ext_);

})();
