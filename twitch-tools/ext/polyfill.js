/*** /polyfill.js
 *      _____      _        __ _ _ _   _
 *     |  __ \    | |      / _(_) | | (_)
 *     | |__) |__ | |_   _| |_ _| | |  _ ___
 *     |  ___/ _ \| | | | |  _| | | | | / __|
 *     | |  | (_) | | |_| | | | | | |_| \__ \
 *     |_|   \___/|_|\__, |_| |_|_|_(_) |___/
 *                    __/ |          _/ |
 *                   |___/          |__/
 */
// Finds the last index using the same format as `Array..findIndex`
    // Array..findLastIndex(predicate:function[, thisArg:object]) -> number#Integer
Array.prototype.findLastIndex ??= function findLastIndex(predicate, thisArg = null) {
    return (this.length - this.reverse().findIndex(predicate, thisArg)) - 1;
};

// Determines if the array contains any of the value(s)
    // Array..contains(...values:any) -> boolean
Array.prototype.contains ??= function contains(...values) {
    let has = false;

    for(let value of values)
        if(has ||= !!~this.indexOf(value))
            break;

    return has;
};

// https://stackoverflow.com/a/35859991/4211612
// Captures the current frame from a video element
    // HTMLVideoElement..captureFrame([imageType:string[, returnType:string]]) -> String#dataURL | Object | HTMLImageElement
        // imageType = "jpeg" | "png" | "webp"
        // returnType = "img" | "element" | "HTMLImageElement"
            // -> HTMLImageElement
        // returnType = "json" | "object"
            // -> Object#{ type=imageType, data:string, height:number#integer, width:number#integer }
        // returnType = "dataURI" | "dataURL" | ...
            // -> String#dataURL
HTMLVideoElement.prototype.captureFrame ??= function captureFrame(imageType = "image/png", returnType = "dataURL") {
    let { height, width, videoHeight, videoWidth } = this;

    let canvas = furnish('canvas', { height: height ||= videoHeight, width: width ||= videoWidth }),
        context = canvas.getContext('2d');

    context.drawImage(this, 0, 0);

    let canvasData = canvas.toDataURL(imageType),
        data = canvasData;

    switch(returnType) {
        case 'img':
        case 'element':
        case 'HTMLImageElement':
            data = document.createElement('img');

            data.src = canvasData;
            break;

        case 'json':
        case 'object':
            data = { type: imageType, height, width, data };
            break;

        default: break;
    }

    return data;
};

// Returns a number formatted using unit prefixes
    // Number..prefix([unit:string[, decimalPlaces:boolean|number[, format:string]]]) -> string
        // decimalPlaces = true | false | *:number
            // true -> 123.456.prefix('m', true) => "123.456m"
            // false -> 123.456.prefix('m', false) => "123m"
            // 1 -> 123.456.prefix('m', 1) => "123.4m"
        // format = "metric" | "imperial" | "readable"
Number.prototype.prefix ??= function prefix(unit = '', decimalPlaces = true, format = "metric") {
    let number = parseFloat(this),
        sign = number < 0? '-': '',
        prefix = '';

    number = Math.abs(number);

    let system = {};

    switch(format.toLowerCase()) {
        case 'imperial':
            system.large = 'thousand million billion trillion quadrillion qunitillion sextillion septillion octillion nonillion'
                .split(' ')
                .map(prefix => ' ' + prefix);
            system.small = system.large.map(prefix => prefix + 'ths');
            break;

        // Common US shorthands (used on Twitch)
        case 'readable':
            system.large = 'KMBTQ';
            system.small = '';
            break;

        case 'metric':
        default:
            system.large = 'kMGTPEZY';
            system.small = 'mμnpfazy';
            break;
    }

    if(number > 1) {
        for(let index = 0, units = system.large; index < units.length; ++index)
            if(number >= 1000) {
                number /= 1000;
                prefix = units[index];
            }
    } else if(number < 1 && number > 0) {
        for(let index = 0, units = system.small; index < units.length; ++index) {
            if(number < 1) {
                number *= 1000;
                prefix = units[index];
            }
        }
    }

    return sign + (
        decimalPlaces === true?
            number:
        decimalPlaces === false?
            Math.round(number):
        number.toFixed(decimalPlaces)
    ) + prefix + unit;
}
