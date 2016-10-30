const NATIVE_CONSTRUCTOR = Object.prototype.constructor;
const isArray = Array.isArray;
const isFunction = i => typeof i === 'function';
const isObject = i => typeof i === 'object';
const isArguments = (i) => {
    return isObject(i) &&
        typeof i.length === 'number' &&
        hasOwnProperty.call(i, 'callee');
};
const isNativeProp = (prop) => {
    return prop === 'constructor' || prop === 'prototype';
};
const isPredifinedProp = (prop) => {
    return prop === 'statics' ||
        prop === 'mixins' ||
        prop === 'decorators';
};

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

const omitNativeProps = prop => !isNativeProp(prop);
const omitPredifinedProps = prop => !isPredifinedProp(prop);

/**
  * Creates class.
  * Possible to extend passed definition with mixins.
  * @param {Object | Function} definition - Class definition.
  * @return {Function} Constructor.
*/
export default function createClass(definition) {
    if (!definition) {
        throw new Error('Class definition is required');
    }

    if (isFunction(definition)) {
        return definition;
    }

    const decorators = definition.decorators ? definition.decorators : null;
    const statics = definition.statics ? omit(definition.statics, omitNativeProps) : null;
    const initializers = [];
    const mixins = [];

    // prepearing mixins and their initializers
    forEach(definition.mixins, (mixin) => {
        if (isObject(mixin)) {
            // collect all mixin initializers
            if (mixin.constructor !== NATIVE_CONSTRUCTOR) {
                initializers.push(mixin.constructor);
            }

            // remove built-in methods
            mixins.push(omit(mixin, omitNativeProps));
        }
    });

    // creating new constructor
    const Constructor = ((function createConstructor(constructor, inits) {
        return function Surrogate(...args) {
            forEach(inits, init => init.apply(this));
            constructor.apply(this, args);
        };
    })(definition.constructor, initializers));

    assign(Constructor, statics);

    // methods from definition have higher priority
    // i.e. if mixin and definition has the same methods
    // definition's version will be taken
    assign(Constructor.prototype, ...mixins, omit(definition, omitPredifinedProps));

    if (isArray(decorators)) {
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
}
