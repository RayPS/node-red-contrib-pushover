module.exports = function(RED) {
    "use strict";

    function PushoverNode(n) {
        RED.nodes.createNode(this,n);

        this.title = n.title;
        var credentials = this.credentials;
        if ((credentials) && (credentials.hasOwnProperty("token"))) { this.token = credentials.token; }
        else { this.error("No Pushover api token set"); }
        if ((credentials) && (credentials.hasOwnProperty("userKey"))) { this.userKey = credentials.userKey; }
        else { this.error("No Pushover user key set"); }

        var node = this;

        this.on("input",function(msg) {
            msg.payload = typeof(msg.payload) === 'object' ? JSON.stringify(msg.payload) : msg.payload.toString()
            if (msg.priority > 2 || msg.priority < -2) {
                this.error("priority out of range")
                msg.priority = 0
            }
            let notification = {
                "token"      : this.token,
                "user"       : this.userKey,
                "message"    : msg.payload,
                "attachment" : msg.attachment || null,
                "device"     : msg.device,
                "title"      : this.title || msg.topic || "Node-RED",
                "url"        : msg.url || null,
                "url_title"  : msg.url_title || null,
                "priority"   : msg.priority || 0,
                "sound"      : msg.sound || null,
            }
            
            this.warn(notification)
        });
    }
    RED.nodes.registerType("pushover",PushoverNode,{
        credentials: {
            userKey: {type:"text"},
            token: {type: "text"}
        }
    });
}