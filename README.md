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

`react-chrome-redux` allows you to build your Chrome extension like a Redux-powered webapp. The background page holds the Redux store, while Popovers and Content-Scripts act as UI Components, passing actions and state updates between themselves and the background store. At the end of the day, you have a single source of truth (your Redux store) that describes the entire state of your extension.

All UI Components follow the same basic flow:

1. UI Component dispatches action to a Proxy Store.
2. Proxy Store passes action to background script.
3. Redux Store on the background script updates its state and sends it back to UI Component.
4. UI Component is updated with updated state.

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

// wait for the store to connect to the background page
store.ready().then(() => {
  // The store implements the same interface as Redux's store
  // so you can use tools like `react-redux` no problem!
  render(
    <Provider store={store}>
      <App/>
    </Provider>
    , document.getElementById('app'));
});
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

### 4. Optional: Retrieve information about the initiator of the action

There are probably going to be times where you are going to want to know who sent you a message. For example, maybe you have a UI Component that lives in a tab and you want to have it send information to a store that is managed by the background script and you want your background script to know which tab sent the information to it. You can retrieve this information by using the `_sender` property of the action. Let's look at an example of what this would look like.

```js
// actions.js

export const MY_ACTION = 'MY_ACTION';

export function myAction(data) {
    return {
        type: MY_ACTION,
        data: data,
    };
}
```

```js
// reducer.js

import {MY_ACTION} from 'actions.js';

export function rootReducer(state = ..., action) {
    switch (action.type) {
    case MY_ACTION:
        return Object.assign({}, ...state, {
            lastTabId: action._sender.tab.id
        });
    default:
        return state;
    }
}
```

No changes are required to your actions, react-chrome-redux automatically adds this information for you when you use a wrapped store.

## Security

`react-chrome-redux` supports `onMessageExternal` which is fired when a message is sent from another extension, app, or website. By default, if `externally_connectable` is not declared in your extension's manifest, all extensions or apps will be able to send messages to your extension, but no websites will be able to. You can follow [this](https://developer.chrome.com/extensions/manifest/externally_connectable) to address your needs appropriately.

## Docs

* [Introduction](https://github.com/tshaddix/react-chrome-redux/wiki/Introduction)
* [Getting Started](https://github.com/tshaddix/react-chrome-redux/wiki/Getting-Started)
* [Advanced Usage](https://github.com/tshaddix/react-chrome-redux/wiki/Advanced-Usage)
* [API](https://github.com/tshaddix/react-chrome-redux/wiki/API)
  * [Store](https://github.com/tshaddix/react-chrome-redux/wiki/Store)
  * [wrapStore](https://github.com/tshaddix/react-chrome-redux/wiki/wrapStore)
  * [alias](https://github.com/tshaddix/react-chrome-redux/wiki/alias)

## Who's using this?

[![Loom][loom-image]][loom-url]

[![GoGuardian][goguardian-image]][goguardian-url]

[![Chrome IG Story][chrome-ig-story-image]][chrome-ig-story-url]

Using `react-chrome-redux` in your project? We'd love to hear about it! Just [open an issue](https://github.com/tshaddix/react-chrome-redux/issues) and let us know.


[npm-image]: https://img.shields.io/npm/v/react-chrome-redux.svg
[npm-url]: https://npmjs.org/package/react-chrome-redux
[downloads-image]: https://img.shields.io/npm/dm/react-chrome-redux.svg
[downloads-url]: https://npmjs.org/package/react-chrome-redux
[loom-image]: https://cloud.githubusercontent.com/assets/603426/22037715/28c653aa-dcad-11e6-814d-d7a418d5670f.png
[loom-url]: https://www.useloom.com
[goguardian-image]: https://cloud.githubusercontent.com/assets/2173532/17540959/c6749bdc-5e6f-11e6-979c-c0e0da51fc63.png
[goguardian-url]: https://goguardian.com
[chrome-ig-story-image]: https://user-images.githubusercontent.com/2003684/34464412-895af814-ee32-11e7-86e4-b602bf58cdbc.png
[chrome-ig-story-url]: https://chrome.google.com/webstore/detail/chrome-ig-story/bojgejgifofondahckoaahkilneffhmf
