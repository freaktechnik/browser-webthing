import { DynamicMultipleThings } from "./dynamic-server.js";
import { WebThingServer } from "webthing";
import WebSocketThing from "./ws-thing.js";
import express from "express";
import { internalIpV4 } from "internal-ip";

const PORT = 8080;

internalIpV4().then((ip) => {
    const things = new DynamicMultipleThings('browser-things');
    const server = new WebThingServer(things, PORT, ip, undefined, [
        {
            path: '/static',
            handler: express.static(new URL('./static', import.meta.url).pathname)
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
                    things.register(thing, thing.id);
                    thing.registered(`${ip}:${PORT}`);
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
