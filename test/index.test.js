/* eslint-disable global-require, no-unused-expressions, import/no-extraneous-dependencies */
import { expect } from 'chai';
import sinon from 'sinon';
import createClass from '../src/index';

const isFunction = i => typeof i === 'function';

it('should throw an error when nothing passed', () => {
    expect(() => createClass()).to.throw(Error);
});

it('should ignore passed functions', () => {
    const Constructor = function User() {};
    const Class = createClass(Constructor);

    expect(Class === Constructor).to.be.true;
});

it('should create a basic class', () => {
    const Class = createClass({
        foo() {
            return 'foo';
        }
    });

    expect(Class).to.exist;
    expect(isFunction(Class)).to.be.true;

    const instance = new Class();
    expect(instance.foo).to.exist;
    expect(isFunction(instance.foo)).to.be.true;
    expect(instance.foo()).to.eql('foo');
});

it('should create a basic class with constructor', () => {
    debugger;
    const Class = createClass({
        constructor(name) {
            this._name = name;
        },

        getName() {
            return this._name;
        },

        setName(value) {
            this._name = value;

            return this;
        }
    });

    expect(Class).to.exist;
    expect(isFunction(Class)).to.be.true;

    const tom = new Class('Tom');
    const jerry = new Class('Jerry');

    expect(tom.getName).to.exist;
    expect(jerry.getName).to.exist;
    expect(tom.getName === jerry.getName).to.be.true;

    expect(tom.getName()).to.equal('Tom');
    expect(jerry.getName()).to.equal('Jerry');

    expect(tom.setName('Tommy').getName()).to.equal('Tommy');
    expect(jerry.getName()).to.equal('Jerry');
});

it('should create a basic class with static methods', () => {
    const Class = createClass({
        statics: {
            bar() {
                return 'bar';
            },

            qaz() {
                return 'qaz';
            }
        },

        foo() {
            return 'foo';
        }
    });

    const instance = new Class();

    expect(Class.bar).to.exist;
    expect(Class.qaz).to.exist;
    expect(isFunction(Class.bar)).to.be.true;
    expect(isFunction(Class.qaz)).to.be.true;

    expect(instance.bar).to.not.exist;
    expect(instance.qaz).to.not.exist;
});

it('should create a class using mixins', () => {
    const WalkableMixin = {
        walk() {
            return `${this.getName()} is walking`;
        }
    };

    const TalkableMixin = {
        talk() {
            return `${this.getName()} is talking`;
        }
    };

    const FlyableMixin = {
        fly() {
            return `${this.getName()} is flying`;
        }
    };

    const Class = createClass({
        mixins: [
            WalkableMixin,
            TalkableMixin,
            FlyableMixin
        ],

        constructor(name) {
            this._name = name;
        },

        getName() {
            return this._name;
        }
    });

    const tom = new Class('Tom');
    const jerry = new Class('Jerry');

    expect(isFunction(tom.getName)).to.be.true;
    expect(isFunction(jerry.getName)).to.be.true;
    expect(tom.getName()).to.eql('Tom');
    expect(jerry.getName()).to.eql('Jerry');

    expect(isFunction(tom.walk)).to.exist;
    expect(isFunction(jerry.walk)).to.exist;
    expect(tom.walk()).to.eql('Tom is walking');
    expect(jerry.walk()).to.eql('Jerry is walking');
    expect(tom.walk === jerry.walk).to.be.true;
    expect(tom.walk === WalkableMixin.walk).to.be.true;

    expect(isFunction(tom.talk)).to.exist;
    expect(isFunction(jerry.talk)).to.exist;
    expect(tom.talk()).to.eql('Tom is talking');
    expect(jerry.talk()).to.eql('Jerry is talking');
    expect(tom.talk === jerry.talk).to.be.true;
    expect(tom.talk === TalkableMixin.talk).to.be.true;

    expect(isFunction(tom.fly)).to.exist;
    expect(isFunction(jerry.fly)).to.exist;
    expect(tom.fly()).to.eql('Tom is flying');
    expect(jerry.fly()).to.eql('Jerry is flying');
    expect(tom.fly === jerry.fly).to.be.true;
    expect(tom.fly === FlyableMixin.fly).to.be.true;
});

