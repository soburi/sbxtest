/*
  Copyright (c) 2016 TOKITA Hiroshi.  All right reserved.

  This library is free software; you can redistribute it and/or
  modify it under the terms of the GNU Lesser General Public
  License as published by the Free Software Foundation; either
  version 2.1 of the License, or (at your option) any later version.

  This library is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
  See the GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public
  License along with this library; if not, write to the Free Software
  Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

new (function() {
    let ext_ = this;

    // Extension name
    const name = 'Fake-PicoBoard extension';

    // Block and block menu descriptions
    const descriptor = {
        blocks: [
            ['w', 'connect to %s', 'connect'],
            ['w', 'disconnect', 'disconnect'],
            ['b', 'sensor %m.booleanSensor?', 'getSensorBoolValue'],
            ['r', '%m.sensor sensor value', 'getSensorValue'],
            ['h', 'when %m.booleanSensor', 'onButtonChanged'],
            ['h', 'when %m.sensor %m.lessMore %n', 'onSensorValueChanged'],
        ],
        menus: {
            lessMore: ['<', '>'],
            booleanSensor: ['button pressed', 'A connected', 'B connected', 'C connected', 'D connected'],
            sensor: ['slider', 'light', 'sound', 'resistance-A', 'resistance-B', 'resistance-C', 'resistance-D'],
        },
    };

    const proptable = {
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

    let fake_picoboard_ext_init = function(ext) {

        let state_cache = {};
        let last_probed = {};

        ext.api.setInternalEventCheckHook( function(event) {
            return true;
        });

        ext.api.addEventListener('message-received', function(event) {
            let recv = JSON.parse(event.data);
            if(recv.notify != undefined) {

                for(k in recv.notify) {
                    state_cache[k] = recv.notify[k];
                    if(last_probed[k] == undefined) {
                        last_probed[k] = recv.notify[k];
                    }
                }
            }
        });

        ext.getSensorValue = function(prop) {
            //console.log("ext.getSensorValue: %s %o", prop, callback);

            let key = proptable[prop];
            if(key == undefined) return "";

            let state = state_cache[key];
            if(state == undefined) return "";
            
            return state.value;
        };

        ext.getSensorBoolValue = function(prop) {
            return (ext.getSensorValue(prop) ? true : false);
        };

        ext.onButtonChanged = function(prop) {
            //console.log("ext.onButtonChanged: %s", prop);

            let key = proptable[prop];
            if(proptable[prop]  == undefined) return false;

            let last_value = last_probed[key];
            let new_value = state_cache[key];
            if(last_value == undefined) return false;
            if( new_value == undefined) return false;

            last_probed[key] = new_value;

            if(last_value != new_value && new_value == true) {
                return true;
            }

            return false;
        };

        ext.onSensorValueChanged = function(prop, lessmore, threshold) {
            //console.log("ext.onSensorValueChanged: %s %s %d", prop, lessmore, threshold);

            let key = proptable[prop];
            if(proptable[prop]  == undefined) return false;

            let last_value = last_probed[key];
            let new_value = state_cache[key];
            if(last_value == undefined) return false;
            if( new_value == undefined) return false;

            last_probed[key] = new_value;

            if(last_value != new_value) {
                if( (lessmore == '<' && last_value >= threshold && new_value < threshold)  &&
                    (lessmore == '>' && last_value <= threshold && new_value > threshold) ) {
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
            var eventTarget = document.createDocumentFragment();
            ws_ext_init(ext_, eventTarget);
            fake_picoboard_ext_init(ext_);
        });
    
})();
