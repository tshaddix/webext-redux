import assignIn from 'lodash/assignIn';

import {
  DISPATCH_TYPE,
  STATE_TYPE
} from '../constants';

class Store {
  /**
   * Creates a new Proxy store
   * @param  {object} options An object of form {portName, state}, where `portName` is a required string and defines the name of the port for state transition changes and `state` is the initial state of this store (default `{}`)
   */
  constructor({portName, state = {}, extensionId = ''}) {
    if (!portName) {
      throw new Error('portName is required in options');
    }
    this.extensionId = extensionId; //keep the extensionId as an instance variable
    this.port = chrome.runtime.connect(this.extensionId, {name: portName});
    this.listeners = [];
    this.state = state;

    this.port.onMessage.addListener((message) => {
      if (message.type === STATE_TYPE) {
        this.replaceState(message.payload);
      }
    });

    this.dispatch = this.dispatch.bind(this); //add this context to dispatch
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
   * Dispatch an action to the background using messaging passing
   * @param  {object} data The action data to dispatch
   * @return {Promise}     Promise that will resolve/reject based on the action response from the background
   */
  dispatch(data) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        this.extensionId,
      {
        type: DISPATCH_TYPE,
        payload: data
      }, ({error, value}) => {
        if (error) {
          reject(assignIn((new Error()), error));
        } else {
          resolve(value && value.payload);
        }
      });
    });
  }
}

export default Store;
