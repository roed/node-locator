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
            'some.config.dependent.service': [
                './some_config_dependent_service', [
                    '%some.config%'
                ]
            ],
        }, path);

        config.get = function(configKey) {
            assert.equal(configKey, 'some.config');
            return 'cool!';
        };

        let service = locator.get('some.config.dependent.service');
        assert.equal(service.someConfigProperty, 'cool!');
    });
});