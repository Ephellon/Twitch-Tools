// Finds the last index using the smae format as `Array..findIndex`
    // Array..findLastIndex(predicate:function[, thisArg:object]) -> number#Integer
Array.prototype.findLastIndex = function findLastIndex(predicate, thisArg = null) {
    return (this.length - this.reverse().findIndex(predicate, thisArg)) - 1;
};
