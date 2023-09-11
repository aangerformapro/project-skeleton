/* global unsafeWindow, globalThis */



export const

    IS_UNSAFE = typeof unsafeWindow !== 'undefined',
    IS_BROWSER = typeof window !== 'undefined' && typeof window.document !== 'undefined',
    IS_TOUCH = typeof ontouchstart !== 'undefined',
    noop = () => { },
    identity = x => x,
    global = IS_UNSAFE ? unsafeWindow : globalThis ?? window,
    { JSON, document } = global,
    isPlainObject = (param) => param instanceof Object && Object.getPrototypeOf(param) === Object.prototype,
    isUndef = (param) => typeof param === 'undefined',
    isString = (param) => typeof param === 'string',
    isNumber = (param) => typeof param === 'number',
    isInt = (param) => Number.isInteger(param),
    isFloat = (param) => isNumber(param) && parseFloat(param) === param,
    isUnsigned = (param) => param >= 0 && isNumber(param),
    isUnsignedInt = (param) => param >= 0 && isInt(param),
    isNumeric = (param) => isInt(param) || isFloat(param) || /^-?(?:[\d]+\.)?\d+$/.test(param),
    intVal = (param) => isNumeric(param) && parseInt(param),
    floatVal = (param) => isNumeric(param) && parseFloat(param),
    isBool = (param) => typeof param === 'boolean',
    isArray = (param) => Array.isArray(param),
    isNull = (param) => param === null,
    isObject = (param) => typeof param === 'object' && !isNull(param),
    isCallable = (param) => typeof param === 'function',
    isFunction = isCallable,
    isScalar = (param) => isNumeric(param) || isString(param) || isBool(param),
    capitalize = (param) => isString(param) && param.split(/\s+/).map(param => param.charAt(0).toUpperCase() + param.slice(1).toLowerCase()).join(' ');



const
    VALID_REFERERRPOLICY = [
        'no-referrer', 'no-referrer-when-downgrade',
        'origin', 'origin-when-cross-origin',
        'same-origin', 'strict-origin',
        'strict-origin-when-cross-origin', 'unsafe-url'
    ],
    VALID_CROSSORIGIN = ['', 'use-credentials', 'anonymous'];



export function getClass(param)
{

    if (isFunction(param))
    {
        return param.name;
    }
    else if (param instanceof Object)
    {
        return Object.getPrototypeOf(param).constructor.name;
    }

}

export function isEmpty(param)
{

    if (isUndef(param) || param === null)
    {
        return true;
    }
    if (isString(param) || isArray(param))
    {
        return param.length === 0;
    }
    if (isNumber(param))
    {
        return param === 0;
    }

    if (isPlainObject(param))
    {
        return Object.keys(param).length === 0;
    }
    return false;
}

export function runAsync(callback, ...args)
{
    if (isFunction(callback))
    {
        setTimeout(callback, 0, ...args);
    }
}


/**
 * Creates a promise that resolves a value
 * 
 * @param {any} value 
 * @param {Function} onResolve A transformation function
 * @param {Function} onReject 
 */
export function promisify(value, onResolve = identity, onReject = (val, err) => err)
{

    if (value instanceof Promise)
    {

        return value.then(val =>
        {
            let newval = onResolve(val);
            if (isUndef(newval))
            {
                return val;
            }
            return newval;

        }).catch(err => onReject(value, err));
    }

    return promisify(Promise.resolve(value), onResolve, onReject);
}



export function isValidSelector(selector)
{

    try
    {
        return isString(selector) && null === document.createElement('template').querySelector(selector);

    } catch (e)
    {
        return false;
    }

}


export function uuidv4()
{
    let uuid = "", i, random;
    for (i = 0; i < 32; i++)
    {
        random = Math.random() * 16 | 0;
        if (i == 8 || i == 12 || i == 16 || i == 20)
        {
            uuid += "-";
        }
        uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
    }
    return uuid;
}


export function isElement(elem)
{
    return elem instanceof Object && isFunction(elem.querySelector);
}


