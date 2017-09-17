'use strict';

let assert = require('assert');
let Locator = require('../locator');

let SomeService = require('./locatable/some_service');
let SomeOtherService = require('./locatable/some_other_service');

describe('Locator', () => {
    const path = './test/locatable/';
    let config = {};

    beforeEach(() => {
        config = {};
    });

    it('should be able to retrieve a service that depends on another service', () => {
        let locator = new Locator(config, {
            'some.service': [
                './some_service'
            ],
            'some.other.service': [
                './some_other_service', [
                    '@some.service'
                ]
            ],
        }, path);

        let someOtherService = locator.get('some.other.service');
        assert(someOtherService instanceof SomeOtherService);
        assert(someOtherService.someService instanceof SomeService);
    });

    it('should create only one instance per key', () => {
        let locator = new Locator(config, {
            'some.service': [
                './some_service'
            ]
        }, path);

        let instanceA = locator.get('some.service');
        let instanceB = locator.get('some.service');
        assert(instanceA === instanceB);
    });

    it('should throw an error when the service could not be found', () => {
        let locator = new Locator(config, {}, path);

        assert.throws(() => {
            locator.get('some.invalid.key');
        }, (e) => {
            return e.message === 'Could not retrieve an instance for some.invalid.key';
        });
    });

    it('should be able to inject config parameters', () => {
        let locator = new Locator(config, {
            'some.config.property.dependent.service': [
                './some_config_property_dependent_service', [
                    '%some.config%'
                ]
            ],
        }, path);

        config.get = function(configKey) {
            assert.equal(configKey, 'some.config');
            return 'cool!';
        };

        let service = locator.get('some.config.property.dependent.service');
        assert.equal(service.someConfigProperty, 'cool!');
    });

    it('should be able to inject a "hard" require', () => {
        let locator = new Locator(config, {
            'some.requirable.dependent.service': [
                './some_requirable_dependent_service', [
                    '~./some_requirable_function'
                ]
            ],
        }, path);

        let fn = require('./locatable/some_requirable_function');

        let service = locator.get('some.requirable.dependent.service');
        assert.strictEqual(service.requirableFunction, fn);
    });

    it('should inject normal strings when reserved characters are escaped', () => {
        const reservedCharacters = ['%', '@', '~'];
        for (let reservedCharacter of reservedCharacters) {
            let locator = new Locator(config, {
                'some.string.dependent.service': [
                    './some_string_dependent_service', [
                        reservedCharacter + reservedCharacter + 'hi'
                    ]
                ],
            }, path);

            let service = locator.get('some.string.dependent.service');
            assert.equal(reservedCharacter + 'hi', service.someString);
        }
    });

    it('should be able to reference classes inside a require', () => {
        let locator = new Locator(config, {
            'some.nested.class': [
                './some_nested_class[nested][moreNesting]'
            ],
        }, path);

        let NestedClass = require('./locatable/some_nested_class').nested.moreNesting;
        let service = locator.get('some.nested.class');
        assert(service instanceof NestedClass);
    });

    it('should throw an error a reference to a class inside a require is wrong', () => {
        let locator = new Locator(config, {
            'some.nested.class': [
                './some_nested_class[invalidNesting][moreNesting]'
            ],
        }, path);

        assert.throws(() => {
            locator.get('some.nested.class');
        }, (e) => {
            return e.message === 'Could not require ./some_nested_class[invalidNesting][moreNesting]';
        });
    });

    it('should be able to use a factory method', () => {
        let service = new SomeService();

        let locator = new Locator(config, {
            'some.service.with.factory.method': [
                './some_service', (l, s) => {
                    assert(l === locator);
                    assert(s === SomeService);
                    return service;
                }
            ]
        }, path);

        let result = locator.get('some.service.with.factory.method');
        assert(result === service);
    });
});