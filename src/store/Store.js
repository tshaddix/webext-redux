import Promise from 'bluebird';

import {
  DISPATCH_TYPE,
  STATE_TYPE
} from '../constants';

class Store {
  constructor({portName, state = {}}) {
    this.port = chrome.runtime.connect({name: portName});
    this.listeners = [];
    this.state = state;

    this.port.onMessage.addListener((message) => {
      if (message.type === STATE_TYPE) {
        this.replaceState(message.payload);
      }
    });

    this.dispatch = this.dispatch.bind(this);
  }

  subscribe(listener) {
    this.listeners.push(listener);

    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  replaceState(state) {
    this.state = state;

    this.listeners.forEach((l) => l());
  }

  getState() {
    return this.state;
  }

  dispatch(data) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: DISPATCH_TYPE,
        payload: data
      }, function({error, value}) {
        if (error) {
          reject(error);
        } else {
          resolve(value);
        }
      });
    });
  }
}

export default Store;
