'use strict';

class SomeConfigPropertyDependentService {

    /**
     * {string} someConfigProperty
     */
    constructor(someConfigProperty) {
        this.someConfigProperty = someConfigProperty;
    }
}

module.exports = SomeConfigPropertyDependentService;