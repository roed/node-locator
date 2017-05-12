'use strict';

class Locator {

    /**
     * @param {config} config
     * @param {{}} locatableConfig
     * @param {string} relativePathModifierToRoot eg '../' if the locator is one folder deep from the root
     */
    constructor(config, locatableConfig, relativePathModifierToRoot) {
        this._config = config;
        this._locatableConfig = locatableConfig;
        this._relativePathModifierToRoot = relativePathModifierToRoot;

        this._locatable = {};
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

        //there is locatable config, so create an instance
        if (this._locatableConfig[name] !== undefined) {
            this._locatable[name] = this._createInstance(this._locatableConfig[name]);
            return this._locatable[name];
        }

        throw new Error('Could not retrieve an instance for ' + name);
    }

    /**
     * @param {{}} locatableConfig
     * @return {object}
     * @private
     */
    _createInstance(locatableConfig) {
        let requirable = locatableConfig[0];
        if (requirable[0] === '.' && requirable[1] === '/') {
            requirable = this._relativePathModifierToRoot + requirable.substr(2);
        }
        let c = require(requirable);

        let dependencyConfigs = locatableConfig[1] || [];
        let dependencies = [];
        for (let dependencyConfig of dependencyConfigs) {
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
        let firstChar = dependencyConfig[0];
        if (firstChar === '%') {
            let configName = dependencyConfig.substr(1, dependencyConfig.length - 2);
            return this._config.get(configName);
        }
        if (firstChar === '@') {
            let name = dependencyConfig.substr(1);
            return this.get(name);
        }
        return dependencyConfig;
    }
}

module.exports = Locator;