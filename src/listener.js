/**
 * Returns a function that can be passed as a listener callback to a browser
 * API. The listener will queue events until setListener is called.
 *
 * @param {Function} filter - A function that filters messages to be handled by
 * the listener. This is important to avoid telling the browser to expect an
 * async response when the message is not intended for this listener.
 *
 * @example
 * const filter = (message, sender, sendResponse) => {
 *   return message.type === "my_type"
 * }
 *
 * const { listener, setListener } = createDeferredListener(filter);
 * chrome.runtime.onMessage.addListener(listener);
 *
 * // Later, define the listener to handle messages. Messages received
 * // before this point are queued.
 * setListener((message, sender, sendResponse) => {
 *  console.log(message);
 * });
 */
export const createDeferredListener = (filter) => {
  let resolve = () => {};
  const fnPromise = new Promise((resolve_) => (resolve = resolve_));

  const listener = (message, sender, sendResponse) => {
    if (!filter(message, sender, sendResponse)) {
      return;
    }

    fnPromise.then((fn) => {
      fn(message, sender, sendResponse);
    });

    // Allow response to be async
    return true;
  };

  return { setListener: resolve, listener };
};
