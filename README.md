# node-locator

[![NPM](https://nodei.co/npm/node-locator.svg?downloads=true&downloadRank=true)](https://nodei.co/npm/node-locator/)&nbsp;&nbsp;

A simple service locator and dependency container for Node.js using service definition files.

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
    'key.of.another.class.this.class.depends.on': [],
    //etc
}
```
By creating a `development.js`, you can override certain definitions.

Using the factory:
```javascript
//this will create an instance of the Locator
let locator = require('node-locator').LocatorFactory();
```

### Injecting dependencies from node_modules
If you want to inject an instance of a class from the node_modules folder, use the following code:
```javascript
'some-node-modules-dependency-key': [
    'some-node-dependency', //will result in something like: let dep = require('some-node-dependency'); new dep(//constructor args);
    [
        //constructor args
    ]
]
```

### Custom root directory or configuration file location
It is possible to pass another root directory or configuration file location. You can do this like:
```javascript
let locator = require('node-locator').LocatorFactory('../../some/other/root/', 'custom-config-dir/');
```
The locator will look for your classes in the directory `/some/other/root/`. The `../../` is needed because node.js uses relative paths. Because this module will be installed in `node_modules/node-locator`, we need to go 2 directories up first.

The factory will look for the service definitions in `/some/other/root/custom-config-dir/` in this case.

## Creating the Locator manually
It is also possible to use the locator manually, which will give you the flexibility to create multiple locators, or skip the environment/config file part:
```javascript
let Locator = require('node-locator').Locator;
let locator = new Locator(require('config'), {
    //define your services like above
});
```
The third parameter of the constructor can be used to define another root directory. The logic is the same as that for the factory.

## Using the locator
You can use the locator by calling the `get` method
```javascript
let instanceOfYourClass = locator.get('some.key');
```

## Dependencies

The locator depends on the the [config](https://www.npmjs.com/package/config) module.
