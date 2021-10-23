import { MultipleThings } from 'webthing';

export class DynamicMultipleThings extends MultipleThings {
    /**
     *
     * @param {string} name
     */
    constructor(name) {
        super([], name);
        this.things = new Map();
    }

    /**
     *
     * @param {string} [index]
     * @return {WebSocketThing}
     */
    getThing(index) {
        if(this.things.has(index)) {
            return this.things.get(index);
        }
        if(Number.isInteger(index)) {
            return Array.from(this.things.values())[index];
        }
        return null;
    }

    getThings() {
        return Array.from(this.things.values());
    }

    /**
     *
     * @param {WebSocketThing} thing
     * @param {string} id
     */
    register(thing, id) {
        this.things.set(id, thing);
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
}
