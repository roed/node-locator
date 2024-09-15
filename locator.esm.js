'use strict';

export default class Locator {

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
    async get(name) {
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
            this._locatable[name] = await this.get(this._locatableConfig[name]);
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
    async _import(requirable) {
        const originalRequirable = requirable;

        if (requirable[0] === '.' && requirable[1] === '/') {
            requirable = this._relativePathModifierToRoot + requirable.substring(2);
        }
        if (requirable.indexOf('[') === -1) {
            return (await import(requirable)).default;
        }
        const splittedRequirable = requirable.split('[');
        requirable = splittedRequirable[0];

        let result = await import(requirable)

        let determineIfDefaultShouldBeUsed = true
        splittedRequirable.shift();
        while(splittedRequirable.length > 0) {
            const subRequirable = splittedRequirable.shift().replace(']', '');
            if (determineIfDefaultShouldBeUsed && result.default !== undefined && result[subRequirable] === undefined) {
                determineIfDefaultShouldBeUsed = false
                result = result.default
            }

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
    async _createInstance(locatableConfig) {
        //the config is a factory method, call and return it
        if (typeof locatableConfig === 'function') {
            return await locatableConfig(this, this._config);
        }

        const c = await this._import(locatableConfig[0]);

        //if the second argument is a function, use it as factory method
        if (typeof locatableConfig[1] === 'function') {
            return await locatableConfig[1](this, c, this._config);
        }

        //if c is not constructable, return c
        if (c.prototype === undefined || c.prototype.constructor === undefined) {
            return c;
        }

        const dependencyConfigs = locatableConfig[1] || [];
        const dependencies = [];
        for (const dependencyConfig of dependencyConfigs) {
            dependencies.push(await this._getDependency(dependencyConfig));
        }
        return new c(...dependencies);
    }

    /**
     * @param {string|*} dependencyConfig
     * @returns {object|*}
     * @private
     */
    async _getDependency(dependencyConfig) {
        if (typeof dependencyConfig !== 'string') {
            return dependencyConfig;
        }
        const firstChar = dependencyConfig[0];
        const secondChar = dependencyConfig[1];

        if (this._dependencyConfigIsEscaped(firstChar, secondChar)) {
            return dependencyConfig.substring(1);
        }
        //config parameter
        if (firstChar === '%') {
            const configName = dependencyConfig.substring(1, dependencyConfig.length - 1);
            return this._config.get(configName);
        }
        //another service
        if (firstChar === '@') {
            const name = dependencyConfig.substring(1);
            return await this.get(name);
        }
        //require
        if (firstChar === '~') {
            const requirable = dependencyConfig.substring(1);
            return await this._import(requirable);
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
