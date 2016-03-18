# react-chrome-redux
A set of utilities for building React+Redux applications in Google Chrome extensions.

## The Basics

If you're currently working on a Chrome Extension, or have worked on one in the past, you know that things can get tricky when an extension goes from basic UI or background logic to application level logic. Things you normally breeze through in a "normal" web app are suddenly a headache, such as passing data between popovers and background pages.

A Chrome extension has a long lasting page that runs in the background for the lifetime of the extension, and then separate instances of UI pieces such as a popover. Every time a UI piece is triggered, it reloads from scratch, making data management particularly painful when working outside the background page.

The purpose of this package is to build on the awesome packages of React and Redux, and provide very simple interfaces which allow you to *almost* treat your extension code like your browser code.

## How it Works

The basic idea is to have the state store (aka Redux) run in the background of the application, and have the React side of the application run in the UI components, such as a Popover.

Using [Chrome Extension Messaging](https://developer.chrome.com/extensions/messaging), `react-chrome-redux` transfers actions from the UI components to the background store, and state transitions from the background store to the UI components. Check out the simple examples below.

## Basic Example

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

```js
// background.js

import {wrapStore} from 'react-chrome-redux';

const store; // a normal Redux store

wrapStore(store, {portName: 'MY_APP'}); // make sure portName matches
```

That's actually it. The `dispatch`es called from UI component will find their way to the background page no problem. The new state from your background page will make sure to find its way back to the UI components just like all your other apps.

## Async and Complex Actions

Because actions are sent to the background page via messages in a channel, you don't have the same easy ability to do async behaviour in the initial action call. Don't worry, there's an answer for that: `alias`.

`alias` is a simple middleware which can map actions to new actions. For example, let's say you want to get the current session in your UI components:

```js
// popover/App.jsx

import React, {Component} from 'react';
import {connect} from 'react-redux';

// the mock action
const getSession = () => {
  const data = {
    type: ACTION_GET_SESSION,
    payload: {}
  };

  return data;
};

class App extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.props.dispatch(getSession());
  }

  render() {
    return (
      <div>
        {this.props.session && this.props.users[this.props.session.userId].name}
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    session: state.session,
    users: state.users
  };
};

export default connect(mapStateToProps)(App);

```

In `background.js`, we would get an action of `{type: GET_SESSION}`, which is not very useful to our reducers considering we don't have any data yet.

Using an alias, we can turn this into a new action that does the desired behaviour:

```js
// aliases.js

const getSession = (orginalAction) => {
  // do async stuff before dispatching, etc
};

export default {
  'GET_SESSION': getSession // the action to proxy and the new action to call
};
```

Then you just include it in your middleware for Redux:

```js
import {alias} from 'react-chrome-redux';

import aliases from '../aliases';

const middleware = [
  alias(aliases),
  // whatever middleware you want (like redux-thunk)
];

// createStoreWithMiddleware... you know the drill

```

The nice thing about having this as a middleware is that you can run it with other packages such as `react-thunk`. Your alias can return a function to run instead of an action object, and everything will proceed as normal.

## Action Responses in UI components

It's a common practice to have Redux dispatches return promises with something like `redux-thunk`. This package provides a way to simulate this behavior by providing a `dispatchResponder` in the store wrapper for the background page.

When an action is dispatched from a UI Component, it will return a promise that will resolve/reject with a response from the background page:

```js
// the mock action
const getSession = () => {
  const data = {
    type: ACTION_GET_SESSION,
    payload: {}
  };

  return data;
};

class App extends Component {
  constructor(props) {}

  componentDidMount() {
    // promise returned from `dispatch()`
    this.props.dispatch(getSession())
      .then((data) => {
        // the response data
      })
      .catch((err) => {
        // something broke in the background store
      });
  }

  render() {}
}
```

As you can quickly tell, this is really nice for making UI updates for error/success messages or pending states. By default, this is done by calling a simple `Promise.resolve()` on the dispatch result in the background and responding with an object of `{error, value}` based on rejection or resolution.

What if you don't return promises from your dispatches? Or what if those promises are hidden away in somewhere in the payload? You can pass in a `dispatchResponder` to your store wrapper when calling `wrapStore` to take care of that:

```js
// redux-promise-middleware returns promises under `promise` field in the payload

/**
 * Respond to action based on `redux-promise-middleware` result
 * @param  {object} dispatchResult The resulting object from `store.dispatch()`
 * @param  {func}   send           func to be called when sending response. Should be in form {value, error}
 */
const reduxPromiseResponder = (dispatchResult, send) => {
  Promise
    .resolve(dispatchResult.payload.promise) // pull out the promise
    .then((res) => {
      // if success then respond with value
      send({
        error: null,
        value: res
      });
    })
    .catch((err) => {
      // if error then respond with error
      send({
        error: err,
        value: null
      });
    });
};

// ...

// Add responder to store
wrapStore(store, {
  portName: 'MY_APP',
  dispatchResponder: reduxPromiseResponder
});
```
