'use strict';

export default class SomeRequirableDependentService {

    /**
     * {Function} requirableFunction
     */
    constructor(requirableFunction) {
        this.requirableFunction = requirableFunction;
    }
}
