module.exports = function(RED) {
    'use strict';
    const request = require('request');
    const fs = require('fs');





    function PushoverKeys(n) {
        RED.nodes.createNode(this,n);
        this.userKey = n.userKey;
        this.token = n.token;
    }

    RED.nodes.registerType('pushover-keys',PushoverKeys,{
        credentials: {
            userKey: {type:'text'},
            token: {type: 'text'}
        }
    });





    function PushoverNode(n) {
        RED.nodes.createNode(this,n);

        this.title = n.title;
        this.keys = RED.nodes.getCredentials(n.keys);

        if (this.keys) {
            if (!this.keys.userKey) { this.error('No pushover user key'); }
            if (!this.keys.token) { this.error('No pushover token'); }
        } else {
            this.error('No pushover keys configuration');
        }

        var node = this;

        this.on('input',function(msg) {

            if (!msg.payload || typeof(msg.payload) != 'string'){
                node.error('Pushover error: payload has no string');
            }

            let notification = {
                'title'      : node.title || msg.topic || 'Node-RED Notification',
                'token'      : node.keys.token,
                'user'       : node.keys.userKey,
                'message'    : msg.payload,
                'attachment' : msg.image ? parseImageUrl() : null,
                'device'     : msg.device,
                'url'        : msg.url,
                'url_title'  : msg.url_title,
                'priority'   : msg.priority,
                'sound'      : msg.sound,
                'timestamp'  : msg.timestamp
            };

            for (let k in notification) {
                if (!notification[k]) { delete notification[k]; }
            }

            function parseImageUrl() {
                let hasProtocol = msg.image.match(/^(\w+:\/\/)/igm);
                if (hasProtocol) {
                    return request.get({url: msg.image, encoding: null}).on('error', function(err){ node.error('image error: ' + err); });
                } else {
                    return fs.createReadStream(msg.image);
                }
            }

            function push(form){
                let pushoverAPI = 'https://api.pushover.net/1/messages.json?html=1';
                request.post({ url: pushoverAPI, formData: form }, function(err,httpResponse,body){
                    let result = JSON.parse(body);
                    if (result.status != 1) {
                        node.error('Pushover error: ' + JSON.stringify(result.errors));
                    } else {
                        node.log('pushover POST succeeded:\n' + JSON.stringify(body));
                    }
                }).on('error', function(err) {
                    this.error('Pushover error: ' + err);
                });
            }

            push(notification);
        });
    }
    RED.nodes.registerType('pushover api',PushoverNode);





    function PushoverGlancesNode(n) {
        RED.nodes.createNode(this,n);

        this.keys = RED.nodes.getCredentials(n.keys);
        this.title = n.title;
        this.text = n.text;
        this.subtext = n.subtext;

        if (this.keys) {
            if (!this.keys.userKey) { this.error('No pushover user key'); }
            if (!this.keys.token) { this.error('No pushover token'); }
        } else {
            this.error('No pushover keys configuration');
        }

        var node = this;

        this.on('input',function(msg) {

            msg.count = parseInt(msg.count);
            msg.percent = Math.min(100, Math.max(0, parseInt(msg.percent)));

            let glances = {
                'token'   : node.keys.token,
                'user'    : node.keys.userKey,
                'title'   : node.title || msg.topic,
                'text'    : node.text || msg.payload,
                'subtext' : node.subtext || msg.subtext,
                'count'   : msg.count,
                'percent' : msg.percent,
                'device'  : msg.device
            };

            for (let t in ['title', 'text', 'subtext']) {
                if (glances[t]) {
                    glances[t] = String(glances[t]);
                    if (glances[t].length > 100) {
                        node.error(`Pushover error: length of "msg.${t}" should less than 100`);
                        glances[t] = glances[t].slice(0, 100);
                    }
                }
            }

            for (let k in glances) {
                if (!glances[k]) { delete glances[k]; }
            }

            function push(form){
                let pushoverAPI = 'https://api.pushover.net/1/glances.json';
                request.post({ url: pushoverAPI, formData: form }, function(err,httpResponse,body){
                    let result = JSON.parse(body);
                    if (result.status != 1) {
                        node.error('Pushover error: ' + JSON.stringify(result.errors));
                    } else {
                        node.log('pushover POST succeeded:\n' + JSON.stringify(body));
                    }
                }).on('error', function(err) {
                    this.error('Pushover error: ' + err);
                });
            }

            if (Object.keys(glances).length > 2) {
                push(glances);
            } else {
                node.warn('Pushover glances has nothing to send');
            }
        });
    }
    RED.nodes.registerType('glances',PushoverGlancesNode);
};