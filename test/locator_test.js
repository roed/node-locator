'use strict';

const assert = require('assert');
const Locator = require('../locator');

const SomeService = require('./locatable/some_service');
const SomeOtherService = require('./locatable/some_other_service');

describe('Locator', () => {
    const path = './test/locatable/';
    let config = {};

    beforeEach(() => {
        config = {};
    });

    it('should be able to retrieve a service that depends on another service', () => {
        const locator = new Locator(config, {
            'some.service': [
                './some_service'
            ],
            'some.other.service': [
                './some_other_service', [
                    '@some.service'
                ]
            ],
        }, path);

        const someOtherService = locator.get('some.other.service');
        assert(someOtherService instanceof SomeOtherService);
        assert(someOtherService.someService instanceof SomeService);
    });

    it('should create only one instance per key', () => {
        const locator = new Locator(config, {
            'some.service': [
                './some_service'
            ]
        }, path);

        const instanceA = locator.get('some.service');
        const instanceB = locator.get('some.service');
        assert(instanceA === instanceB);
    });

    it('should throw an error when the service could not be found', () => {
        const locator = new Locator(config, {}, path);

        assert.throws(() => {
            locator.get('some.invalid.key');
        }, (e) => {
            return e.message === 'Could not retrieve an instance for some.invalid.key';
        });
    });

    it('should be able to inject config parameters', () => {
        const locator = new Locator(config, {
            'some.config.property.dependent.service': [
                './some_config_property_dependent_service', [
                    '%some.config%'
                ]
            ],
        }, path);

        config.get = function(configKey) {
            assert.strictEqual(configKey, 'some.config');
            return 'cool!';
        };

        const service = locator.get('some.config.property.dependent.service');
        assert.strictEqual(service.someConfigProperty, 'cool!');
    });

    it('should be able to inject a "hard" require', () => {
        const locator = new Locator(config, {
            'some.requirable.dependent.service': [
                './some_requirable_dependent_service', [
                    '~./some_requirable_function'
                ]
            ],
        }, path);

        const fn = require('./locatable/some_requirable_function');

        const service = locator.get('some.requirable.dependent.service');
        assert.strictEqual(service.requirableFunction, fn);
    });

    it('should be able to use a non-constructable require', () => {
        const locator = new Locator(config, {
            'some.data': [
                './some_data'
            ],
        }, path);

        const someData = require('./locatable/some_data');
        
        const result = locator.get('some.data');
        assert.strictEqual(result, someData);
    });

    it('should inject normal strings when reserved characters are escaped', () => {
        const reservedCharacters = ['%', '@', '~'];
        for (const reservedCharacter of reservedCharacters) {
            const locator = new Locator(config, {
                'some.string.dependent.service': [
                    './some_string_dependent_service', [
                        reservedCharacter + reservedCharacter + 'hi'
                    ]
                ],
            }, path);

            const service = locator.get('some.string.dependent.service');
            assert.strictEqual(reservedCharacter + 'hi', service.someString);
        }
    });

    it('should be able to reference classes inside a require', () => {
        const locator = new Locator(config, {
            'some.nested.class': [
                './some_nested_class[nested][moreNesting]'
            ],
        }, path);

        const NestedClass = require('./locatable/some_nested_class').nested.moreNesting;
        const service = locator.get('some.nested.class');
        assert(service instanceof NestedClass);
    });

    it('should throw an error a reference to a class inside a require is wrong', () => {
        const locator = new Locator(config, {
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

    it('should be able to use a factory method instead of an array with arguments', () => {
        const service = new SomeService();

        const locator = new Locator(config, {
            'some.service.with.factory.method': [
                './some_service', (l, s, c) => {
                    assert(l === locator);
                    assert(s === SomeService);
                    assert(c === config);
                    return service;
                }
            ]
        }, path);

        const result = locator.get('some.service.with.factory.method');
        assert(result === service);
    });

    it('should be able to use a factory method for a key', () => {
        const service = new SomeService();

        const locator = new Locator(config, {
            'some.service.with.factory.method': (l, c) => {
                assert(l === locator);
                assert(c === config);
                return service;
            }
        }, path);

        const result = locator.get('some.service.with.factory.method');
        assert(result === service);
    });

    it('should be able to retrieve a service that depends on another service', () => {
        const locator = new Locator(config, {
            'some.service': [
                './some_service'
            ],
            'some.service.alias': 'some.service',
        }, path);

        const service = locator.get('some.service');
        const serviceAlias = locator.get('some.service.alias');
        assert(serviceAlias === service);
    });
});