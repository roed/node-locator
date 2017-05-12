'use strict';

class SomeConfigDependentService {

    /**
     * {string} someConfigProperty
     */
    constructor(someConfigProperty) {
        this.someConfigProperty = someConfigProperty;
    }
}

module.exports = SomeConfigDependentService;