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
 * @param {string} options.channelName The name of the channel for this store.
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
 * @return {WrapStore} The wrapStore function that accepts a Redux store and
 * options. See {@link WrapStore}.
 */
export default () => {
  const browserAPI = getBrowserAPI();

  // Setup message listeners synchronously to avoid dropping messages if the
  // extension is woken by a message.
  const stateProviderListener = createDeferredListener();
  const actionListener = createDeferredListener();

  browserAPI.runtime.onMessage.addListener(stateProviderListener.listener);
  browserAPI.runtime.onMessage.addListener(actionListener.listener);

  return (
    store,
    {
      channelName = defaultOpts.channelName,
      dispatchResponder = defaultOpts.dispatchResponder,
      serializer = defaultOpts.serializer,
      deserializer = defaultOpts.deserializer,
      diffStrategy = defaultOpts.diffStrategy,
    } = defaultOpts
  ) => {
    if (!channelName) {
      throw new Error("channelName is required in options");
    }
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
      if (
        request.type === DISPATCH_TYPE &&
        request.channelName === channelName
      ) {
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
        return true;
      }
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

    const withPayloadDeserializer = withDeserializer(deserializer);
    const shouldDeserialize = (request) =>
      request.type === DISPATCH_TYPE && request.channelName === channelName;

    /**
     * State provider for content-script initialization
     */
    stateProviderListener.setListener((request, sender, sendResponse) => {
      const state = store.getState();

      if (
        request.type === FETCH_STATE_TYPE &&
        request.channelName === channelName
      ) {
        sendResponse({
          type: FETCH_STATE_TYPE,
          payload: state,
        });
      }
    });

    /**
     * Setup action handler
     */
    withPayloadDeserializer(actionListener.setListener)(
      dispatchResponse,
      shouldDeserialize
    );
  };
};
