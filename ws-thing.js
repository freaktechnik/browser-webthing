const { Thing, Property, Value, Action } = require("webthing");
const uuid = require("uuid/v4");

class NotifyAction extends Action {
    /**
     * 
     * @param {WebSocketThing} thing
     * @param {string} input
     */
    constructor(thing, input) {
        super(uuid(), thing, 'notify', input);
    }

    /**
     * @returns {Promise<any>}
     */
    performAction() {
        this.thing.send({
            type: 'notify',
            message: this.input
        });
        return super.performAction();
    }
}

class VibrateAction extends Action {
    /**
     * 
     * @param {WebSocketThing} thing
     * @param {number} input
     */
    constructor(thing, input) {
        super(uuid(), thing, 'vibrate', input);
    }

    /**
     * @returns {Promise<any>}
     */
    performAction() {
        this.thing.send({
            type: 'vibrate',
            time: this.input
        });
        return super.performAction();
    }
}

module.exports = class WebSocketThing extends Thing {
    constructor(websocket, spec) {
        super(spec.name, [], 'A web browser');

        this.ws = websocket;
        this.setUiHref('/static');

        for(const sensor of spec.sensors) {
            this.addSensor(sensor);
        }

        this.addProperty(new Property(this, 'visibile', new Value(!spec.hidden), {
            readOnly: true,
            type: 'boolean',
            title: 'Page visible'
        }));

        if(spec.can.notify) {
            this.addAvailableAction('notify', {
                title: 'Notify',
                input: {
                    type: 'string'
                }
            }, NotifyAction);
        }
        if(spec.can.vibrate) {
            this.addAvailableAction('vibrate', {
                title: 'Vibrate',
                input: {
                    type: 'integer',
                    minimum: 0,
                    default: 10
                }
            }, VibrateAction);
        }
    }

    addSensor(sensor) {
        const desc = {
            readOnly: true,
            type: 'number',
            title: sensor.type
        };
        this.addProperty(new Property(this, sensor.type, new Value(sensor.value), desc));
    }

    updateSensor(sensor) {
        const prop = this.findProperty(sensor.type);
        if(prop) {
            prop.setValue(sensor.value);
        }
    }

    /**
     * 
     * @param {boolean} hidden
     */
    updateVisibility(hidden) {
        this.findProperty('visible').setValue(!hidden);
    }

    /**
     * @param {any} msg
     */
    send(msg) {
        this.ws.send(JSON.stringify(msg));
    }
};