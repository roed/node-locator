# node-locator

[![NPM](https://img.shields.io/npm/dm/node-locator.svg)](https://npmjs.org/package/node-locator)

A simple service locator and dependency container for Node.js using service definition files.

It supports a CommonJS and ESM implementation.

When using in an ESM project, the locator uses **async functions**, as it relies on the `import()` function.

## Example usage
A lot of node.js code is written with ES6 classes. This module can manage dependencies and instances for your codebase.
No need to to this anymore:
```javascript
//CommonJS
const Service = require('../../../service/some-service');
const SomeDependency1 = require('../../../other/dir/some-dependency-1');
const SomeDependency2 = require('../../../other/dir/some-dependency-2');

//ESM
import Service from '../../../service/some-service';
import SomeDependency1 from '../../../other/dir/some-dependency-1';
import SomeDependency2 from '../../../other/dir/some-dependency-2';

const someDependency1 = new SomeDependency1();
const someDependency2 = new SomeDependency2();

const service = new Service(someDependency1, someDependency2);
service.doSomething();
```

But instead configure your dependencies with configuration files:
```javascript
module.exports = {
    'some.key': ['./service/some-service.js', ['@dependency-1', '@dependency-2']],
    'dependency-1': ['./other/dir/some-dependency-1.js'],
    'dependency-2': ['./other/dir/some-dependency-2.js'],
}
```

## Using the locator
You can use the locator by calling the `get` method. The locator will automatically create (and cache) instances when needed:
```javascript
//CommonJS
const service = locator.get('some.service');

//ESM
const service = await locator.get('some.service');

service.doSomething();
```

## But why?
- your class instances (of which you'd need only one instance per application) do not clutter your bootstrapping code anymore
- the locator will create instances when needed, instead of creating all objects when the application loads
- all the wiring of services is contained in one configuration file
- easy to use different instances per environment (for instance, if you want to mock api calls to external parties on your development environment)
- easy to inject configuration

## How to use

There are 2 ways to use this module:
- By using the LocatorFactory. It will automatically search for a service definition file and create a locator instance.
- By creating an instance of the Locator. This way you can pass custom service definitions, or have multiple locators.

## LocatorFactory
Create a directory `config/locator`. In that directory, add a file called `default.js`. This file will contain all service definitions. You can create extra files per environment, so it's possible to overwrite certain definitions per platform. The factory will use process.NODE_ENV if set or 'development' as fallback.

The file should look like this:
```javascript
//CommonJS
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

//ESM
export default {
    //the key that can be used to locate/inject this class
    'some.key': [
        './relative/path/to/your/class.js', //this is the relative path from the root of your application
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

//CommonJS
const locator = require('node-locator').LocatorFactory();
//ESM
import { LocatorFactory } from 'node-locator'
const locator = await LocatorFactory()
```

### Injecting class based dependencies from node_modules
If you want to inject an instance of a class from the node_modules folder, use the following code:
```javascript
'some-node-modules-dependency-key': [
    'some-node-dependency',
    [
        //constructor args
    ]
]

// will result in something like:
// CommonJS: const dep = require('some-node-dependency'); new dep(//constructor args); 
// ESM: import dep from 'some-node-dependency'; new dep(//constructor args);
```

### Using a non-constructable require
It is possible to use non-constructable entries. The locator will detect if the required file has a constructor. You can define them like this:
```javascript
'some.key': [
    './path/to/your/non-constructable.js',
]

// will result in something like:
// CommonJS: const dep = require('./path/to/your/non-constructable.js'); 
// ESM: import dep from './path/to/your/non-constructable.js';
```

### Injecting functions
Not all dependencies have to be classes. A lot of modules available for node.js expose only a function when required. You can inject them like this:
```javascript
'some.key': [
    './path/to/your/class.js',
    [
        '~some-function',
        '~./some-non-node-modules-function.js'
    ]
]

// '~some-function' will result in something like:
// CommonJS: const someFunction = require('some-function') 
// ESM: import someFunction from 'some-function';

// '~./some-non-node-modules-function.js' will result in something like:
// CommonJS: const someNonNodeModulesFunction = require('./path/to/your/some-non-node-modules-function.js') 
// ESM: import someNonNodeModulesFunction from './path/to/your/some-non-node-modules-function.js';
```

### Injecting primitive values
It's also possible to inject primitive values:
```javascript
'some.key': [
    './path/to/your/class.js',
    [
        123,
        true,
        'some string'
    ]
]
```
Because the locator also uses strings to inject other dependencies, if the string you want to inject starts with %, @ or ~, you will have to escape it like this:
```
'@@some-string' //the value '@some-string' will be injected
'%%some-string' //the value '%some-string' will be injected
'~~some-string' //the value '~some-string' will be injected
```

### Require nested classes
Sometimes, a module exposes an object containing classes. For instance:
```javascript
//CommonJS
module.exports {
    classA: ClassA,
    classB: ClassB
}

//ESM
export class ClassA {}
export class ClassB {}
```

These objects can be required like this:
```javascript
'some.key': [
    './path/to/your/class.js[classA]'
]
```

### Creating instances using a factory method
In case you cannot use the default mechanisms of the locator for dependencies, you can use a factory method:
```javascript
'some.key': [
    './path/to/your/class.js', (locator, YourClass, config) => {
        return new YourClass(locator.get('some.weird.dependency').getWeirdDependency());
    }
]
```
And it also possible to only define a key and method for maximum flexibility:
```javascript
//CommonJS
'some.key': (locator, config) => {
    const YourClass = require('./path/to/your/class.js');
    return new YourClass(locator.get('some.weird.dependency').getWeirdDependency(), config.get('some.config.property'));
}

//ESM
'some.key': async (locator, config) => {
    const YourClass = (await import('./path/to/your/class.js')).YourClass;
    return new YourClass(locator.get('some.weird.dependency').getWeirdDependency(), config.get('some.config.property'));
}
```
This might be handy in cases like:
- When a node_modules dependency exposes a factory method. (expressjs is a good example)
- When you want to bind methods/callbacks or attach event listeners
- When you want to assign other values than methods/objects to locator keys (eg: a string constructed from config values)

### Using an alias
In case you want to retrieve an instance by another name:
```javascript
'some.key': ['./service/some-service.js'],
'some.alias': 'some.key',
```
Calling `locator.get('some.alias')` will return the service registered under `some.key` (or create and return it).
This might be handy if you want to switch a dependency without having through all configuration.
For instance, if your class is based on an interface. (for example: a logger class with subclasses for console logging and slack logging)

### Custom root directory or configuration file location
It is possible to pass another root directory or configuration file location. You can do this like:
```javascript
//CommonJS
const locator = require('node-locator').LocatorFactory('../../some/other/root/', 'custom-config-dir/');

//ESM
import { LocatorFactory } from 'node-locator'
const locator = await LocatorFactory('../../some/other/root/', 'custom-config-dir/');
```
The locator will look for your classes in the directory `/some/other/root/`. The `../../` is needed because node.js uses relative paths. Because this module will be installed in `node_modules/node-locator`, we need to go 2 directories up first.

The factory will look for the service definitions in `/some/other/root/custom-config-dir/` in this case.

## Creating the Locator manually
It is also possible to use the locator manually, which will give you the flexibility to create multiple locators, or skip the environment/config file part:

```javascript
//CommonJS
const Locator = require('node-locator').Locator;
const locator = new Locator(require('config'), {
  //define your services like above
});

//ESM
import { Locator } from 'node-locator';
import config from 'config';
const locator = new Locator(config);
```
The third parameter of the constructor can be used to define another root directory. The logic is the same as that for the factory.

## Dependencies

The locator depends on the the [config](https://www.npmjs.com/package/config) module.
