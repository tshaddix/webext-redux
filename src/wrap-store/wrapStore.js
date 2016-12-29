import {
  DISPATCH_TYPE,
  STATE_TYPE
} from '../constants';

/**
 * Responder for promisified results
 * @param  {object} dispatchResult The result from `store.dispatch()`
 * @param  {function} send         The function used to respond to original message
 * @return {undefined}
 */
const promiseResponder = (dispatchResult, send) => {
  Promise
    .resolve(dispatchResult)
    .then((res) => {
      send({
        error: null,
        value: res
      });
    })
    .catch((err) => {
      send({
        error: err,
        value: null
      });
    });
};

export default (store, {
  portName,
  dispatchResponder
}) => {
  if (!portName) {
    throw new Error('portName is required in options');
  }

  // set dispatch responder as promise responder
  if (!dispatchResponder) {
    dispatchResponder = promiseResponder;
  }

  /**
   * Setup action handler to respond to dispatches from UI components
   */
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === DISPATCH_TYPE) {
      const action = Object.assign({}, request.payload, {
        _sender: sender
      });

      dispatchResponder(store.dispatch(action), sendResponse);
      return true;
    }
  });

  /**
   * Setup extended connection for state updates
   */
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== portName) {
      return;
    }

    /**
     * Send store's current state through port
     * @return undefined
     */
    const sendState = () => {
      port.postMessage({
        type: STATE_TYPE,
        payload: store.getState()
      });
    };

    // Send new state down connected port on every redux store state change
    const unsubscribe = store.subscribe(sendState);

    // when the port disconnects, unsubscribe the sendState listener
    port.onDisconnect.addListener(unsubscribe);

    // send initial state
    sendState();
  });
};
