const SENSOR_PERMISSIONS = {
    // accelerometer: 'Accelerometer',
    'ambient-light-sensor': 'AmbientLightSensor',
    // gyroscope: 'Gyroscope',
    // magnetometer: 'Magnetometer', and UncalibratedMagnetometer
    'proximity-sensor': 'ProximitySensor'
};

const SENSOR_PROP = {
    'AmbientLightSensor': 'illuminance',
    'ProximitySensor': 'distance'
};

const getSensors = async () => {
    const sensors = [];
    for(const [permission, constructor] of Object.entries(SENSOR_PERMISSIONS)) {
        try {
            const hasPermission = await navigator.permissions.query({ name: permission });
            if(hasPermission.state === 'granted' && constructor in window) {
                sensors.push({
                    type: constructor,
                    value: 0
                });
            }
        }
        catch(e) {
            // Permission probably doesn't exist
        }
    }
};

const canNotify = () => Notification.permission === 'granted';
const canVibrate = () => !!navigator.vibrate;

const stopThing = (ws) => {
    if(ws) {
        ws.close();
    }
    else {
        //TODO clean up all the listeners and sensors
        document.getElementById("start").disabled = false;
        document.getElementById("name").disabled = false;
        document.getElementById("notify").disabled = false;
        document.getElementById("vibrate").disabled = false;
        document.getElementById("stop").disabled = true;
        document.getElementById("running").hidden = true;
    }
}

const createThing = (name, spec = {}) => {
    localStorage.setItem('name', name);
    const ws = new WebSocket('ws://' + location.host + '/comm/ws');
    ws.addEventListener('open', () => {
        getSensors().then((sensors = []) => {
            ws.send(JSON.stringify({
                type: 'create',
                name,
                sensors,
                hidden: document.hidden,
                can: {
                    notify: canNotify() && spec.notify,
                    vibrate: canVibrate() && spec.vibrate
                },
                id: localStorage.getItem('id')
            }));
            for(const sensor of sensors) {
                const instance = new window[sensor.type]();
                instance.addEventListener("reading", () => {
                    if(instance.hasReading) {
                        ws.send(JSON.stringify({
                            type: 'update',
                            sensors: [
                                {
                                    type: sensor.type,
                                    value: instance[SENSOR_PROP[sensor.type]]
                                }
                            ]
                        }));
                    }
                });
                instance.start();
            }
            document.addEventListener('visibilitychange', () => {
                ws.send(JSON.stringify({
                    type: 'visibilitychange',
                    hidden: document.hidden
                }));
            }, { passive: true });
        });
    });
    ws.addEventListener('message', (event) => {
        let message = {};
        try {
            message = JSON.parse(event.data);
        }
        catch(e) {
            console.error("Unexpected websocket message", event);
            return;
        }
        switch(message.type) {
            case 'error':
                console.error(message.message);
                break;
            case 'created':
                document.getElementById("url").href = message.url;
                document.getElementById("running").hidden = false;
                document.getElementById("stop").disabled = false;
                localStorage.setItem('id', message.id)
                break;
            case 'notify':
                new Notification(message.message);
                break;
            case 'vibrate':
                navigator.vibrate(message.time);
                break;
            default:
                console.log(message);
        }
    });
    const listener = () => {
        stopThing(ws);
    };
    ws.addEventListener("close", () => {
        stopThing();
        document.getElementById("stop").removeEventListener("click", listener);
    });

    document.getElementById("stop").addEventListener("click", listener, { passive: true, once: true });
};

const requestSensorsPermission = () => {
    if(navigator.permissions && navigator.permissions.request) {
        for(const permission of Object.keys(SENSOR_PERMISSIONS)) {
            navigator.permissions.request({ name: permission });
        }
    }
};

const requestNotificationPermission = () => Notification.requestPermission();
const requestVibrationPermission = () => navigator.vibrate(1);

document.addEventListener("DOMContentLoaded", () => {
    const notify = document.getElementById("notify");
    const vibrate = document.getElementById("vibrate");
    const start = document.getElementById("start");
    const name = document.getElementById("name");
    start.addEventListener("click", () => {
        requestSensorsPermission();
        if(notify.checked && !canNotify()) {
            requestNotificationPermission();
        }
        createThing(name.value, {
            notify: notify.checked,
            vibrate: vibrate.checked
        });
        start.disabled = true;
        notify.disabled = true;
        vibrate.disabled = true;
        name.disabled = true;
    }, { passive: true });
    vibrate.addEventListener("change", () => {
        if(vibrate.checked) {
            requestVibrationPermission();
        }
    }, { passive: true });
    notify.addEventListener("change", () => {
        if(notify.checked) {
            requestNotificationPermission().then((result) => {
                if(result !== 'granted') {
                    notify.checked = false;
                }
            });
        }
    }, { passive: true });
    name.value = localStorage.getItem('name') || '';
}, {
    once: true,
    passive: true
});
