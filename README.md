# nordnet-release-plugin

[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Coveralls Status][coveralls-image]][coveralls-url]
[![Dependency Status][depstat-image]][depstat-url]

> Nordnet release plugin - webpack plugin for building releases of Javascript applications

## Purpose
The purpose of this plugin is to simplify continuous integration with Javascript components in legacy websites.
By placing a single `<script>` tag in legacy web it will automatically load latest version of the Javascript component after successful deployment, without requiring any change in the original script tag.


## Installation

Install plugin as dev dependency

```bash
npm install nordnet-release-plugin --save-dev
```

## Basic usage

Include plugin in webpack config

```js
var NordnetReleasePlugin = require('nordnet-release-plugin');

plugins.push(new NordnetReleasePlugin({
  publicPath: '/sc/project-name/cache/v1'
}));
```

See [webpack docs][webpack-using-plugins] for more information on how to use plugins with webpack.

Plugin generates one Javascript file per entry point defined in Webpack config. These js files can be included on the page via `<script></script>` tag. Once loaded on the page it will dynamically inject `<script></script>` tag with link to an actual required entry point (according to webpack and nordnet-release-plugin settings).

For example, add `<script>` tag on html page where you want to run your Javascript application

```html
<script src="init/index.js"></script>
```

`index.js` might have the following content (depending on your nordnet-release-plugin and webpack configuration)

```js
document.write('<script charset="UTF-8" src="/sc/project-name/cache/v1/index.js"></script>');
```

Once `index.js` is loaded it will inject `<script>` tag on the page to load application entry point.

**Note:** If you have two entry points, then nordnet-release-plugin will generate two JavaScript files respectively, e.g. `init/contacts.js` and `init/blog.js` for following webpack configuration:

```js
var entry = {
  contacts: ['./contacts-page.jsx'],
  blog: ['./blog-page.jsx'],
};
```

## Configuration

You can pass a hash of configuration options to `nordnet-release-plugin`.

```js
var NordnetReleasePlugin = require('nordnet-release-plugin');

plugins.push(new NordnetReleasePlugin({
  initDir: './dist/init',
  publicPath: '/sc/project-name/cache/v1',
  ignoreChunks: [ 'async' ],
  async: false,
}));
```

### Options

__initDir__:

Location where generated base.js should be saved. Defaults to `'./dist/init'`

__publicPath__:

Path that should be used when creating links to entry points (path where your application is deployed, e.g. '/sc/project-name/cache/v1'). Defaults to `'/'`

__ignoreChunks__:

Array with chunk names that should be ignored. Defaults to empty array.
If your application has multiple entry points and for some reason you want to exclude some of them then pass entry point names (as configured in webpack) to `ignoreChunks` array.

```js
var entryPoints = {
  index: [ './index.js' ],
  admin: [ './admin.js' ],
};

plugins.push(new NordnetReleasePlugin({
  ignoreChunks: [ 'admin' ],
}));

```

If you are using `require.ensure()` to create split points and want to make sure that all of them don't end up in `.js` for your entry point then consider using set up describe below.

Define a code split point using `require.ensure` and provide a chunk name, see [require.ensure][require-ensure] for more details

```js
function admin() {
  require.ensure([], function(require) {
    var admin = require('./admin');
    admin();
  }, 'admin');
}
```

Set up `nordnet-release-plugin` to ignore async chunk when generating `base.js`

```js
plugins.push(new NordnetReleasePlugin({
  ignoreChunks: [ 'admin' ],
}));
```

__async__:

`true | false` When set to `true` then scripts will be dynamically injected on the page instead of using `document.write`. Defaults to `false`.


## License

MIT © [Nordnet Bank AB](https://www.nordnet.se/)

[npm-url]: https://npmjs.org/package/nordnet-release-plugin
[npm-image]: https://img.shields.io/npm/v/nordnet-release-plugin.svg?style=flat-square

[travis-url]: https://travis-ci.org/nordnet/nordnet-release-plugin
[travis-image]: https://img.shields.io/travis/nordnet/nordnet-release-plugin.svg?style=flat-square

[coveralls-url]: https://coveralls.io/r/nordnet/nordnet-release-plugin
[coveralls-image]: https://img.shields.io/coveralls/nordnet/nordnet-release-plugin.svg?style=flat-square

[depstat-url]: https://david-dm.org/nordnet/nordnet-release-plugin
[depstat-image]: https://david-dm.org/nordnet/nordnet-release-plugin.svg?style=flat-square

[webpack-using-plugins]: http://webpack.github.io/docs/using-plugins.html
[require-ensure]: http://webpack.github.io/docs/api-in-modules.html#require-ensure
