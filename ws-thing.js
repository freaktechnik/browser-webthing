import { Thing, Property, Value, Action } from "webthing";
import { v4 as uuid } from "uuid";

const SENSOR_UNIT = {
    AmbientLightSensor: 'lux',
    ProximitySensor: 'cm',
    Gyroscope: 'rad/s',
    Accelerometer: 'm/s²'
};

class NotifyAction extends Action {
    /**
     *
     * @param {WebSocketThing} thing
     * @param {string} input
     */
    constructor(thing, input) {
        super(uuid(), thing, 'notify', input);
    }

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

    performAction() {
        this.thing.send({
            type: 'vibrate',
            time: this.input
        });
        return super.performAction();
    }
}

export default class WebSocketThing extends Thing {
    constructor(websocket, spec) {
        super(spec.id || uuid(), spec.name, [], 'A web browser');

        this.ws = websocket;
        this.setUiHref('/static');
        this.setHrefPrefix(`/${this.id}`);

        for(const sensor of spec.sensors) {
            this.addSensor(sensor);
        }

        this.addProperty(new Property(this, 'visible', new Value(!spec.hidden), {
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

    /**
     * Called when the thing was made available in the server.
     * @param {string} host - Host the thing is available at.
     */
    registered(host) {
        this.send({
            type: 'created',
            url: `http://${host}/${this.id}`,
            id: this.id
        });
    }

    addSensor(sensor) {
        const desc = {
            readOnly: true,
            type: 'number',
            title: sensor.type,
            unit: SENSOR_UNIT[sensor.type]
        };
        this.addProperty(new Property(this, sensor.type, new Value(sensor.value), desc));
    }

    updateSensor(sensor) {
        const property = this.findProperty(sensor.type);
        if(property) {
            property.value.notifyOfExternalUpdate(sensor.value);
        }
    }

    /**
     *
     * @param {boolean} hidden
     */
    updateVisibility(hidden) {
        this.findProperty('visible').value.notifyOfExternalUpdate(!hidden);
    }

    /**
     * @param {any} msg
     */
    send(msg) {
        this.ws.send(JSON.stringify(msg));
    }
}
