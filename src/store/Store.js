import assignIn from 'lodash/assignIn';

import { default as applyMiddlewareFn } from './applyMiddleware';

import {
  DISPATCH_TYPE,
  STATE_TYPE,
  PATCH_STATE_TYPE
} from '../constants';
import { withSerializer, withDeserializer, noop } from "../serialization";

import patchDeepDiff from './patchDeepDiff';
import deepDiff from '../wrap-store/deepDiff';

const backgroundErrPrefix = '\nLooks like there is an error in the background page. ' +
  'You might want to inspect your background page for more details.\n';

export const applyMiddleware = applyMiddlewareFn;

class Store {
  /**
   * Creates a new Proxy store
   * @param  {object} options An object of form {portName, state, extensionId, serializer, deserializer}, where `portName` is a required string and defines the name of the port for state transition changes, `state` is the initial state of this store (default `{}`) `extensionId` is the extension id as defined by chrome when extension is loaded (default `''`), `serializer` is a function to serialize outgoing message payloads (default is passthrough), and `deserializer` is a function to deserialize incoming message payloads (default is passthrough)
   */
  constructor({portName, state = {}, extensionId = null, serializer = noop, deserializer = noop}) {
    if (!portName) {
      throw new Error('portName is required in options');
    }
    if (typeof serializer !== 'function') {
      throw new Error('serializer must be a function');
    }
    if (typeof deserializer !== 'function') {
      throw new Error('deserializer must be a function');
    }

    this.portName = portName;
    this.readyResolved = false;
    this.readyPromise = new Promise(resolve => this.readyResolve = resolve);

    this.extensionId = extensionId; // keep the extensionId as an instance variable
    this.port = chrome.runtime.connect(this.extensionId, {name: portName});
    this.serializedPortListener = withDeserializer(deserializer)((...args) => this.port.onMessage.addListener(...args));
    this.serializedMessageSender = withSerializer(serializer)((...args) => chrome.runtime.sendMessage(...args), 1);
    this.listeners = [];
    this.state = state;

    // Don't use shouldDeserialize here, since no one else should be using this port
    this.serializedPortListener(message => {
      switch (message.type) {
        case STATE_TYPE:
          this.replaceState(message.payload);

          if (!this.readyResolved) {
            this.readyResolved = true;
            this.readyResolve();
          }
          break;

        case PATCH_STATE_TYPE:
          this.patchState(message.payload);
          break;

        default:
          // do nothing
      }
    });

    this.dispatch = this.dispatch.bind(this); // add this context to dispatch
  }

  /**
  * Returns a promise that resolves when the store is ready. Optionally a callback may be passed in instead.
  * @param [function] callback An optional callback that may be passed in and will fire when the store is ready.
  * @return {object} promise A promise that resolves when the store has established a connection with the background page.
  */
  ready(cb = null) {
    if (cb !== null) {
      return this.readyPromise.then(cb);
    }

    return this.readyPromise;
  }

  /**
   * Subscribes a listener function for all state changes
   * @param  {function} listener A listener function to be called when store state changes
   * @return {function}          An unsubscribe function which can be called to remove the listener from state updates
   */
  subscribe(listener) {
    this.listeners.push(listener);

    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Replaces the state for only the keys in the updated state. Notifies all listeners of state change.
   * @param {object} state the new (partial) redux state
   */
  patchState(difference) {
    console.log("Patching diffs from background", difference);
    const prevState = this.state;
    this.state = patchDeepDiff(this.state, difference);
    console.log("Diff after patch:", deepDiff(this.state, prevState));

    this.listeners.forEach((l) => l());
  }

  /**
   * Replace the current state with a new state. Notifies all listeners of state change.
   * @param  {object} state The new state for the store
   */
  replaceState(state) {
    this.state = state;

    this.listeners.forEach((l) => l());
  }

  /**
   * Get the current state of the store
   * @return {object} the current store state
   */
  getState() {
    return this.state;
  }

  /**
   * Stub function to stay consistent with Redux Store API. No-op.
   */
  replaceReducer() {
    return;
  }

  /**
   * Dispatch an action to the background using messaging passing
   * @param  {object} data The action data to dispatch
   * @return {Promise}     Promise that will resolve/reject based on the action response from the background
   */
  dispatch(data) {
    return new Promise((resolve, reject) => {
      this.serializedMessageSender(
        this.extensionId,
        {
          type: DISPATCH_TYPE,
          portName: this.portName,
          payload: data
        }, null, (resp) => {
          const {error, value} = resp;

          if (error) {
            const bgErr = new Error(`${backgroundErrPrefix}${error}`);

            reject(assignIn(bgErr, error));
          } else {
            resolve(value && value.payload);
          }
        });
    });
  }
}

export default Store;
