# React Chrome Redux
A set of utilities for building Redux applications in Google Chrome extensions. Although [React](https://facebook.github.io/react/) is mentioned in the package name, this package's only requirement is Redux. Feel free to use this with [AngularJS](https://angularjs.org/) and other libraries.

[![Build Status](https://travis-ci.org/tshaddix/react-chrome-redux.svg?branch=master)](https://travis-ci.org/tshaddix/react-chrome-redux)
[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]

## Installation

This package is available on [npm](https://www.npmjs.com/package/react-chrome-redux):

```
npm install react-chrome-redux
```

## Overview

`react-chrome-redux` aims to do one simple thing for Chrome extensions: treat the background script as a single place to store a single source of truth redux Store.

All UI Components simply pull their react component state from this store on the background and dispatch actions to a store which proxies all actions to the background and receives state updates from the background.

![Architecture](https://cloud.githubusercontent.com/assets/603426/18599404/329ca9ca-7c0d-11e6-9a02-5718a0fba8db.png)

## Basic Usage ([full docs here](https://github.com/tshaddix/react-chrome-redux/wiki))

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

### 3. Optional: Implement actions whose logic only happens in the background script (we call them aliases)


Sometimes you'll want to make sure the logic of your action creators happen in the background script. In this case, you will want to create an alias so that the alias is proxied from the UI component and the action creator logic executes in the background script.

```js
// background.js

import { applyMiddleware, createStore } from 'redux';
import { alias, wrapStore } from 'react-chrome-redux';

const aliases = {
  // this key is the name of the action to proxy, the value is the action
  // creator that gets executed when the proxied action is received in the
  // background
  'user-clicked-alias': () => {
    // this call can only be made in the background script
    chrome.notifications.create(...);

  };
};

const store = createStore(rootReducer,
  applyMiddleware(
    alias(aliases)
  )
);
```

```js
// content.js

import { Component } from 'react';

const store = ...; // a proxy store

class ContentApp extends Component {
  render() {
    return (
      <input type="button" onClick={ this.dispatchClickedAlias.bind(this) } />
    );
  }

  dispatchClickedAlias() {
    store.dispatch({ type: 'user-clicked-alias' });
  }
}
```

## Docs

* [Introduction](https://github.com/tshaddix/react-chrome-redux/wiki/Introduction)
* [Getting Started](https://github.com/tshaddix/react-chrome-redux/wiki/Getting-Started)
* [Advanced Usage](https://github.com/tshaddix/react-chrome-redux/wiki/Advanced-Usage)
* [API](https://github.com/tshaddix/react-chrome-redux/wiki/API)
  * [Store](https://github.com/tshaddix/react-chrome-redux/wiki/Store)
  * [wrapStore](https://github.com/tshaddix/react-chrome-redux/wiki/wrapStore)
  * [alias](https://github.com/tshaddix/react-chrome-redux/wiki/alias)

## Who's using this?

[![Opentest][opentest-image]][opentest-url]

[![GoGuardian][goguardian-image]][goguardian-url]

Using `react-chrome-redux` in your project? We'd love to hear about it! Just [open an issue](https://github.com/tshaddix/react-chrome-redux/issues) and let us know.


[npm-image]: https://img.shields.io/npm/v/react-chrome-redux.svg
[npm-url]: https://npmjs.org/package/react-chrome-redux
[downloads-image]: https://img.shields.io/npm/dm/react-chrome-redux.svg
[downloads-url]: https://npmjs.org/package/react-chrome-redux
[opentest-image]: https://cloud.githubusercontent.com/assets/2173532/17526884/037a947a-5e1e-11e6-9149-d10e8c55d4ae.png
[opentest-url]: https://www.opentest.co
[goguardian-image]: https://cloud.githubusercontent.com/assets/2173532/17540959/c6749bdc-5e6f-11e6-979c-c0e0da51fc63.png
[goguardian-url]: https://goguardian.com
