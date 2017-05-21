'use strict';

class SomeRequirableDependentService {

    /**
     * {Function} requirableFunction
     */
    constructor(requirableFunction) {
        this.requirableFunction = requirableFunction;
    }
}

module.exports = SomeRequirableDependentService;