it('should create a class using mixins with initializers', () => {
    let counter = 0;

    const EntityMixin = {
        constructor() {
            counter++;
            this._id = counter;
        },

        getId() {
            return this._id;
        }
    };

    const Class = createClass({
        mixins: [
            EntityMixin
        ],

        constructor(name) {
            this._name = name;

            expect(this._id).to.exist;
        },

        getName() {
            return this._name;
        }
    });

    const tom = new Class('Tom');
    const jerry = new Class('Jerry');

    expect(tom.getId()).to.eql(1);
    expect(jerry.getId()).to.eql(2);
});

it('should use object instances as mixins', () => {
    const initializerSpy = sinon.spy();
    const Emitter = createClass({
        constructor() {
            this._events = {};
            initializerSpy();
        },

        on(event, handler) {
            let handlers = this._events[event];

            if (!handlers) {
                handlers = [];
                this._events[event] = handlers;
            }

            handlers.push(handler);

            return this;
        },

        emit(event, ...args) {
            const handlers = this._events[event];

            if (!handlers) {
                return this;
            }

            handlers.forEach((handler) => {
                handler(...args);
            });

            return this;
        }
    });

    const Class = createClass({
        mixins: [
            new Emitter()
        ],

        constructor(name) {
            this._name = name;
        },

        getName() {
            return this._name;
        },

        setName(newName) {
            this._name = newName;
            this.emit('change', this);
            return this;
        }
    });

    initializerSpy.reset();

    const tomSpy = sinon.spy();
    const jerrySpy = sinon.spy();
    const tom = new Class('Tom');
    const jerry = new Class('Jerry');

    expect(initializerSpy.callCount, 'initializerSpy.callCount').to.equal(2);

    expect(tom._events === jerry._events, '"events" objects must be not equal').to.be.false;

    tom.on('change', tomSpy);
    jerry.on('change', jerrySpy);

    tom.setName('Tommy');

    expect(tomSpy.callCount).to.eql(1);
    expect(jerrySpy.callCount).to.eql(0);

    jerry.setName('Jerry Jr');

    expect(tomSpy.callCount).to.eql(1);
    expect(jerrySpy.callCount).to.eql(1);
});

it('should create a class and apply decorators', () => {
    const EntityMixin = {
        getId() {
            return this._id;
        }
    };

    const UserMixin = {
        getName() {
            return this._name;
        }
    };

    const genericSpy = sinon.spy();
    const genericDecorator = (name, fn) => {
        return function decorator() {
            genericSpy();

            return fn.call(this, arguments);
        };
    };
    const getNameSpy = sinon.spy();
    const getNameDecorator = (name, fn) => {
        if (name !== 'getName') {
            return fn;
        }

        return function decorator() {
            getNameSpy();

            return fn.call(this, arguments);
        };
    };

    const Class = createClass({
        mixins: [
            EntityMixin,
            UserMixin
        ],

        decorators: [
            genericDecorator,
            getNameDecorator
        ],

        constructor(id, name) {
            this._id = id;
            this._name = name;
        }
    });

    const tom = new Class(1, 'Tom');
    const jerry = new Class(2, 'Jerry');

    tom.getId();

    expect(genericSpy.callCount).to.eql(1);
    expect(getNameSpy.callCount).to.eql(0);

    tom.getName();

    expect(genericSpy.callCount).to.eql(2);
    expect(getNameSpy.callCount).to.eql(1);

    jerry.getName();

    expect(genericSpy.callCount).to.eql(3);
    expect(getNameSpy.callCount).to.eql(2);

    tom.getId();

    expect(genericSpy.callCount).to.eql(4);
    expect(getNameSpy.callCount).to.eql(2);
});

it('should be exported as "commonjs" module', () => {
    const composeClass = require('../src/index');

    expect(typeof composeClass === 'function').to.be.true;
});
