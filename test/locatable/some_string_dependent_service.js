'use strict';

class SomeStringDependentService {
    /**
     * @param {string} someString
     */
    constructor(someString) {
        this.someString = someString;
    }
}

module.exports = SomeStringDependentService;