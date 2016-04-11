new (function() {
    var ext = this;

    var ws_conn = {};
    var message_received = false;
    var last_message_origin = null;
    //var last_message = null;
    var status_ = {status: 2, msg: 'Ready'};
    var state_cache = {};
    var reqid = 0;

    function get_first_or_value(_k) {
        var ret = this[_k];
        if(ret != undefined)
            return ret;

        for(var kk in this) {
            if(kk.indexOf('://') != -1) {
                return this[kk];
            }
        }
    }
    ws_conn.get_ = get_first_or_value.bind(ws_conn);

    ext._shutdown = function() {
        for(k in ws_conn) ws_conn[k].close();
    };

    ext._getStatus = function() {
        return status_;
    };

    ext.connect = function(_url, callback) {
        if(_url in ws_conn) {
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
            callback(-1);
            return;
        }

        var callbacked = false;
        setTimeout( function() {
            status_.status = 1;
            status_.msg = "Connect timeout";

            if(!callbacked) {
                callbacked = true;
                callback(-1);
            }
        }, 3000 );

        ws.addEventListener('open', function(event) {
            var msg = "";
            var check = false;
            for(k in ws_conn) {
                var ws = ws_conn[k];
                if( ws.close_status_ != undefined && ws.close_status_ != 1000) {
                    check = true;
                    msg += ws.url + ': ' + ws.close_reason_ + '\n';
                }
            }
            if(check) {
                status_.status = 1;
                status_.msg = msg;
            }
            else {
                status_.status = 2;
                status_.msg = 'Ready';
            }

            if(!callbacked) {
                callbacked = true;
                callback();
            }
        });

        ws.addEventListener('error', function(err) {
            status_.status = 1;
            status_.msg = 'onerror: ' + reason;

            if(!callbacked) {
                callbacked = true;
                callback(-1);
            }
        });
        
        ws.addEventListener('message', function(event) {
            message_received = true;
            ws.message = event;
            last_message_origin = ws.url;
            //last_message = event;
        });
        
        ws.addEventListener('close', function(event) {
            // See http://tools.ietf.org/html/rfc6455#section-7.4.1
            if (event.code == 1000)
                reason = "Normal closure, meaning that the purpose for which the connection was established has been fulfilled.";
            else if(event.code == 1001)
                reason = "An endpoint is \"going away\", such as a server going down or a browser having navigated away from a page.";
            else if(event.code == 1002)
                reason = "An endpoint is terminating the connection due to a protocol error";
            else if(event.code == 1003)
                reason = "An endpoint is terminating the connection because it has received a type of data it cannot accept (e.g., an endpoint that understands only text data MAY send this if it receives a binary message).";
            else if(event.code == 1004)
                reason = "Reserved. The specific meaning might be defined in the future.";
            else if(event.code == 1005)
                reason = "No status code was actually present.";
            else if(event.code == 1006)
               reason = "The connection was closed abnormally, e.g., without sending or receiving a Close control frame";
            else if(event.code == 1007)
                reason = "An endpoint is terminating the connection because it has received data within a message that was not consistent with the type of the message (e.g., non-UTF-8 [http://tools.ietf.org/html/rfc3629] data within a text message).";
            else if(event.code == 1008)
                reason = "An endpoint is terminating the connection because it has received a message that \"violates its policy\". This reason is given either if there is no other sutible reason, or if there is a need to hide specific details about the policy.";
            else if(event.code == 1009)
               reason = "An endpoint is terminating the connection because it has received a message that is too big for it to process.";
            else if(event.code == 1010) // Note that this status code is not used by the server, because it can fail the WebSocket handshake instead.
                reason = "An endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension, but the server didn't return them in the response message of the WebSocket handshake. <br /> Specifically, the extensions that are needed are: " + event.reason;
            else if(event.code == 1011)
                reason = "A server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request.";
            else if(event.code == 1015)
                reason = "The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified).";
            else
                reason = "Unknown reason";

            if(event.code != 1000) {
                status_.status = 1;
                status_.msg = _url + ': ' + reason;
                ws.close_status_ = event.code;
                ws.close_reason_ = reason;

                if(!callbacked) {
                    callbacked = true;
                    callback(-1);
                }
            }
        });
    };

    ext.disconnect = function(_url) {
        var ws = ws_conn.get_(_url);
        switch(ws.readyState) {
            case 0:
            case 1:
            ws.close();
        }
    };

    ext.send = function(data, _url) {
        var ws = ws_conn.get_(_url);
        ws.send(data);
    };

    ext.getMessage = function(_url) {
        var ws = ws_conn.get_(_url);
        return ws.message;

        /*
        if(_url in ws_conn && ws_conn[_url].message != null) {
            var ret = ws_conn[_url].message.data;
            if(last_message === ws_conn[_url].message) {
                last_message = null;
            }
            ws_conn[_url].message = null;
            return ret;
        }
        return null;
        */
    };

    ext.getLastReceivedMessage = function(_url) {
        var ws = ws_conn.get_(_url);
        return ws.message;
        //var tmp = last_message;
        //last_message = null;
        //return tmp;
    };
    
    ext.getLastReceivedMessageOrigin = function() {
        return last_message_origin;
        //if(last_message != null) {
        //    return last_message.origin;
        //}
        //return null;
    };

    ext.onMessageReceived = function() {
        if(message_received == true) {
            message_received = false;
            return true;
        }
        return false;
    };

    // Tiny Json Library

    ext.emptyObject = function() {
        var obj = new Object();
        return JSON.stringify(obj);
    };

    ext.addJsonProperty = function(propname, propvalue, jsonstr) {
        var jsonobj = jsonstr;
        if(jQuery.type(jsonstr) == 'string') {
            jsonobj = JSON.parse(jsonstr);
        }

        jsonobj[propname] = propvalue;
        return JSON.stringify(jsonobj);
    };

    ext.getJsonProperty = function(propname, jsonstr) {
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

    ext.getSensorValue = function(prop, callback) {
        var ws = ws_conn.get_(null);
        var req = {"request": prop, "reqid":reqid};

        var callbacked = false;
        
        setTimeout( function() {
            if(!callbacked) {
                callbacked = true;
                callback();
                status_.status = 1;
                status_.msg = "Request timeout";
            }
        }, 3000 );

        ws.addEventListener('message', function(event) {
            var resp = JSON.parse(event.data);
            var _req = req;
            if(!callbacked) {
                if(resp.response == prop) {
                    callbacked = true;
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
        var ws = ws_conn.get_(null);
        ws.addEventListener('message', state_received);

        if(state_cache[prop].update && state_cache[prop].value != 0) {
            return true;
        }
    };

    ext.onSensorValueChanged = function(prop, lessmore, threshold) {
        var ws = ws_conn.get_(null);
        ws.addEventListener('message', state_received);

        var value = state_cache[prop].value;
        if(state_cache[prop].update) {
            if(lessmore == '<') {
                return (value < threshold);
            }
            else {
                return (value > threshold);
            }
        }
    };

    // Block and block menu descriptions
    var descriptor = {
        blocks: [
            ['w', 'connect to %s', 'connect'],
            [ '', 'disconnect', 'disconnect'],
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
