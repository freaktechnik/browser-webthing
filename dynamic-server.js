const uuid = require("uuid/v4");

exports.DynamicMultipleThings = class MultipleThings {
    /**
     * 
     * @param {string} name
     */
    constructor(name) {
        this.name = name;
        this.things = new Map();
    }

    /**
     * 
     * @param {string} idx
     * @return {WebSocketThing}
     */
    getThing(idx) {
        return this.things.get(idx);
    }

    getThings() {
        return Array.from(this.things.values());
    }

    getName() {
        return this.name;
    }

    /**
     * 
     * @param {WebSocketThing} thing
     * @param {string} [id=uuid]
     * @return {string}
     */
    register(thing, id = uuid()) {
        this.things.set(id, thing);
        thing.setHrefPrefix(`/${id}`);
        return id;
    }

    /**
     * 
     * @param {WebSocketThing} thing
     */
    unregister(thing) {
        const entry = Array.from(this.things.entries()).find(([i, e]) => e === thing);
        if(entry) {
            this.things.delete(entry[0])
        }
    }
};