export function toCamel(name = '')
{

    if (!isString(name))
    {
        throw new TypeError('name must be a String');
    }

    let index;
    while (-1 < (index = name.indexOf("-")))
    {
        name = name.slice(0, index) + name.slice(index + 1, 1).toUpperCase() + name.slice(index + 2);
    }
    return name;
}

export function toDashed(name)
{
    return name.replace(/([A-Z])/g, function (u)
    {
        return "-" + u.toLowerCase();
    });
}

export function isHTML(param)
{
    return isString(param) && param.startsWith('<') && param.endsWith('>');
}



export function isJSON(param)
{

    if (!isString(param))
    {
        return false;
    }

    return (
        isNumeric(param) ||
        ['true', 'false', 'null'].includes(param) ||
        ['{', '[', '"'].includes(param.slice(0, 1)) ||
        ['}', ']', '"'].includes(param.slice(-1))
    );

}


export function decode(value)
{

    if (isUndef(value) || isNull(value))
    {
        return null;
    }
    if (isJSON(value))
    {
        try
        {
            return JSON.parse(value);
        } catch (error)
        {
            // fallback for invalid json data
            return value;
        }

    }

    return value;
}


export function encode(value)
{

    if (isFunction(value) || isUndef(value))
    {
        return value;
    }


    return isString(value) ? value : JSON.stringify(value);
}


function parseAttributes(obj, /** @type {string|undefined} */ name)
{

    let result = [];

    for (let key in obj)
    {
        const value = obj[key];

        if (isPlainObject(value))
        {
            result = result.concat(parseAttributes(value)).map(
                item => [[key, item[0]].join('-'), item[1]]
            );

            continue;
        }
        result.push([key, encode(value)]);
    }
    return result.map(item => name ? [[name, item[0]].join('-'), item[1]] : item);
}





function validateHtml(html)
{
    return isString(html) || isElement(html) || isArray(html);
}

const RESERVED_KEYS = [
    'data', 'dataset',
    'html', 'tag',
    'callback'
];


/**
 * Shorthand to create element effortlessly
 * if no params are given a <div></div> will be generated
 * 
 * @param {String} [tag] tag name / html / emmet
 * @param {Object} [params] params to inject into element
 * @param {String|HTMLElement|String[]|HTMLElement[]} [html] 
 * @returns 
 */
export function createElement(
    tag = 'div',
    params = {},
    html = null
)
{

    if (isPlainObject(tag))
    {
        params = tag;
        tag = params.tag ?? 'div';
    }

    if (typeof tag !== 'string')
    {
        throw new TypeError('tag must be a String');
    }

    if (validateHtml(params))
    {
        html = params;
        params = {};
    }

    const elem = isHTML(tag) ? html2element(tag) : document.createElement(tag);

    let callback;

    if (!isElement(elem))
    {
        throw new TypeError("Invalid tag supplied " + tag);
    }

    if (isPlainObject(params))
    {
        const data = [];

        callback = params.callback;

        if (!validateHtml(html))
        {
            html = params.html;
        }

        if (isPlainObject(params.data))
        {
            data.push(...parseAttributes(params.data, 'data'));
        }

        if (isPlainObject(params.dataset))
        {
            data.push(...parseAttributes(params.dataset, 'data'));
        }


        data.forEach(item => elem.setAttribute(...item));


        if (isArray(params.class))
        {
            params.class = params.class.join(" ");
        }

        for (let attr in params)
        {
            if (RESERVED_KEYS.includes(attr))
            {
                continue;
            }

            let value = params[attr];

            if (isString(value))
            {
                let current = elem.getAttribute(attr) ?? '';
                if (current.length > 0)
                {
                    value = current + ' ' + value;
                }

                elem.setAttribute(attr, value);
            }
            else if (isPlainObject(value))
            {
                parseAttributes(value, attr).forEach(item => elem.setAttribute(...item));
            }
            else
            {
                elem[attr] = value;
            }
        }


    }

    if (validateHtml(html))
    {
        if (!isArray(html))
        {
            html = [html];
        }

        for (let child of html)
        {
            if (isElement(child))
            {
                elem.appendChild(child);
            }
            else
            {
                elem.innerHTML += child;
            }
        }
    }

    if (isFunction(callback))
    {
        callback(elem);
    }

    return elem;

}


