
import { decode, encode, isArray, isPlainObject, isString, isValidSelector, toCamel } from "./utils.mjs";


let api = {

    set(elem, attr, value)
    {
        if (nullUndef.includes(value))
        {
            this.remove(elem, attr);
        }

        getAttrs(attr).forEach(x =>
        {
            elem.dataset[x] = encode(value);
        });
    },
    get(elem, attr, fallback = null)
    {
        let result = getAttrs(attr).map(x => decode(elem.dataset[x])).map(x => !nullUndef.includes(x) ? x : fallback);

        if (result.length <= 1)
        {
            return result[0] ?? fallback;
        }

        return result;
    },
    remove(elem, attr)
    {
        getAttrs(attr).forEach(x => delete elem.dataset[x]);
    }


}, undef, nullUndef = [null, undef];



function getAttrs(attr)
{
    let result = [];

    if (isString(attr))
    {
        if (attr.startsWith('data-'))
        {
            attr = attr.slice(5);
        }
        result = [toCamel(attr)];
    }


    if (isArray(attr))
    {
        result = result.concat(...attr.map(x => getAttrs(x)));
    }

    return result;
}




function getElem(elem)
{
    if (hasDataset(elem))
    {
        return [elem];
    }

    if (elem instanceof NodeList)
    {
        return [...elem];
    }

    if (isArray(elem))
    {
        return elem.filter(x => hasDataset(x));
    }

    return isValidSelector(elem) ? [...document.querySelectorAll(elem)] : [];
}

function hasDataset(elem)
{
    return elem instanceof Object && elem.dataset instanceof DOMStringMap;
}





/**
 * data-attribute reader/setter
 * @param {Node|NodeList|String} elem 
 * @param {String} attr 
 * @param {Any} [value]
 */
export function dataset(elem, attr, value)
{

    elem = getElem(elem);


    function get(attr, fallback = null)
    {

        let x = elem[0];
        if (hasDataset(x))
        {
            return api.get(x, attr, fallback);
        }

        return fallback;
    }


    function set(attr, value)
    {
        if (isPlainObject(attr))
        {

            for (let key in attr)
            {
                set(key, attr[key]);
            }
        }
        else
        {
            elem.forEach(x => api.set(x, attr, value));
        }

        return $this;

    }


    function remove(attr)
    {
        elem.forEach(x => api.remove(x, attr));
        return $this;
    }


    const $this = { get, set, remove };

    switch (arguments.length)
    {
        case 2:
            return get(attr);

        case 3:
            return set(attr, value);

    }

    return $this;

}


export default dataset;