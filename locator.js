'use strict';

class Locator {

    /**
     * @param {config} config
     * @param {{}} locatableConfig
     * @param {string} relativePathModifierToRoot eg '../../' if the locator is one folder deep from the root
     */
    constructor(config, locatableConfig, relativePathModifierToRoot) {
        this._config = config;
        this._locatableConfig = locatableConfig;
        this._relativePathModifierToRoot = relativePathModifierToRoot || '../../';

        this._locatable = {};

        this._reservedCharacters = ['%', '@', '~'];
    }

    /**
     * @param {string} name
     * @returns {object}
     */
    get(name) {
        //there is already an instance
        if (this._locatable[name] !== undefined) {
            return this._locatable[name];
        }

        //there is no locatable config, throw an error
        if (this._locatableConfig[name] === undefined) {
            throw new Error('Could not retrieve an instance for ' + name);
        }

        //it's an alias, return the referenced object
        if (typeof this._locatableConfig[name] === 'string') {
            this._locatable[name] = this.get(this._locatableConfig[name]);
            return this._locatable[name];
        }

        //create an instance based on the configuration
        this._locatable[name] = this._createInstance(this._locatableConfig[name]);
        return this._locatable[name];
    }

    /**
     * @param {string} requirable
     * @returns {object}
     * @private
     */
    _require(requirable) {
        const originalRequirable = requirable;

        if (requirable[0] === '.' && requirable[1] === '/') {
            requirable = this._relativePathModifierToRoot + requirable.substr(2);
        }
        if (requirable.indexOf('[') === -1) {
            return require(requirable);
        }
        const splittedRequirable = requirable.split('[');
        requirable = splittedRequirable[0];

        let result = require(requirable);

        splittedRequirable.shift();
        while(splittedRequirable.length > 0) {
            const subRequirable = splittedRequirable.shift().replace(']', '');
            if (result[subRequirable] === undefined) {
                throw new Error('Could not require ' + originalRequirable);
            }
            result = result[subRequirable];
        }
        return result;
    }

    /**
     * @param {{Array}|{string}} locatableConfig
     * @return {object}
     * @private
     */
    _createInstance(locatableConfig) {
        //the config is a factory method, call and return it
        if (typeof locatableConfig === 'function') {
            return locatableConfig(this, this._config);
        }

        const c = this._require(locatableConfig[0]);

        //if the second argument is a function, use it as factory method
        if (typeof locatableConfig[1] === 'function') {
            return locatableConfig[1](this, c, this._config);
        }

        const dependencyConfigs = locatableConfig[1] || [];
        const dependencies = [];
        for (const dependencyConfig of dependencyConfigs) {
            dependencies.push(this._getDependency(dependencyConfig));
        }
        return new c(...dependencies);
    }

    /**
     * @param {string|*} dependencyConfig
     * @returns {object|*}
     * @private
     */
    _getDependency(dependencyConfig) {
        if (typeof dependencyConfig !== 'string') {
            return dependencyConfig;
        }
        const firstChar = dependencyConfig[0];
        const secondChar = dependencyConfig[1];

        if (this._dependencyConfigIsEscaped(firstChar, secondChar)) {
            return dependencyConfig.substr(1);
        }
        //config parameter
        if (firstChar === '%') {
            const configName = dependencyConfig.substr(1, dependencyConfig.length - 2);
            return this._config.get(configName);
        }
        //another service
        if (firstChar === '@') {
            const name = dependencyConfig.substr(1);
            return this.get(name);
        }
        //require
        if (firstChar === '~') {
            const requirable = dependencyConfig.substr(1);
            return this._require(requirable);
        }
        return dependencyConfig;
    }

    /**
     * @param {string} firstChar
     * @param {string} secondChar
     * @returns {boolean}
     * @private
     */
    _dependencyConfigIsEscaped(firstChar, secondChar) {
        if (this._reservedCharacters.indexOf(firstChar) === -1) {
            return false;
        }
        return firstChar === secondChar;
    }
}

module.exports = Locator;
