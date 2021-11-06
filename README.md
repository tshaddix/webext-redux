# WebExt Redux
A set of utilities for building Redux applications in web extensions. This package was originally named `react-chrome-redux`.

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]

## Installation

This package is available on [npm](https://www.npmjs.com/package/webext-redux):

```
npm install webext-redux
```

## Overview

`webext-redux` allows you to build your Web Extension like a Redux-powered webapp. The background page holds the Redux store, while Popovers and Content-Scripts act as UI Components, passing actions and state updates between themselves and the background store. At the end of the day, you have a single source of truth (your Redux store) that describes the entire state of your extension.

All UI Components follow the same basic flow:

1. UI Component dispatches action to a Proxy Store.
2. Proxy Store passes action to background script.
3. Redux Store on the background script updates its state and sends it back to UI Component.
4. UI Component is updated with updated state.

![Architecture](https://cloud.githubusercontent.com/assets/603426/18599404/329ca9ca-7c0d-11e6-9a02-5718a0fba8db.png)

## Basic Usage ([full docs here](https://github.com/tshaddix/webext-redux/wiki))

As described in the [introduction](https://github.com/tshaddix/webext-redux/wiki/Introduction#webext-redux), there are two pieces to a basic implementation of this package.

### 1. Add the *Proxy Store* to a UI Component, such as a popup

```js
// popover.js

import React from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';
import {Store} from 'webext-redux';

import App from './components/app/App';

const store = new Store();

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

import {wrapStore} from 'webext-redux';

const store; // a normal Redux store

wrapStore(store);
```

That's it! The dispatches called from UI component will find their way to the background page no problem. The new state from your background page will make sure to find its way back to the UI components.




### 3. Optional: Apply any redux middleware to your *Proxy Store* with `applyMiddleware()`


Just like a regular Redux store, you can apply Redux middlewares to the Proxy store by using the library provided applyMiddleware function.  This can be useful for doing things such as dispatching thunks to handle async control flow.

```js
// content.js
import {Store, applyMiddleware} from 'webext-redux';
import thunkMiddleware from 'redux-thunk';

// Proxy store
const store = new Store();

// Apply middleware to proxy store
const middleware = [thunkMiddleware];
const storeWithMiddleware = applyMiddleware(store, ...middleware);

// You can now dispatch a function from the proxy store
storeWithMiddleware.dispatch((dispatch, getState) => {
  // Regular dispatches will still be routed to the background
  dispatch({ type: 'start-async-action' });
  setTimeout(() => {
    dispatch({ type: 'complete-async-action' });
  }, 0);
});
```



### 4. Optional: Implement actions whose logic only happens in the background script (we call them aliases)


Sometimes you'll want to make sure the logic of your action creators happen in the background script. In this case, you will want to create an alias so that the alias is proxied from the UI component and the action creator logic executes in the background script.

```js
// background.js

import { applyMiddleware, createStore } from 'redux';
import { alias, wrapStore } from 'webext-redux';

const aliases = {
  // this key is the name of the action to proxy, the value is the action
  // creator that gets executed when the proxied action is received in the
  // background
  'user-clicked-alias': () => {
    // this call can only be made in the background script
    browser.notifications.create(...);

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

### 5. Optional: Retrieve information about the initiator of the action

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

No changes are required to your actions, webext-redux automatically adds this information for you when you use a wrapped store.

## Migrating from regular Redux

### 1. dispatch

Contrary to regular Redux, **all** dispatches are asynchronous and return a `Promise`.
It is inevitable since proxy stores and the main store communicate via browser messaging, which is inherently asynchronous.

In pure Redux, dispatches are synchronous 
(which may not be true with some middlewares such as `redux-thunk`).

Consider this piece of code:
```js
store.dispatch({ type: MODIFY_FOO_BAR, value: 'new value'});
console.log(store.getState().fooBar);
```

You can rely that `console.log` in the code above will display the modified value.

In `webext-redux` on the Proxy Store side you will need to 
explicitly wait for the dispatch to complete:

```js
store.dispatch({ type: MODIFY_FOO_BAR, value: 'new value'}).then(() => 
    console.log(store.getState().fooBar)
);
```
or, using async/await syntax:

```js
await store.dispatch({ type: MODIFY_FOO_BAR, value: 'new value'});
console.log(store.getState().fooBar);
```

### 2. dispatch / React component updates

This case is relatively rare.

On the Proxy Store side, React component updates with `webext-redux` 
are more likely to take place after a dispatch is started and before it completes.

While the code below might work (luckily?) in classical Redux, 
it does not anymore since the component has been updated before the `deletePost` is fully completed
and `post` object is not accessible anymore in the promise handler:
```js
class PostRemovePanel extends React.Component {
    (...)
    
    handleRemoveButtonClicked() {
        this.props.deletePost(this.props.post)
          .then(() => {
            this.setState({ message: `Post titled ${this.props.post.title} has just been deleted` });
          });
    }
}
```
On the other hand, this piece of code is safe:

```js
    handleRemoveButtonClicked() {
        const post = this.props.post;
        this.props.deletePost(post);
          .then(() => {
            this.setState({ message: `Post titled ${post.title} has just been deleted` });
          });
        }
    }
```

### Other

If you spot any more surprises that are worth watching out for, make sure to let us know!

## Security

`webext-redux` supports `onMessageExternal` which is fired when a message is sent from another extension, app, or website. By default, if `externally_connectable` is not declared in your extension's manifest, all extensions or apps will be able to send messages to your extension, but no websites will be able to. You can follow [this](https://developer.chrome.com/extensions/manifest/externally_connectable) to address your needs appropriately.

## Custom Serialization

You may wish to implement custom serialization and deserialization logic for communication between the background store and your proxy store(s). Web Extension's message passing (which is used to implement this library) automatically serializes messages when they are sent and deserializes them when they are received. In the case that you have non-JSON-ifiable information in your Redux state, like a circular reference or a `Date` object, you will lose information between the background store and the proxy store(s). To manage this, both `wrapStore` and `Store` accept `serializer` and `deserializer` options. These should be functions that take a single parameter, the payload of a message, and return a serialized and deserialized form, respectively. The `serializer` function will be called every time a message is sent, and the `deserializer` function will be called every time a message is received. Note that, in addition to state updates, action creators being passed from your content script(s) to your background page will be serialized and deserialized as well.

### Example
For example, consider the following `state` in your background page:

```js
{todos: [
    {
      id: 1,
      text: 'Write a Web extension',
      created: new Date(2018, 0, 1)
    }
]}
```

With no custom serialization, the `state` in your proxy store will look like this:

```js
{todos: [
    {
      id: 1,
      text: 'Write a Web extension',
      created: {}
    }
]}
```

As you can see, Web Extension's message passing has caused your date to disappear. You can pass a custom `serializer` and `deserializer` to both `wrapStore` and `Store` to make sure your dates get preserved:

```js
// background.js

import {wrapStore} from 'webext-redux';

const store; // a normal Redux store

wrapStore(store, {
  serializer: payload => JSON.stringify(payload, dateReplacer),
  deserializer: payload => JSON.parse(payload, dateReviver)
});
```

```js
// content.js

import {Store} from 'webext-redux';

const store = new Store({
  serializer: payload => JSON.stringify(payload, dateReplacer),
  deserializer: payload => JSON.parse(payload, dateReviver)
});
```

In this example, `dateReplacer` and `dateReviver` are a custom JSON [replacer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) and [reviver](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse) function, respectively. They are defined as such:

```js
function dateReplacer (key, value) {
  // Put a custom flag on dates instead of relying on JSON's native
  // stringification, which would force us to use a regex on the other end
  return this[key] instanceof Date ? {"_RECOVER_DATE": this[key].getTime()} : value
};

function dateReviver (key, value) {
  // Look for the custom flag and revive the date
  return value && value["_RECOVER_DATE"] ? new Date(value["_RECOVER_DATE"]) : value
};

const stringified = JSON.stringify(state, dateReplacer)
//"{"todos":[{"id":1,"text":"Write a Web extension","created":{"_RECOVER_DATE":1514793600000}}]}"

JSON.parse(stringified, dateReviver)
// {todos: [{ id: 1, text: 'Write a Web extension', created: new Date(2018, 0, 1) }]}
```

## Custom Diffing and Patching Strategies

On each state update, `webext-redux` generates a patch based on the difference between the old state and the new state. The patch is sent to each proxy store, where it is used to update the proxy store's state. This is more efficient than sending the entire state to each proxy store on every update.
If you find that the default patching behavior is not sufficient, you can fine-tune `webext-redux` using custom diffing and patching strategies. 

### Deep Diff Strategy

By default, `webext-redux` uses a shallow diffing strategy to generate patches. If the identity of any of the store's top-level keys changes, their values are patched wholesale. Most of the time, this strategy will work just fine. However, in cases where a store's state is highly nested, or where many items are stored by key under a single slice of state, it can start to affect performance. Consider, for example, the following `state`:

```js
{
  items: {
    "a": { ... },
    "b": { ... },
    "c": { ... },
    "d": { ... },
    // ...
  },
  // ...
}
```

If any of the individual keys under `state.items` is updated, `state.items` will become a new object (by standard Redux convention). As a result, the default diffing strategy will send then entire `state.items` object to every proxy store for patching. Since this involves serialization and deserialization of the entire object, having large objects - or many proxy stores - can create a noticeable slowdown. To mitigate this, `webext-redux` also provides a deep diffing strategy, which will traverse down the state tree until it reaches non-object values, keeping track of only the updated keys at each level of state. So, for the example above, if the object under `state.items.b` is updated, the patch will only contain those keys under `state.items.b` whose values actually changed. The deep diffing strategy can be used like so:

```js
// background.js

import {wrapStore} from 'webext-redux';
import deepDiff from 'webext-redux/lib/strategies/deepDiff/diff';

const store; // a normal Redux store

wrapStore(store, {
  diffStrategy: deepDiff
});
```

```js
// content.js

import {Store} from 'webext-redux';
import patchDeepDiff from 'webext-redux/lib/strategies/deepDiff/patch';

const store = new Store({
  patchStrategy: patchDeepDiff
});
```

Note that the deep diffing strategy currently diffs arrays shallowly, and patches item changes based on typed equality.

#### Custom Deep Diff Strategy

`webext-redux` also provides a `makeDiff` function to customize the deep diffing strategy. It takes a `shouldContinue` function, which is called during diffing just after each state tree traversal, and should return a boolean indicating whether or not to continue down the tree, or to just treat the current object as a value. It is called with the old state, the new state, and the current position in the state tree (provided as a list of keys so far). Continuing the example from above, say you wanted to treat all of the individual items under `state.items` as values, rather than traversing into each one to compare its properties:

```js
// background.js

import {wrapStore} from 'webext-redux';
import makeDiff from 'webext-redux/lib/strategies/deepDiff/makeDiff';

const store; // a normal Redux store

const shouldContinue = (oldState, newState, context) => {
  // If we've just traversed into a key under state.items,
  // stop traversing down the tree and treat this as a changed value.
  if (context.length === 2 && context[0] === 'items') {
    return false;
  }
  // Otherwise, continue down the tree.
  return true;
}
// Make the custom deep diff using the shouldContinue function
const customDeepDiff = makeDiff(shouldContinue);

wrapStore(store, {
  diffStrategy: customDeepDiff // Use the custom deep diff
});
```

Now, for each key under `state.items`, `webext-redux` will treat it as a value and patch it wholesale, rather than comparing each of its individual properties.

A `shouldContinue` function of the form `(oldObj, newObj, context) => context.length === 0` is equivalent to `webext-redux`'s default shallow diffing strategy, since it will only check the top-level keys (when `context` is an empty list) and treat everything under them as changed values.

### Custom `diffStrategy` and `patchStrategy` functions

You can also provide your own diffing and patching strategies, using the `diffStrategy` parameter in `wrapStore` and the `patchStrategy` parameter in `Store`, repsectively. A diffing strategy should be a function that takes two arguments - the old state and the new state - and returns a patch, which can be of any form. A patch strategy is a function that takes two arguments - the old state and a patch - and returns the new state.
When using a custom diffing and patching strategy, you are responsible for making sure that they function as expected; that is, that `patchStrategy(oldState, diffStrategy(oldState, newState))` is equal to `newState`.

Aside from being able to fine-tune `webext-redux`'s performance, custom diffing and patching strategies allow you to use `webext-redux` with Redux stores whose states are not vanilla Javascript objects. For example, you could implement diffing and patching strategies - along with corresponding custom serialization and deserialization functions - that allow you to handle [Immutable.js](https://github.com/facebook/immutable-js) collections.

## Docs

* [Introduction](https://github.com/tshaddix/webext-redux/wiki/Introduction)
* [Getting Started](https://github.com/tshaddix/webext-redux/wiki/Getting-Started)
* [Advanced Usage](https://github.com/tshaddix/webext-redux/wiki/Advanced-Usage)
* [API](https://github.com/tshaddix/webext-redux/wiki/API)
  * [Store](https://github.com/tshaddix/webext-redux/wiki/Store)
  * [wrapStore](https://github.com/tshaddix/webext-redux/wiki/wrapStore)
  * [alias](https://github.com/tshaddix/webext-redux/wiki/alias)

## Who's using this?

[![Loom][loom-image]][loom-url]

[![GoGuardian][goguardian-image]][goguardian-url]

[![Chrome IG Story][chrome-ig-story-image]][chrome-ig-story-url]

[<img src="https://user-images.githubusercontent.com/1683635/56149225-12f1dc00-5f7a-11e9-884c-8ee2805f10a0.png" height="75">][mabl-url]

[![Storyful][storyful-image]][storyful-url]

Using `webext-redux` in your project? We'd love to hear about it! Just [open an issue](https://github.com/tshaddix/webext-redux/issues) and let us know.


[npm-image]: https://img.shields.io/npm/v/webext-redux.svg
[npm-url]: https://npmjs.org/package/webext-redux
[downloads-image]: https://img.shields.io/npm/dm/webext-redux.svg
[downloads-url]: https://npmjs.org/package/webext-redux
[loom-image]: https://cloud.githubusercontent.com/assets/603426/22037715/28c653aa-dcad-11e6-814d-d7a418d5670f.png
[loom-url]: https://www.useloom.com
[goguardian-image]: https://cloud.githubusercontent.com/assets/2173532/17540959/c6749bdc-5e6f-11e6-979c-c0e0da51fc63.png
[goguardian-url]: https://goguardian.com
[chrome-ig-story-image]: https://user-images.githubusercontent.com/2003684/34464412-895af814-ee32-11e7-86e4-b602bf58cdbc.png
[chrome-ig-story-url]: https://chrome.google.com/webstore/detail/chrome-ig-story/bojgejgifofondahckoaahkilneffhmf
[mabl-url]: https://www.mabl.com
[storyful-image]: https://user-images.githubusercontent.com/702227/140521240-be12e5ba-4f4e-4593-80a0-352f1acfe039.jpeg
[storyful-url]: https://storyful.com
