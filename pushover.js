module.exports = function(RED) {
    'use strict';
    const request = require('request');
    const fs = require('fs');

    function PushoverNode(n) {
        RED.nodes.createNode(this,n);

        this.title = n.title;
        var credentials = this.credentials;
        if ((credentials) && (credentials.hasOwnProperty('token'))) { this.token = credentials.token; }
        else { this.error('No Pushover api token set'); }
        if ((credentials) && (credentials.hasOwnProperty('userKey'))) { this.userKey = credentials.userKey; }
        else { this.error('No Pushover user key set'); }

        var push = function(form){
            console.log(form);
            request.post({ url: 'https://api.pushover.net/1/messages.json?html=1', formData: form }, function(err,httpResponse,body){
                let result = JSON.parse(body);
                if (result.status != 1) {
                    node.error('Pushover error: ' + JSON.stringify(result.errors));
                } else {
                    node.log('pushover succeeded: ' + JSON.stringify(body));
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
                'title'      : node.title || msg.topic || 'Node-RED',
                'url'        : msg.url,
                'url_title'  : msg.url_title,
                'priority'   : msg.priority,
                'sound'      : msg.sound,
                // 'attachment'
            };

            for (let k in notification) {
                if (!notification[k]) { delete notification[k]; }
            }

            if (msg.attachment && msg.attachment.match(/^(\w+:\/\/)/igm)) {
                request.get({url: msg.attachment, encoding: null}, function(error, response, body){
                    fs.writeFileSync('/tmp/pushover-image', body);
                    notification.attachment = fs.createReadStream('/tmp/pushover-image');
                    push(notification);
                }).on('error', function(err) {
                    node.error('Pushover error: ' + err);
                });
            } else {
                notification.attachment = msg.attachment;
            }
        });
    }
    RED.nodes.registerType('pushover',PushoverNode,{
        credentials: {
            userKey: {type:'text'},
            token: {type: 'text'}
        }
    });
};