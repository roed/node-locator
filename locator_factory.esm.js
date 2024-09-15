'use strict';

const NODE_ENV = process.env.NODE_ENV || 'development';

import Locator from './locator.esm.js';
import config from 'config'

/**
 * @param {string} relativePathModifierToRoot
 * @param {string} locatorConfigPath
 * @returns {Locator}
 */
export default async function(relativePathModifierToRoot, locatorConfigPath) {
    relativePathModifierToRoot = relativePathModifierToRoot || '../../';
    locatorConfigPath = locatorConfigPath || 'config/locator/';

    const locatableDirectory = relativePathModifierToRoot + locatorConfigPath;
    const locatableDefault = (await import(locatableDirectory + 'default.js')).default;
    let locatable = Object.assign({}, locatableDefault);

    //load another config based on the environment
    try {
        let locatableForEnvironment = (await import( locatableDirectory + NODE_ENV + '.js' )).default;
        locatable = Object.assign(locatable, locatableForEnvironment);
    } catch (e) {}

    return new Locator(config, locatable, relativePathModifierToRoot);
};
