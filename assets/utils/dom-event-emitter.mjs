import { global, document, isArray, isBool, isFunction, isPlainObject, isString, isValidSelector } from './utils.mjs';

const
    isEventTarget = obj => obj instanceof Object && isFunction(obj.addEventListener) && isFunction(obj.dispatchEvent),
    ELEMENT_BINDING_KEY = '_emitter';




/**
 * EventEmitter v3
 */
export class EventEmitter
{
    #target;
    get #listeners()
    {
        return this.#target[ELEMENT_BINDING_KEY];
    }
    set #listeners(data)
    {
        if (isArray(data))
        {
            this.#target[ELEMENT_BINDING_KEY] = data;
        }
    }
    constructor(target)
    {

        target ??= global;

        if (isValidSelector(target))
        {
            target = document.querySelector(target);
        }

        if (!isEventTarget(target))
        {
            throw new TypeError('target is not an event target');
        }

        this.#target = target;

        if (!target.hasOwnProperty(ELEMENT_BINDING_KEY))
        {
            Object.defineProperty(target, ELEMENT_BINDING_KEY, {
                enumerable: false, configurable: true, writable: true,
                value: []
            });
        }
    }

    /**
     * Adds an event listener
     * 
     * @param {String} type 
     * @param {Function} listener 
     * @param {Boolean|Object} [options] 
     * @returns EventEmitter
     */
    on(type, listener, options)
    {

        if (!isString(type))
        {
            throw new TypeError('type must be a String');
        }
        if (!isFunction(listener))
        {
            throw new TypeError('listener must be a Function');
        }

        options ??= {};

        let params = {
            once: false,
            capture: false,
        }, handler = listener;


        if (isBool(options))
        {
            params.capture = options;
        } else if (isPlainObject(options))
        {
            Object.assign(params, options);
        }

        if (params.once)
        {
            handler = e =>
            {
                this.off(e.type, listener, params.capture);
                listener.call(this.#target, e);
            };
        }

        this.#listeners = this.#listeners.concat(type.split(/\s+/).map(type =>
        {
            this.#target.addEventListener(type, handler, params);
            return {
                type,
                listener,
                capture: params.capture
            };
        }));

        return this;
    }
    /**
     * Adds an event listener to be trigerred once
     * 
     * @param {String} type 
     * @param {Function} listener 
     * @param {Boolean|Object} [options] 
     * @returns EventEmitter
     */

    one(type, listener, options)
    {

        let params = {
            once: true,
            capture: false
        };

        if (isBool(options))
        {
            params.capture = options;
        } else if (isPlainObject(options))
        {
            Object.assign(params, options);
        }

        return this.on(type, listener, options);

    }

    /**
     * Removes an event listener(s)
     * 
     * @param {String} type 
     * @param {Function} [listener] 
     * @param {Boolean} [capture] 
     * @returns EventEmitter
     */
    off(type, listener, capture)
    {

        if (!isString(type))
        {
            throw new TypeError('type must be a String');
        }
        if (!isFunction(listener))
        {
            capture = listener;
        }
        if (!isBool(capture))
        {
            capture = false;
        }

        const types = type.split(/\s+/);

        this.#listeners = this.#listeners.filter(item =>
        {
            if (types.includes(item.type) && capture === item.capture)
            {
                if (!isFunction(listener) || listener === item.listener)
                {
                    this.#target.removeEventListener(item.type, item.listener, item.capture);
                    return true;
                }
            }
            return true;
        });
        return this;
    }

    /**
     * Dispatches an event
     * 
     * @param {String|Event} type 
     * @param {Any} [data] 
     * @returns EventEmitter
     */
    trigger(type, data = null)
    {


        let event = type, init = {
            bubbles: this.#target.parentElement !== null,
            cancelable: true,
        };

        if (event instanceof Event)
        {
            event.data ??= data;
            this.#target.dispatchEvent(event);
            return this;
        }

        if (!isString(type))
        {
            throw new TypeError('type must be a String|Event');
        }

        type.split(/\s+/).forEach(type =>
        {
            event = new Event(type, init);
            event.data = data;
            this.#target.dispatchEvent(event);
        });

        return this;
    }

    /**
     * Adds a global event listener
     * 
     * @param {String} type 
     * @param {Function} listener 
     * @param {Boolean|Object} [options] 
     * @returns EventEmitter
     */
    static on(type, listener, options)
    {
        return instance.on(type, listener, options);
    }

    /**
     * Adds a global event listener to be triggered once
     * 
     * @param {String} type 
     * @param {Function} listener 
     * @param {Boolean|Object} [options] 
     * @returns EventEmitter
     */
    static one(type, listener, options)
    {
        return instance.one(type, listener, options);
    }
    /**
     * Removes a global event listener(s)
     * 
     * @param {String} type 
     * @param {Function} [listener] 
     * @param {Boolean} [capture] 
     * @returns EventEmitter
     */
    static off(type, listener, capture)
    {
        return instance.off(type, listener, capture);
    }
    /**
     * Dispatches a global event
     * 
     * @param {String|Event} type 
     * @param {Any} [data] 
     * @returns EventEmitter
     */
    static trigger(type, data = null)
    {
        return instance.trigger(type, data);
    }



    /**
     * Mixin this event emitter instance into an object
     * @param {Object} binding 
     * @returns Object
     */
    mixin(binding)
    {

        if (binding instanceof Object === false)
        {
            throw new TypeError('binding must be an Object');
        }
        ['on', 'one', 'off', 'trigger'].forEach(fn =>
        {
            if (!binding.hasOwnProperty(fn))
            {
                Object.defineProperty(binding, fn, {
                    enumerable: false, configurable: true,
                    value: (...args) =>
                    {
                        this[fn](...args);
                        return binding;
                    }
                });
            }
        });
        return binding;
    }

}


const instance = new EventEmitter();

/**
 * @param {String|EventTarget} root 
 * @returns EventEmitter
 */
export function emitter(root)
{
    return new EventEmitter(root);
}

instance.mixin(emitter);
emitter.mixin = instance.mixin.bind(instance);

export default emitter;
