import {
  DISPATCH_TYPE,
  FETCH_STATE_TYPE,
  STATE_TYPE,
  PATCH_STATE_TYPE,
  DEFAULT_CHANNEL_NAME,
} from "../constants";
import { withSerializer, withDeserializer, noop } from "../serialization";
import { getBrowserAPI } from "../util";
import shallowDiff from "../strategies/shallowDiff/diff";
import { createDeferredListener } from "../listener";

/**
 * Responder for promisified results
 * @param  {object} dispatchResult The result from `store.dispatch()`
 * @param  {function} send         The function used to respond to original message
 * @return {undefined}
 */
const promiseResponder = (dispatchResult, send) => {
  Promise.resolve(dispatchResult)
    .then((res) => {
      send({
        error: null,
        value: res,
      });
    })
    .catch((err) => {
      console.error("error dispatching result:", err);
      send({
        error: err.message,
        value: null,
      });
    });
};

const defaultOpts = {
  channelName: DEFAULT_CHANNEL_NAME,
  dispatchResponder: promiseResponder,
  serializer: noop,
  deserializer: noop,
  diffStrategy: shallowDiff,
};

/**
 * @typedef {function} WrapStore
 * @param {Object} store A Redux store
 * @param {Object} options
 * @param {function} options.dispatchResponder A function that takes the result
 * of a store dispatch and optionally implements custom logic for responding to
 * the original dispatch message.
 * @param {function} options.serializer A function to serialize outgoing message
 * payloads (default is passthrough).
 * @param {function} options.deserializer A function to deserialize incoming
 * message payloads (default is passthrough).
 * @param {function} options.diffStrategy A function to diff the previous state
 * and the new state (default is shallow diff).
 */

/**
 * Wraps a Redux store so that proxy stores can connect to it. This function
 * must be called synchronously when the extension loads to avoid dropping
 * messages that woke the service worker.
 * @param {Object} options
 * @param {string} options.channelName The name of the channel for this store.
 * @return {WrapStore} The wrapStore function that accepts a Redux store and
 * options. See {@link WrapStore}.
 */
export default ({ channelName = defaultOpts.channelName } = defaultOpts) => {
  const browserAPI = getBrowserAPI();

  const filterStateMessages = (message) =>
    message.type === FETCH_STATE_TYPE && message.channelName === channelName;

  const filterActionMessages = (message) =>
    message.type === DISPATCH_TYPE && message.channelName === channelName;

  // Setup message listeners synchronously to avoid dropping messages if the
  // extension is woken by a message.
  const stateProviderListener = createDeferredListener(filterStateMessages);
  const actionListener = createDeferredListener(filterActionMessages);

  browserAPI.runtime.onMessage.addListener(stateProviderListener.listener);
  browserAPI.runtime.onMessage.addListener(actionListener.listener);

  return (
    store,
    {
      dispatchResponder = defaultOpts.dispatchResponder,
      serializer = defaultOpts.serializer,
      deserializer = defaultOpts.deserializer,
      diffStrategy = defaultOpts.diffStrategy,
    } = defaultOpts
  ) => {
    if (typeof serializer !== "function") {
      throw new Error("serializer must be a function");
    }
    if (typeof deserializer !== "function") {
      throw new Error("deserializer must be a function");
    }
    if (typeof diffStrategy !== "function") {
      throw new Error(
        "diffStrategy must be one of the included diffing strategies or a custom diff function"
      );
    }

    /**
     * Respond to dispatches from UI components
     */
    const dispatchResponse = (request, sender, sendResponse) => {
      //  Only called with messages that pass the filterActionMessages filter.
      const action = Object.assign({}, request.payload, {
        _sender: sender,
      });

      let dispatchResult = null;

      try {
        dispatchResult = store.dispatch(action);
      } catch (e) {
        dispatchResult = Promise.reject(e.message);
        console.error(e);
      }

      dispatchResponder(dispatchResult, sendResponse);
    };

    /**
     * Setup for state updates
     */
    const serializedMessagePoster = withSerializer(serializer)((...args) => {
      const onErrorCallback = () => {
        if (browserAPI.runtime.lastError) {
          // do nothing - errors can be present
          // if no content script exists on receiver
        }
      };

      browserAPI.runtime.sendMessage(...args, onErrorCallback);
      // We will broadcast state changes to all tabs to sync state across content scripts
      return browserAPI.tabs.query({}, (tabs) => {
        for (const tab of tabs) {
          browserAPI.tabs.sendMessage(tab.id, ...args, onErrorCallback);
        }
      });
    });

    let currentState = store.getState();

    const patchState = () => {
      const newState = store.getState();
      const diff = diffStrategy(currentState, newState);

      if (diff.length) {
        currentState = newState;

        serializedMessagePoster({
          type: PATCH_STATE_TYPE,
          payload: diff,
          channelName, // Notifying what store is broadcasting the state changes
        });
      }
    };

    // Send patched state to listeners on every redux store state change
    store.subscribe(patchState);

    // Send store's initial state
    serializedMessagePoster({
      type: STATE_TYPE,
      payload: currentState,
      channelName, // Notifying what store is broadcasting the state changes
    });

    /**
     * State provider for content-script initialization
     */
    stateProviderListener.setListener((request, sender, sendResponse) => {
      // This listener is only called with messages that pass filterStateMessages
      const state = store.getState();

      sendResponse({
        type: FETCH_STATE_TYPE,
        payload: state,
      });
    });

    /**
     * Setup action handler
     */
    const withPayloadDeserializer = withDeserializer(deserializer);

    withPayloadDeserializer(actionListener.setListener)(
      dispatchResponse,
      filterActionMessages
    );
  };
};
