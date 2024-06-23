export const createDeferredListener = () => {
  let resolve = () => {};
  const fnPromise = new Promise((resolve_) => (resolve = resolve_));

  const listener = (message, sender, sendResponse) => {
    fnPromise.then((fn) => {
      fn(message, sender, sendResponse);
    });

    // Allow response to be async
    return true;
  };

  return { setListener: resolve, listener };
};
