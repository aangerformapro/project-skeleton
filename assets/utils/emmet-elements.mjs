

import expandAbbreviation from 'emmet';
import { createElement, isValidSelector } from './utils.mjs';


/**
 * Keywords that are in selectors and emmet
 */
const KEYWORDS = [
    ' ', '.', '#', '=', '+', '~', '[', ']',
];

/**
 * Emmet only keywords
 * @link https://docs.emmet.io/cheat-sheet/
 */
const EMMET_KEYWORDS = [
    '*', '>', 'lorem', '$', '^', '(', ')', '{', '}', ':'

];



export function updateElement(tag = 'div', params = {}, html = null)
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

    if (isValidSelector(tag))
    {

        if (EMMET_KEYWORDS.some(k => tag.includes(k)))
        {
            tag = expandAbbreviation(tag);
        }
        else if (KEYWORDS.some(k => tag.includes(k)))
        {
            tag = document.querySelector(tag) ?? expandAbbreviation(tag);
        }
    }


    return createElement(tag, params, html);


}