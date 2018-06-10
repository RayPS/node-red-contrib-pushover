node-red-contrib-pushover
======================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to send alerts via <a href="http://www.pushover.net/" target="_new">Pushover</a>.

Supports notification image attachment.

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm install node-red-contrib-pushover


Usage
-----

Uses Pushover to push notification to a device that has the Pushover app installed.

- `msg.payload`(required): The body of the notification, supports a [few html tags](https://pushover.net/api#html)
- `msg.topic`: This will be used as the title of the notification if `Title` is not set
- `msg.image`: The URL of the image in notification. Local file path or http(s) url
- `msg.url`: Can add an url to your notification
- `msg.url_title`: Can set the title of the url
- `msg.priority`: -2/-1/1/2, [see explain](https://pushover.net/api#priority)
- `msg.device`: Default for all device if not provided. Separated by a comma
- `msg.sound`: Name of the notification sound, [see the list](https://pushover.net/api#sounds)


See <a href="https://pushover.net" target="_new">Pushover.net</a> for more details.
