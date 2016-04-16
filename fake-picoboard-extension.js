new (function() {
    var ext = this;

    var ws_conn = {};
    var received_events = [];
    var received_events_length = 20;
    var status_ = {status: 2, msg: 'Ready'};
    var state_cache = {};
    var reqid = 0;

    ws_conn.get_ = function(_k) {
        var ret = this[_k];
        if(ret != undefined)
            return ret;

        for(var kk in this) {
            if(kk.indexOf('://') != -1) {
                return this[kk];
            }
        }
        return null;
    }.bind(ws_conn);

    ws_conn.getErrorReason = function() {
        var msg = null;
        var ws_conn = this;
        for(k in ws_conn) {
            var ws = ws_conn[k];
            if( ws.close_status_ != undefined) {
                if(msg == null) {
                    msg = ws.url + ': ' + ws.close_reason_;
                }
                else {
                    msg += '\n' + ws.url + ': ' + ws.close_reason_;
                }
            }
        }
        return msg;
    }.bind(ws_conn);

    received_events.unchecked = function() {
        for(var i=this.length-1; i>=0; i--) {
            if(this[i].checked == undefined) return this[i];
        }
        return null;
    }.bind(received_events);

    ext._shutdown = function() {
        for(k in ws_conn) ws_conn[k].close();
    };

    ext._getStatus = function() {
        return status_;
    };

    ext.connect = function(_url, callback) {
        console.log("ext.connect: %s %O", _url, callback);
        if(_url in ws_conn) {
            console.log("ext.connect: %s readyState:%d", _url, ws_conn[_url].readyState);
            switch(ws_conn[_url].readyState) {
                case 0:
                case 1:
                    return;
                default:
                    //fall through
            }
        }

        var reason = "";
        var ws = null;
        try {
            ws = new WebSocket(_url);
            ws.message = null;
            ws_conn[_url] = ws;
        }
        catch(e) {
            status_.status = 1;
            status_.msg = _url + ' exception: ' + e.message;
            callbacked = true;
            console.log("ext.connect: %s: exception:%o", _url, e);
            callback();
            return;
        }

        var callbacked = false;
        setTimeout( function() {
            if(!callbacked) {
                status_.status = 1;
                status_.msg    = "Connect timeout";
                callbacked = true;
                console.log("ext.connect: %s timeout", _url);
                callback();
            }
        }, 3000 );

        ws.addEventListener('open', function(event) {
            console.log("%s: onopen", _url);

            if(!callbacked) {
                var errmsg = ws_conn.getErrorReason();
                status_.status = (errmsg != null) ? 1 : 2;
                status_.msg    = (errmsg != null) ? errmsg : 'Ready';
                callbacked = true;
                console.log("%s: onopen: callback:%s", _url, status_.msg);
                callback();
            }
        });

        ws.addEventListener('error', function(err) {
            console.log("%s: onerror", ws.url);
            if(!callbacked) {
                status_.status = 1;
                status_.msg    = 'onerror: ' + reason;
                callbacked = true;
                console.log("%s: onerror: msg:%s", _url, status_.msg);
                callback();
            }
        });
        
        ws.addEventListener('message', function(event) {
            console.log("%s: onmessage:", ws.url, event.data);
            if(received_events.length = received_events_length) {
                received_events.shift();
            }
            received_events.push(event);
        });
        
        ws.addEventListener('close', function(event) {
            console.log("%s: onclose: %d", ws.url, event.code);
                 if(event.code == 1001) reason = "1000: CLOSE_NORMAL";
            else if(event.code == 1001) reason = "1001: CLOSE_GOING_AWAY";
            else if(event.code == 1002) reason = "1002:	CLOSE_PROTOCOL_ERROR";
            else if(event.code == 1003) reason = "1003:	CLOSE_UNSUPPORTED";
            else if(event.code == 1004) reason = "1004: RESERVED";
            else if(event.code == 1005) reason = "1005:	CLOSE_NO_STATUS";
            else if(event.code == 1006) reason = "1006:	CLOSE_ABNORMAL";
            else if(event.code == 1007) reason = "1007:	Unsupported Data";
            else if(event.code == 1008) reason = "1008:	Policy Violation";
            else if(event.code == 1009) reason = "1009:	CLOSE_TOO_LARGE";
            else if(event.code == 1010) reason = "1010:	Missing Extension";
            else if(event.code == 1011) reason = "1011:	Internal Error";
            else if(event.code == 1012) reason = "1012:	Service Restart";
            else if(event.code == 1013) reason = "1013:	Try Again Later";
            else if(event.code == 1014) reason = "1014:	RESERVED";
            else if(event.code == 1015) reason = "1015:	TLS Handshake";
            else                        reason = "" + event.code + ": Unknown reason";

            if(event.code != 1000) {
                ws.close_status_ = event.code;
                ws.close_reason_ = reason;

                status_.status = 1;
                status_.msg = ws_conn.getErrorReason();

                if(!callbacked) {
                    callbacked = true;
                    console.log("%s: onclose: msg:%s", _url, status_.msg);
                    callback();
                }
            }
        });
    };

    ext.disconnect = function(arg0, arg1) {
        function(_url, callback) {
            var ws = ws_conn.get_(_url);
            if(ws == null) {
                console.log("ext.disconnect: callback %s not yet init", _url);
                callback();
                return;
            }

            switch(ws.readyState) {
                case 0:
                case 1:
                    console.log("ext.disconnect: close: %s readyState:%d", ws.url, ws.readyState);
                    ws.close();
                    ws.addEventListener('close', function(event) {
                        console.log("%s: onclose callback", ws.url);
                        callback();
                        return;
                    });
            }
            console.log("ext.disconnect: %s: callback default", ws.url);
            callback();
        }(  arg1==undefined ? null : arg0, arg1==undefined ? arg0 : arg1 );
    };

    ext.send = function(data, _url) {
        console.log("ext.send: %s %o", _url, data);
        var ws = ws_conn.get_(_url);
        ws.send(data);
    };

    ext.getMessage = function(_url) {
        console.log("ext.getMessage: %s", _url);
        for(var i=0; i<received_events.length; i++) {
            if(received_events[i].checked != defined && received_events[i].target.url == _url) {
                var r = received_events.splice(i, 1);
                return r[0];
            }
        }

        return null; 
    };

    ext.getLastReceivedMessageOrigin = function() {
        console.log("ext.getLastReceivedMessageOrigin");
        if(received_event.length == 0) 
            return null;
        else
            return received_event[0].target.url;
    };

    ext.onMessageReceived = function() {
        var chk = received_events.unchecked();
        if(chk != null) {
            chk.checked = true;
            return true;
        }
        return false;
    };

    // Tiny Json Library

    ext.emptyObject = function() {
        console.log("ext.emptyObject");
        var obj = new Object();
        return JSON.stringify(obj);
    };

    ext.addJsonProperty = function(propname, propvalue, jsonstr) {
        console.log("ext.addJsonProperty: %s %s %o", propname, propvalue, jsonstr);
        var jsonobj = jsonstr;
        if(jQuery.type(jsonstr) == 'string') {
            jsonobj = JSON.parse(jsonstr);
        }

        jsonobj[propname] = propvalue;
        return JSON.stringify(jsonobj);
    };

    ext.getJsonProperty = function(propname, jsonstr) {
        console.log("ext.getJsonProperty: %s %o", propname, jsonstr);
        var jsonobj = jsonstr;
        if(jQuery.type(jsonstr) == 'string') {
            jsonobj = JSON.parse(jsonstr);
        }

        if(propname in jsonobj) {
            if( jQuery.type(jsonobj[propname]) == 'object') {
                return JSON.stringify(jsonobj[propname]);
            }
            else {
                return jsonobj[propname];
            }
        }
        return null;
    };

    /////////////////////////////////////////////////////////////////////

    ext.getSensorValue = function(prop, callback) {
        console.log("ext.getSensorValue: %s %o", prop, callback);
        var req = {"request": prop, "reqid":reqid};

        var ws = ws_conn.get_(null);
        if(ws == null) {
            console.log("%s getSensorValue: not yet init", ws.url);
            callback(-1);
            return;
        }

        var callbacked = false;
        
        setTimeout( function() {
            if(!callbacked) {
                callbacked = true;
                status_.status = 1;
                status_.msg = "Request timeout";
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
        var ws = ws_conn.get_(null);
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
        var ws = ws_conn.get_(null);
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

    // Register the extension
    ScratchExtensions.register('Fake PicoBoard extension', descriptor, ext);
})();
