// Finds the last index using the same format as `Array..findIndex`
    // Array..findLastIndex(predicate:function[, thisArg:object]) -> number#Integer
Array.prototype.findLastIndex ??= function findLastIndex(predicate, thisArg = null) {
    return (this.length - this.reverse().findIndex(predicate, thisArg)) - 1;
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

// Returns a number formatted using SI unit prefixes
    // Number..prefix([unit:string[, decimalPlaces:number]]) -> string
Number.prototype.prefix = function prefix(unit = '', decimalPlaces) {
    let number = parseFloat(this),
        sign = number < 0? '-': '',
        prefix = '';

    number = Math.abs(number);

    if(number > 1) {
        for(let index = 0, units = 'kMGTPEZY'; index < units.length; ++index)
            if(number >= 1000) {
                number /= 1000;
                prefix = units[index];
            }
    } else if(number < 1) {
        for(let index = 0, units = 'mμnpfazy'; index < units.length; ++index) {
            if(number < 1) {
                number *= 1000;
                prefix = units[index];
            }
        }
    } else {
        prefix = '';
    }

    return sign + (decimalPlaces? number.toFixed(decimalPlaces): number) + prefix + unit;
}
