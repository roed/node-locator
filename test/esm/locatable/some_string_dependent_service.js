'use strict';

export default class SomeStringDependentService {
    /**
     * @param {string} someString
     */
    constructor(someString) {
        this.someString = someString;
    }
}
