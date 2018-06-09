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


        var keys = RED.nodes.getNode(n.keys);
        var credentials = RED.nodes.getCredentials(n.credentials);

        this.warn('credentials: ' + JSON.stringify(credentials));
        this.warn('keys: ' + JSON.stringify(keys));

        if (keys) {
            if (!keys.userKey) { this.error('No pushover user key'); }
            else {this.warn('userKey: ' + keys.userKey);}
            if (!keys.token) { this.error('No pushover token'); }
            else {this.warn('token: ' + keys.token);}
        } else {
            this.error('No pushover keys configuration');
        }

        var push = function(form){
            request.post({ url: 'https://api.pushover.net/1/messages.json?html=1', formData: form }, function(err,httpResponse,body){
                let result = JSON.parse(body);
                if (result.status != 1) {
                    node.error('Pushover error: ' + JSON.stringify(result.errors));
                } else {
                    node.log('pushover POST succeeded:\n' + JSON.stringify(body));
                }
            }).on('error', function(err) {
                this.error('Pushover error: ' + err);
            });
        };

        var node = this;

        this.on('input',function(msg) {
            msg.payload = typeof(msg.payload) === 'object' ? JSON.stringify(msg.payload) : msg.payload.toString();
            if (msg.payload == '' || typeof(msg.payload) != 'string'){
                node.error('Pushover error: payload has no string');
            }
            if (msg.priority > 2 || msg.priority < -2) {
                node.error('priority out of range');
            }

            let notification = {
                'token'      : node.token,
                'user'       : node.userKey,
                'message'    : msg.payload,
                'device'     : msg.device,
                'title'      : node.title || msg.topic || 'Node-RED Notification',
                'url'        : msg.url,
                'url_title'  : msg.url_title,
                'priority'   : msg.priority,
                'sound'      : msg.sound,
                // 'attachment'
            };

            for (let k in notification) {
                if (!notification[k]) { delete notification[k]; }
            }

            if (msg.attachment) {
                if (msg.attachment.match(/^(\w+:\/\/)/igm)) {
                    // attachment is remote file
                    request.get({url: msg.attachment, encoding: null}, function(error, response, body){
                        fs.writeFileSync('/tmp/pushover-image', body);
                        notification.attachment = fs.createReadStream('/tmp/pushover-image');
                        push(notification);
                    }).on('error', function(err) {
                        node.error('Pushover error: ' + err);
                    });
                } else {
                    // attachment is local file
                    notification.attachment = fs.createReadStream(msg.attachment);
                    push(notification);
                }
            } else {
                push(notification);
            }
        });
    }
    RED.nodes.registerType('pushover',PushoverNode);
};