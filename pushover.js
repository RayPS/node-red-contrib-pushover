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
                'token'      : node.keys.token,
                'user'       : node.keys.userKey,
                'message'    : msg.payload,
                'device'     : msg.device,
                'title'      : node.title || msg.topic || 'Node-RED Notification',
                'url'        : msg.url,
                'url_title'  : msg.url_title,
                'priority'   : msg.priority,
                'sound'      : msg.sound,
                'attachment' : msg.image ? parseImageUrl() : null
            };

            for (let k in notification) {
                if (!notification[k]) { delete notification[k]; }
            }

            function parseImageUrl() {
                let hasProtocol = msg.image.match(/^(\w+:\/\/)/igm)
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
    RED.nodes.registerType('pushover',PushoverNode);
};