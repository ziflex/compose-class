# compose-class

> Composition over inheritance

Utility function that allows you to compose a class using mixins and decorators

[![npm version](https://badge.fury.io/js/compose-class.svg)](https://www.npmjs.com/package/compose-class)
[![Build Status](https://secure.travis-ci.org/ziflex/compose-class.svg?branch=master)](http://travis-ci.org/ziflex/compose-class)
[![Coverage Status](https://coveralls.io/repos/github/ziflex/compose-class/badge.svg?branch=master)](https://coveralls.io/github/ziflex/compose-class)

````sh
    npm install --save compose-class
````

## Table of Contents

- [Motivation](#motivation)
- [Usage](#usage)
- [Quick start](#quick-start)
- [Using mixins](#using-mixins)
  - [With mixin initialization](#with-mixin-initialization)
- [Decorators](#decorators)
- [Statics](#statics)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Motivation

The idea behind this package is to use mixins and decorators as building blocks and use them across an application code base.

## Usage

### Quick start

````javascript

    import composeClass from 'compose-class';

    const Class = composeClass({
        constructor(name) {
            this._name = name;
        },

        getName() {
            return this._name;
        }
    });

    const instance = new Class('Tom');
    console.log(instance.getName()); // 'Tom'

````

## Using mixins

This is the main motivation of writing this package.

````javascript

    import composeClass from 'compose-class';

    const WalkMixin = {
        walk() {
            console.log(this._name, 'is walking');
        }
    };

    const TalkMixin = {
        talk() {
            console.log(this._name, 'is talking');
        }
    };

    const Class = composeClass({
        mixins: [
            WalkMixin,
            TalkMixin
        ],

        constructor(name) {
            this._name = name;
        }
    });

    const tom = new Class('Tom');

    tom.walk(); // 'Tom is walking'
    tom.talk(); // 'Tom is talking'
````

### With mixin initialization

If mixin has defined ``constructor`` it will be invoked before main class constructor.


````javascript
    // entity-mixin.js

    import Symbol from 'es6-symbol';

    const ID = Symbol('id');
    let counter = 0;

    export default {
        constructor() {
            counter += 1;
            this[ID] = counter;
        },

        getId() {
            return this[ID];
        }
    };

````

````javascript
// user.js

    import composeClass from 'compose-class';
    import EntityMixin from './entity-mixin';
    import Symbol from 'es6-symbol';

    const FIELDS = {
        name: Symbol('name')
    };

    const User = composeClass({
        mixins: [
            EntityMixin
        ],

        constructor(name) {
            this[FIELDS.name] = name;
            console.log(this.getId()); // counter value
        },

        getName() {
            return this[FIELDS.name];
        },

        setName(name) {
            this[FIELDS.name] = name;
            return this;
        }
    });

    const u1 = new User('Tom');
    console.log(u1.getId()); // '1';
    console.log(u1.getName()); // 'Tom'

    const u2 = new User('Jerry');
    console.log(u2.getId()); // '2';
    console.log(u2.getName()); // 'Jerry'

````

## Decorators

Sometimes using mixins is not enough to build a complex type with many rules. In order to execute pre/post conditions against type methods we need to wrap them. Decorators is the best tool for it.

In order to apply decorator to an instance, it needs to pass decorator factory to ``decorators`` array which accepts 2 arguments: name and function.

````javascript
// assert-decorator.js

    export default function AssertDecorator(name, method) {
        if (name.indexOf('set') < 0) {
            return method;
        }

        return function checkInput(...args) {
            if (!args[0]) {
                throw new Error('Value is missed');
            }

            return method.apply(this, args);
        };
    }

````


````javascript
// user.js

    import composeClass from 'compose-class';
    import EntityMixin from './entity-mixin';
    import AssertInputDecorator from './assert-decorator';
    import Symbol from 'es6-symbol';

    const FIELDS = {
        name: Symbol('name')
    };

    const User = composeClass({
        mixins: [
            EntityMixin
        ],

        decorators: [
            AssertInputDecorator
        ],

        constructor(name) {
            this[FIELDS.name] = name;
            console.log(this.getId()); // counter value
        },

        getName() {
            return this[FIELDS.name];
        },

        setName(name) {
            this[FIELDS.name] = name;
            return this;
        }
    });

    const u1 = new User('Tom');
    console.log(u1.getId()); // '1';
    console.log(u1.getName()); // 'Tom'

    u1.setName(); // exception

````

## Statics

Using ``statics`` object it's possible to define static methods of a type.

````javascript

    import composeClass from 'compose-class';
    import fetch from 'isomorphic-fetch';

    const User = composeClass({
        statics: {
            getAll() {
                return fetch('/users').then((response) => {
                    if (response.status >= 400) {
                        throw new Error("Bad response from server");
                    }

                    return response.json().map((name) => new User(name));
                });
            }
        },

        constructor(name) {
            this._name = name;
        },

        getName() {
            return this._name;
        }
    });

    User.getAll().then((users) => {
        users.map((u) => console.log('Fetched', u.getName()));
    });

````

## API Reference

### composeClass(definition)

Creates a new class based on the provided definition.

**Parameters:**

- `definition` (Object | Function): Class definition object or constructor function

**Definition Object Properties:**

- `constructor` (Function, optional): Constructor function for the class
- `mixins` (Array, optional): Array of mixin objects to merge into the class
- `decorators` (Array, optional): Array of decorator functions to apply to class methods
- `statics` (Object, optional): Object containing static methods to add to the constructor
- Any other properties will be added as instance methods

**Returns:**

- `Function`: Constructor function for the new class

**Example:**

````javascript
const MyClass = composeClass({
    constructor(name) {
        this.name = name;
    },
    
    getName() {
        return this.name;
    }
});
````

### Mixins

Mixins are objects that can be merged into your class definition. They can contain:

- Methods that will be added to the class prototype
- A `constructor` property that will be called before the main constructor

**Priority:** Class definition methods override mixin methods with the same name.

### Decorators

Decorators are functions that wrap class methods to add additional functionality.

**Signature:** `decorator(methodName, originalMethod) => Function`

- `methodName` (String): Name of the method being decorated
- `originalMethod` (Function): The original method implementation

**Returns:** Modified function or the original function

### Static Methods

Static methods are added directly to the constructor function and can be called without creating an instance.

## Examples

### Complete Example with All Features

````javascript
import composeClass from 'compose-class';

// Mixin with initialization
const LoggableMixin = {
    constructor() {
        this._logs = [];
    },
    
    log(message) {
        this._logs.push({ message, timestamp: new Date() });
        console.log(`[${this.constructor.name}] ${message}`);
    },
    
    getLogs() {
        return this._logs;
    }
};

// Performance decorator
const TimingDecorator = (name, method) => {
    if (name.startsWith('_')) {
        return method; // Skip private methods
    }
    
    return function(...args) {
        const start = performance.now();
        const result = method.apply(this, args);
        const end = performance.now();
        
        this.log(`${name} took ${(end - start).toFixed(2)}ms`);
        return result;
    };
};

// Complete class definition
const User = composeClass({
    mixins: [LoggableMixin],
    
    decorators: [TimingDecorator],
    
    statics: {
        create(name, email) {
            return new User(name, email);
        },
        
        fromJSON(json) {
            const data = JSON.parse(json);
            return new User(data.name, data.email);
        }
    },
    
    constructor(name, email) {
        this._name = name;
        this._email = email;
        this.log(`User created: ${name}`);
    },
    
    getName() {
        return this._name;
    },
    
    getEmail() {
        return this._email;
    },
    
    setEmail(email) {
        const oldEmail = this._email;
        this._email = email;
        this.log(`Email changed from ${oldEmail} to ${email}`);
        return this;
    },
    
    toJSON() {
        return JSON.stringify({
            name: this._name,
            email: this._email
        });
    }
});

// Usage
const user1 = new User('John Doe', 'john@example.com');
const user2 = User.create('Jane Smith', 'jane@example.com');
const user3 = User.fromJSON('{"name":"Bob Johnson","email":"bob@example.com"}');

user1.setEmail('john.doe@example.com');
console.log(user1.getLogs()); // See all logged activities
````

### Multiple Mixins Example

````javascript
import composeClass from 'compose-class';

const EventEmitterMixin = {
    constructor() {
        this._events = {};
    },
    
    on(event, handler) {
        if (!this._events[event]) {
            this._events[event] = [];
        }
        this._events[event].push(handler);
        return this;
    },
    
    emit(event, ...args) {
        if (this._events[event]) {
            this._events[event].forEach(handler => handler(...args));
        }
        return this;
    }
};

const ValidatableMixin = {
    validate() {
        // Override in your class
        return true;
    },
    
    isValid() {
        try {
            return this.validate();
        } catch (error) {
            return false;
        }
    }
};

const Model = composeClass({
    mixins: [EventEmitterMixin, ValidatableMixin],
    
    constructor(data = {}) {
        this._data = { ...data };
        this.emit('created', this);
    },
    
    set(key, value) {
        const oldValue = this._data[key];
        this._data[key] = value;
        this.emit('changed', { key, oldValue, newValue: value });
        return this;
    },
    
    get(key) {
        return this._data[key];
    },
    
    validate() {
        // Custom validation logic
        if (!this._data.name) {
            throw new Error('Name is required');
        }
        return true;
    }
});

const model = new Model({ name: 'Test' });
model.on('changed', ({ key, oldValue, newValue }) => {
    console.log(`${key} changed from ${oldValue} to ${newValue}`);
});

model.set('name', 'Updated Name'); // Triggers 'changed' event
console.log(model.isValid()); // true
````

## Troubleshooting

### Common Issues

**1. Methods not available on instances**

Make sure your mixin objects don't have conflicting method names and that you're not accidentally overriding methods.

````javascript
// Problem: Mixin method gets overridden
const mixin = { getName() { return 'mixin'; } };
const Class = composeClass({
    mixins: [mixin],
    getName() { return 'class'; } // This overrides the mixin method
});
````

**2. Constructor not being called**

Ensure your constructor is properly defined in the definition object:

````javascript
// Correct
const Class = composeClass({
    constructor(name) { // Note: 'constructor', not 'consturctor'
        this.name = name;
    }
});
````

**3. Decorators not applying to all methods**

Decorators are only applied to methods defined in the class definition and mixins, not to inherited methods:

````javascript
const decorator = (name, method) => {
    console.log(`Decorating ${name}`);
    return method;
};

const Class = composeClass({
    decorators: [decorator],
    myMethod() { return 'test'; } // This will be decorated
});
````

**4. Static methods not accessible**

Make sure you're calling static methods on the constructor, not on instances:

````javascript
const Class = composeClass({
    statics: {
        create() { return new Class(); }
    }
});

// Correct
const instance = Class.create();

// Incorrect
// const instance = new Class();
// instance.create(); // This won't work
````

### ES6 Module Usage

If you're using ES6 modules, make sure to import correctly:

````javascript
// ES6 import
import composeClass from 'compose-class';

// CommonJS require
const composeClass = require('compose-class');
````

### TypeScript Support

While this library doesn't include TypeScript definitions, you can create your own:

````typescript
declare module 'compose-class' {
    interface ClassDefinition {
        constructor?(...args: any[]): void;
        mixins?: object[];
        decorators?: Array<(name: string, method: Function) => Function>;
        statics?: object;
        [key: string]: any;
    }
    
    function composeClass(definition: ClassDefinition | Function): Function;
    export = composeClass;
}
````
