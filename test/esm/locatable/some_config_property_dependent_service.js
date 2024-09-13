'use strict';

export default class SomeConfigPropertyDependentService {

    /**
     * {string} someConfigProperty
     */
    constructor(someConfigProperty) {
        this.someConfigProperty = someConfigProperty;
    }
}
