# React Chrome Redux
A set of utilities for building Redux applications in Google Chrome extensions. Although [React](https://facebook.github.io/react/) is mentioned in the package name, this package's only requirement is Redux. Feel free to use this with [AngularJS](https://angularjs.org/) and other libraries.

[![Build Status](https://travis-ci.org/tshaddix/react-chrome-redux.svg?branch=master)](https://travis-ci.org/tshaddix/react-chrome-redux)
[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]

## Installation

This package is available on [npm](https://www.npmjs.com/package/react-chrome-redux):

```
npm install --save react-chrome-redux
```

## Basic Usage

As described in the [introduction](https://github.com/tshaddix/react-chrome-redux/wiki/Introduction#react-chrome-redux), there are two pieces to a basic implementation of this package.

### 1. Add the *Proxy Store* to a UI Component, such as a popup

```js
// popover.js

import React from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';
import {Store} from 'react-chrome-redux';

import App from './components/app/App';

const store = new Store({
  portName: 'MY_APP' // communication port name
});

// The store implements the same interface as Redux's store
// so you can use tools like `react-redux` no problem!
render(
  <Provider store={store}>
    <App/>
  </Provider>
  , document.getElementById('app'));
```

### 2. Wrap your Redux store in the background page with `wrapStore()`

```js
// background.js

import {wrapStore} from 'react-chrome-redux';

const store; // a normal Redux store

wrapStore(store, {portName: 'MY_APP'}); // make sure portName matches
```

That's it! The dispatches called from UI component will find their way to the background page no problem. The new state from your background page will make sure to find its way back to the UI components.

## Docs

* [Introduction](https://github.com/tshaddix/react-chrome-redux/wiki/Introduction)
* [Getting Started](https://github.com/tshaddix/react-chrome-redux/wiki/Getting-Started)
* [Advanced Usage](https://github.com/tshaddix/react-chrome-redux/wiki/Advanced-Usage)
* [API](https://github.com/tshaddix/react-chrome-redux/wiki/API)
  * [Store](https://github.com/tshaddix/react-chrome-redux/wiki/Store)
  * [wrapStore](https://github.com/tshaddix/react-chrome-redux/wiki/wrapStore)
  * [alias](https://github.com/tshaddix/react-chrome-redux/wiki/alias)


[npm-image]: https://img.shields.io/npm/v/react-chrome-redux.svg
[npm-url]: https://npmjs.org/package/react-chrome-redux
[downloads-image]: https://img.shields.io/npm/dm/react-chrome-redux.svg
[downloads-url]: https://npmjs.org/package/react-chrome-redux
