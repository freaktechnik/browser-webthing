const { DynamicMultipleThings } = require("./dynamic-server");
const { WebThingServer } = require("webthing");
const WebSocketThing = require("./ws-thing");
const express = require("express");
const path = require("path");
const internalIp = require("internal-ip");

const PORT = 8080;

internalIp.v4().then((ip) => {
    const things = new DynamicMultipleThings('browser-things');
    const server = new WebThingServer(things, PORT, ip, undefined, [
        {
            path: '/static',
            handler: express.static(path.join(__dirname, 'static'))
        },
    ]);

    server.app.ws('/comm/ws', (ws) => {
        let thing;
        ws.on('message', (rawMessage) => {
            const message = JSON.parse(rawMessage);
            if(message.type !== 'create' && !thing) {
                ws.send(JSON.stringify({type: 'error', message: 'You must first initialize the thing.'}));
            }
            switch(message.type) {
                case 'create':
                    thing = new WebSocketThing(ws, message);
                    id = things.register(thing, message.id || undefined);
                    thing.send({
                        type: 'created',
                        url: `http://${ip}:${PORT}/${id}`,
                        id
                    });
                    break;
                case 'update':
                    for(const sensor of message.sensors) {
                        thing.updateSensor(sensor);
                    }
                    break;
                case 'visibilitychange':
                    thing.updateVisibility(message.hidden);
                    break;
                default:
                    console.log("unknown message", message);
            }
        });
        ws.on('close', () => {
            things.unregister(thing);
        });
    });

    server.start();
});