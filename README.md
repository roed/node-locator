# node-locator

A simple service locator and dependency container for Node.js

## How to use

There are 2 ways to use this module:
- By using the LocatorFactory. It will automatically search for a service definition file and create a locator instance.
- By creating an instance of the Locator. This way you can pass custom service definitions, or have multiple locators.

## LocatorFactory
Create a directory `config/locator`. In that directory, add a file called `default.js`. This file will contain all service definitions. You can create extra files per environment, so it's possible to overwrite certain definitions per platform. The factory will use process.NODE_ENV if set or 'development' as fallback.

The file should look like this:
```javascript
module.exports = {
    //the key that can be used to locate/inject this class
    'some.key': [
        './relative/path/to/your/class', //this is the relative path from the root of your application
        //constructor arguments
        [
            '@key.of.another.class.this.class.depends.on', //reference to another class
            '%some.config.property%' //reference to a config property -> will inject config.get('some.config.property')
        ]
    ],
}
```

Using the factory:
```javascript
//this will create an instance of the Locator
let locator = require('node-locator').LocatorFactory();

//retrieving an instance
let instanceOfYourClass = locator.get('some.key');
```


## Dependencies

The locator depends on the the [config](https://www.npmjs.com/package/config) module.