/**
 * Generate a unique ID
 * @returns {String}
 */
export function uniqid()
{

    let value = '';
    uniqid.values ??= new Set();
    do
    {
        value = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    while (uniqid.values.has(value));
    uniqid.values.add(value);
    return value;
}




/**
 * Clones an Object/Array
 * @param {Object} obj
 * @returns {Object|undefined}
 */
export function clone(obj)
{

    if (isArray(obj))
    {
        return Array.from(obj);
    }


    if (obj instanceof Object)
    {
        return Object.assign({}, obj);
    }

    return obj;
}

/**
 * Clones Object recursively
 * 
 * @param {Object} obj 
 * @returns 
 */
export function cloneRecursive(obj)
{
    if (obj instanceof Object)
    {

        if (isArray(obj))
        {

            return Array.from(obj).map(value =>
            {
                if (isPlainObject(value) || isArray(value))
                {
                    return cloneRecursive(value);
                }
                return value;
            });
        }

        if (!isPlainObject(obj))
        {
            throw new TypeError('Invalid Object supplied.');
        }

        obj = clone(obj);
        for (let prop in obj)
        {
            if (isPlainObject(obj[prop]) || isArray(obj[prop]))
            {
                obj[prop] = cloneRecursive(obj[prop]);
            }
        }

    }

    return obj;
}

/**
 * Convert an element to its outer html
 * 
 * @param {HTMLElement|NodeList|HTMLElement[]} elem 
 * @returns {String|undefined}
 */
export function element2html(elem)
{

    if (isElement(elem))
    {
        elem = [elem];
    }
    if (elem instanceof NodeList)
    {
        elem = [...elem];
    }

    if (isArray(elem))
    {
        return createElement('div', elem.map(el => el.cloneNode(true))).innerHTML;
    }
}





/**
 * Creates a Document from html code
 * @param {string} html
 * @returns {documentElement}
 */
export function html2doc(html)
{
    let node = document.implementation.createHTMLDocument().documentElement;
    if (isString(html) && html.length > 0)
    {
        node.innerHTML = html;
    }
    return node;
}

/**
 * Creates an HTMLElement from html code
 * @param {string} html
 * @returns {HTMLElement|Array|undefined}
 */
export function html2element(html)
{
    if (isString(html) && html.length > 0)
    {
        let template = createElement('template', html),
            content = template.content;
        if (content.childNodes.length === 0)
        {
            return;
        }
        else if (content.childNodes.length > 1)
        {
            return [...content.childNodes];
        }
        return content.childNodes[0];
    }
}


/**
 * Resolves an URL
 * 
 * @param {URL|String} url 
 * @returns {URL|undefined}
 */
export function getUrl(url)
{
    if (isString(url))
    {
        const a = getUrl.a ??= createElement("a");
        getUrl.a.href = url;
        url = new URL(a.href);
    }


    if (url instanceof URL)
    {
        return url;
    }

}

export function selectText(node)
{
    if (document.body.createTextRange)
    {
        const range = document.body.createTextRange();
        range.moveToElementText(node);
        range.select();
    } else if (window.getSelection)
    {
        const selection = window.getSelection(), range = document.createRange();
        range.selectNodeContents(node);
        selection.removeAllRanges();
        selection.addRange(range);
    } else
    {
        console.warn("Could not select text in node: Unsupported browser.");
    }
}

export function removeAccent(str)
{
    let accent = [
        /[\300-\306]/g, /[\340-\346]/g, // A, a
        /[\310-\313]/g, /[\350-\353]/g, // E, e
        /[\314-\317]/g, /[\354-\357]/g, // I, i
        /[\322-\330]/g, /[\362-\370]/g, // O, o
        /[\331-\334]/g, /[\371-\374]/g, // U, u
        /[\321]/g, /[\361]/g, // N, n
        /[\307]/g, /[\347]/g, // C, c
    ], noaccent = ['A', 'a', 'E', 'e', 'I', 'i', 'O', 'o', 'U', 'u', 'N', 'n', 'C', 'c'];


    for (var i = 0; i < accent.length; i++)
    {
        str = str.replace(accent[i], noaccent[i]);
    }

    return str;
}



export function loadScript(url, options)
{
    return new Promise((resolve, reject) =>
    {
        const params = Object.assign({
            async: null,
            defer: null,
            crossorigin: null,
            referrerpolicy: null,
            type: null,
        }, options ?? {});

        let { async, defer, crossorigin, referrerpolicy, type } = params;

        if (async !== true)
        {
            async = null;
        }

        if (defer !== true)
        {
            defer = null;
        }

        if (VALID_CROSSORIGIN.includes(crossorigin))
        {
            crossorigin = null;
        }
        if (VALID_REFERERRPOLICY.includes(referrerpolicy))
        {
            referrerpolicy = null;
        }
        if (type !== 'module')
        {
            type = null;
        }

        if (url = getUrl(url))
        {

            const script = createElement('script', {
                src: url,
                onload: () => resolve(script),
                onerror: () => reject(new Error("Cannot load " + url)),
                id: uniqid()
            });

            for (let param in params)
            {
                let value = params[param];
                if (null !== value)
                {
                    script[param] = value;
                }
            }

            document.getElementsByTagName('head')[0].appendChild(script);
        }

    });
}


/**
 * PHP BackedEnum like Api
 * Accepts more types than (str|int)
 */
export class BackedEnum
{


    /**
     * This is the first defined case
     * Overrirde this to set your own default case
     */
    static get default()
    {
        return this.cases()[0];
    }


    /**
     * Get the enum from the value
     */
    static tryFrom(value)
    {

        if (getClass(value) === getClass(this) && !isFunction(value))
        {
            return value;
        }

        return this.cases().find(x => x.value === value);
    }

    /**
     * Throws if enum does not exists
     */
    static from(value)
    {

        const result = this.tryFrom(value);

        if (isUndef(result))
        {
            throw new TypeError("Cannot find matching enum to: " + encode(value));
        }
        return result;
    }


    /**
     * 
     * @returns {BackedEnum[]}
     */
    static cases()
    {
        return this.keys.map(x => this[x]);
    }


    /**
     * Gets names from the enums
     * they must be camel cased or uppercased
     */
    static get keys()
    {
        return Object.keys(this).filter(name => name[0] === name[0].toUpperCase() && this[name] instanceof BackedEnum);
    }

    /**
     * Get the number of values
     * length is buggy on static classes
     */
    static get size()
    {
        return this.keys.length;
    }


    //------------------- Instance implementation -------------------


    /**
     * Get current enum name
     * Only works if enum instanciated correctly
     * and after the constructor has been called
     */
    get name()
    {
        return Object.keys(this.constructor).find(
            key => this.constructor[key] === this
        ) ?? '';
    }


    constructor(value)
    {

        if (Object.getPrototypeOf(this) === BackedEnum.prototype)
        {
            throw new Error('Cannot instantiate BackedEnum directly, it must be extended.');
        }

        if (isUndef(value) || isFunction(value))
        {
            throw new TypeError('value is not valid');
        }

        Object.defineProperty(this, "value", {
            writable: false, configurable: false, enumerable: true,
            value
        });


    }
}

/**
 * Make a queue of functions to run later
 */

export function runLater(...fns)
{


    const toRun = new Map();

    for (let arr of fns)
    {
        if (!isArray(arr))
        {
            arr = [arr];
        }

        let fn = arr.shift();

        if (isFunction(fn))
        {
            toRun.set(fn, arr);
        }
    }

    return () =>
    {

        const result = [];
        for (const [fn, args] of toRun.entries())
        {
            result.push(fn(...args));
        }
        return result;

    };
}

