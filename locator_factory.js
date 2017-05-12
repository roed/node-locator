'use strict';

const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * @param {string} relativePathModifierToRoot
 * @param {string} locatorConfigPath
 * @returns {Locator}
 */
module.exports = function(relativePathModifierToRoot, locatorConfigPath) {
    relativePathModifierToRoot = relativePathModifierToRoot || '../../';
    locatorConfigPath = locatorConfigPath || 'config/locator/';

    let config = require('config');
    let Locator = require('./locator');

    let locatableDirectory = relativePathModifierToRoot + locatorConfigPath;
    let locatableDefault = require(locatableDirectory + 'default');
    let locatable = Object.assign({}, locatableDefault);

    //load another config based on the environment
    try {
        let locatableForEnvironment = require( locatableDirectory + NODE_ENV );
        locatable = Object.assign(locatable, locatableForEnvironment);
    } catch (e) {}

    return new Locator(config, locatable, relativePathModifierToRoot);
};