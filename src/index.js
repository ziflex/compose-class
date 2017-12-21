const isArray = Array.isArray;

function isNativeConstructor(i) {
    return i === Object.prototype.constructor ||
      i === Object.constructor ||
      i === Function;
}

function isFunction(i) {
    return typeof i === 'function';
}

function isObject(i) {
    return typeof i === 'object';
}

function isArguments(i) {
    return isObject(i) &&
        typeof i.length === 'number' &&
        hasOwnProperty.call(i, 'callee');
}

function isNativeProp(prop) {
    return prop === 'constructor' || prop === 'prototype';
}

function isPredifinedProp(prop) {
    return prop === 'statics' ||
        prop === 'mixins' ||
        prop === 'decorators';
}

function omitNativeProps(prop) {
    return !isNativeProp(prop);
}

function omitPredifinedProps(prop) {
    return !isPredifinedProp(prop);
}

function eachArrayLike(collection, iteratee, startFrom = -1) {
    let index = startFrom;
    const length = collection.length;

    while (++index < length) {
        if (iteratee(collection[index], index, collection) === false) {
            break;
        }
    }
}

function forEach(collection, iteratee, inherited = false) {
    if (!collection) {
        return null;
    }

    if (isArray(collection) || isArguments(collection)) {
        eachArrayLike(collection, iteratee);
    } else if (isObject(collection)) {
        for (const key in collection) {
            if ((inherited || hasOwnProperty.call(collection, key)) && key !== 'constructor') {
                if (iteratee(collection[key], key, collection) === false) {
                    break;
                }
            }
        }
    }

    return collection;
}

function reduce(collection, iteratee, initialValue) {
    let result = initialValue;

    forEach(collection, (value, prop) => {
        result = iteratee(result, value, prop);
    });

    return result;
}

function assign() {
    if (arguments.length === 0) {
        return {};
    }

    const target = arguments[0];

    if (arguments.length === 1) {
        return target;
    }

    eachArrayLike(arguments, (source) => {
        forEach(source, (value, prop) => {
            target[prop] = value;
        }, true);
    }, 0);

    return target;
}

function omit(target, iteratee) {
    const result = {};

    forEach(target, (value, prop) => {
        if (iteratee(prop, value) === true) {
            result[prop] = value;
        }
    }, true);

    return result;
}

function functions(target) {
    const result = [];

    forEach(target, (value, prop) => {
        if (isFunction(value)) {
            result.push(prop);
        }
    }, true);

    return result;
}

function createConstructor(ctor, initializers) {
    if (initializers == null && ctor != null) {
        return ctor;
    }

    if (initializers != null && ctor != null) {
        return function Class(...args) {
            forEach(initializers, i => i.call(this));
            ctor.apply(this, args);
        };
    }

    if (initializers != null && ctor == null) {
        return function Class() {
            forEach(initializers, i => i.call(this));
        };
    }

    return function Class() {};
}

/**
  * Creates class.
  * Possible to extend passed definition with mixins.
  * @param {Object | Function} definition - Class definition.
  * @return {Function} Constructor.
*/
module.exports = function createClass(definition) {
    if (!definition) {
        throw new Error('Class definition is required');
    }

    if (isFunction(definition)) {
        return definition;
    }

    let decorators,
        statics,
        initializers,
        mixins;

    if (definition.statics != null) {
        statics = omit(definition.statics, omitNativeProps);
    }

    if (definition.decorators != null) {
        decorators = definition.decorators;
    }

    if (isArray(definition.mixins) === true && definition.mixins.length > 0) {
        initializers = [];
        mixins = [];

        // prepearing mixins and their initializers
        forEach(definition.mixins, (mixin) => {
            if (isObject(mixin)) {
                // collect all mixin initializers
                if (!isNativeConstructor(mixin.constructor)) {
                    initializers.push(mixin.constructor);
                }

                // remove built-in methods
                mixins.push(omit(mixin, omitNativeProps));
            }
        });
    }

    const prototype = omit(definition, omitPredifinedProps);

    // creating a new constructor
    const Constructor = createConstructor(definition.constructor, initializers);

    if (statics != null) {
        assign(Constructor, statics);
    }

    // methods from definition have higher priority
    // i.e. if mixin and definition has same methods
    // definition's version will be taken
    if (isArray(mixins) === true) {
        assign(Constructor.prototype, ...mixins, prototype);
    } else {
        assign(Constructor.prototype, prototype);
    }

    if (isArray(decorators) === true) {
        const methods = functions(Constructor.prototype);

        forEach(methods, (name) => {
            const method = Constructor.prototype[name];

            const decorated = reduce(decorators, (result, decorator) => {
                return decorator(name, result);
            }, method);

            if (method !== decorated) {
                Constructor.prototype[name] = decorated;
            }
        });
    }

    return Constructor;
};
