'use strict';

import assert from 'assert';
import Locator from '../../locator.esm.js'

import SomeService from './locatable/some_service.js'
import SomeOtherService from './locatable/some_other_service.js'

describe('Locator', () => {
    const path = './test/esm/locatable/';
    let config = {};

    beforeEach(() => {
        config = {};
    });

    it('should be able to retrieve a service that depends on another service', async () => {
        const locator = new Locator(config, {
            'some.service': [
                './some_service.js'
            ],
            'some.other.service': [
                './some_other_service.js', [
                    '@some.service'
                ]
            ],
        }, path);

        const someOtherService = await locator.get('some.other.service');
        assert(someOtherService instanceof SomeOtherService);
        assert(someOtherService.someService instanceof SomeService);
    });

    it('should create only one instance per key', async () => {
        const locator = new Locator(config, {
            'some.service': [
                './some_service.js'
            ]
        }, path);

        const instanceA = await locator.get('some.service');
        const instanceB = await locator.get('some.service');
        assert(instanceA === instanceB);
    });

    it('should throw an error when the service could not be found', async () => {
        const locator = new Locator(config, {}, path);

        await assert.rejects(() => {
            return locator.get('some.invalid.key');
        }, (e) => {
            return e.message === 'Could not retrieve an instance for some.invalid.key';
        });
    });

    it('should be able to inject config parameters', async () => {
        const locator = new Locator(config, {
            'some.config.property.dependent.service': [
                './some_config_property_dependent_service.js', [
                    '%some.config%'
                ]
            ],
        }, path);

        config.get = function(configKey) {
            assert.strictEqual(configKey, 'some.config');
            return 'cool!';
        };

        const service = await locator.get('some.config.property.dependent.service');
        assert.strictEqual(service.someConfigProperty, 'cool!');
    });

    it('should be able to inject a "hard" require', async () => {
        const locator = new Locator(config, {
            'some.requirable.dependent.service': [
                './some_requirable_dependent_service.js', [
                    '~./some_requirable_function.js'
                ]
            ],
        }, path);

        const fn = (await import('./locatable/some_requirable_function.js')).default;

        const service = await locator.get('some.requirable.dependent.service');
        assert.strictEqual(service.requirableFunction, fn);
    });

    it('should be able to use a non-constructable require', async () => {
        const locator = new Locator(config, {
            'some.data': [
                './some_data.js'
            ],
        }, path);

        const someData = (await import('./locatable/some_data.js')).default;
        
        const result = await locator.get('some.data');
        assert.strictEqual(result, someData);
    });

    it('should inject normal strings when reserved characters are escaped', async () => {
        const reservedCharacters = ['%', '@', '~'];
        for (const reservedCharacter of reservedCharacters) {
            const locator = new Locator(config, {
                'some.string.dependent.service': [
                    './some_string_dependent_service.js', [
                        reservedCharacter + reservedCharacter + 'hi'
                    ]
                ],
            }, path);

            const service = await locator.get('some.string.dependent.service');
            assert.strictEqual(reservedCharacter + 'hi', service.someString);
        }
    });

    it('should be able to reference classes inside a require', async () => {
        const locator = new Locator(config, {
            'some.nested.class': [
                './some_nested_class.js[nested][moreNesting]'
            ],
        }, path);

        const NestedClass = (await import('./locatable/some_nested_class.js')).default.nested.moreNesting;
        const service = await locator.get('some.nested.class');
        assert(service instanceof NestedClass);
    });

    it('should throw an error a reference to a class inside a require is wrong', async () => {
        const locator = new Locator(config, {
            'some.nested.class': [
                './some_nested_class.js[invalidNesting][moreNesting]'
            ],
        }, path);

        await assert.rejects(() => {
            return locator.get('some.nested.class');
        }, (e) => {
            return e.message === 'Could not require ./some_nested_class.js[invalidNesting][moreNesting]';
        });
    });

    it('should be able to use a factory method instead of an array with arguments', async () => {
        const service = new SomeService();

        const locator = new Locator(config, {
            'some.service.with.factory.method': [
                './some_service.js', (l, s, c) => {
                    assert(l === locator);
                    assert(s === SomeService);
                    assert(c === config);
                    return service;
                }
            ]
        }, path);

        const result = await locator.get('some.service.with.factory.method');
        assert(result === service);
    });

    it('should be able to use a factory method for a key', async () => {
        const service = new SomeService();

        const locator = new Locator(config, {
            'some.service.with.factory.method': (l, c) => {
                assert(l === locator);
                assert(c === config);
                return service;
            }
        }, path);

        const result = await locator.get('some.service.with.factory.method');
        assert(result === service);
    });

    it('should be able to retrieve a service that depends on another service', async () => {
        const locator = new Locator(config, {
            'some.service': [
                './some_service.js'
            ],
            'some.service.alias': 'some.service',
        }, path);

        const service = await locator.get('some.service');
        const serviceAlias = await locator.get('some.service.alias');
        assert(serviceAlias === service);
    });

    it('should be able to retrieve other classes than the default as well', async () => {
        const locator = new Locator(config, {
            'some.none.default.service': [
                './multiple_classes.js[SomeOtherClass]'
            ],
        }, path);

        const NestedClass = (await import('./locatable/multiple_classes.js')).SomeOtherClass;
        const service = await locator.get('some.none.default.service');
        assert(service instanceof NestedClass);
    });

    it('should be able to retrieve modules from node_modules', async () => {
        const locator = new Locator(config, {
            'some.node-module': [
                'mocha'
            ],
        }, path);

        const Mocha = await import('mocha');
        const service = await locator.get('some.node-module');
        assert(service instanceof Mocha.default);
    });
});
