# compose-class

> Composition over inheritance

Utility function that allows you to compose a class using mixins and decorators

[![npm version](https://badge.fury.io/js/compose-class.svg)](https://www.npmjs.com/package/compose-class)
[![Build Status](https://secure.travis-ci.org/ziflex/compose-class.svg?branch=master)](http://travis-ci.org/ziflex/compose-class)
[![Coverage Status](https://coveralls.io/repos/github/ziflex/compose-class/badge.svg?branch=master)](https://coveralls.io/github/ziflex/compose-class)

````sh
    npm install --save compose-class
````

## Motivation

The idea behind this package is to use mixins and decorators as buildings blocks and use them across an aplication code base.

## Usage
## Quick start

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

This is the main motivaton of writing this package.

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

// entity-mixin.js

````javascript

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

// user.js
````javascript

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

        consturctor(name) {
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
    console.log(u1.getId()); // '2';
    console.log(u1.getName()); // 'Jerry'

````

## Decorators

Sometimes using mixins is not enough to build a complex type wtih many rules. In order to execute pre/post conditions against type methods we need to wrap them. Decorators is the best tool for it.

In order to apply decorator to an instance, it needs to pass decorator factory to ``decorators`` array which accepts 2 arguments: name and function.

// assert-decorator.js
````javascript

export default function AssertDecorator(name, method) {
    if (name.indexOf('set') < 0) {
        return method;
    }

    return function checkInput(value) {
        if (!value) {
            throw new Error('Value is missed');
        }

        return method.apply(this, value);
    };
}

````

// user.js

````javascript

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

        consturctor(name) {
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
