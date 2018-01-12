export const noop = (payload) => payload;

const deserializeListener = (listener, deserializer = noop) =>
  (message, ...args) => {
    if (message.payload) {
      message.payload = deserializer(message.payload);
    }
    return listener(message, ...args);
  };

const serializeMessage = (message, serializer = noop) => {
  if (message.payload) {
    message.payload = serializer(message.payload);
  }
  return message;
};

/**
 * Given a deserializer, returns a function that that takes a listener
 * function as its sole argument and returns a wrapped listener that
 * automatically deserializes message payloads. The message listener
 * is expected to take the message as its first argument.
 * @param {Function} deserializer A function that deserialized a message payload
 * Example Usage:
 *   const withJsonDeserializer = withDeserializer(payload => JSON.parse(payload))
 *   const deserializedChromeListener = withJsonDeserializer(chrome.runtime.onMessage.addListener)
 *   deserializedChromeListener(message => console.log("Payload:", message.payload))
 *   chrome.runtime.sendMessage("{'prop':4}")
 *   //Payload: { prop: 4 }
 */
export const withDeserializer = (deserializer = noop) =>
  (addListenerFn) =>
    (listener) => addListenerFn(deserializeListener(listener, deserializer));

/**
 * Given a serializer, returns a function that takes a message sending
 * function as its sole argument and returns a wrapped message sender that
 * automaticaly serializes message payloads. The message sender
 * is expected to take the message as its first argument, unless messageArgIndex
 * is nonzero, in which case it is expected in the position specified by messageArgIndex.
 * @param {Function} serializer A function that serializes a message payload
 * Example Usage:
 *   const withJsonSerializer = withSerializer(payload => JSON.stringify(payload))
 *   const serializedChromeSender = withJsonSerializer(chrome.runtime.sendMessage)
 *   chrome.runtime.addListener(message => console.log("Payload:", message.payload))
 *   serializedChromeSender({ prop: 4 })
 *   //Payload: "{'prop':4}"
 */
export const withSerializer = (serializer = noop) =>
  (sendMessageFn, messageArgIndex = 0) => {
    return (...args) => {
      if (args.length <= messageArgIndex) {
        throw new Error(`Message in request could not be serialized. ` +
                        `Expected message in position ${messageArgIndex} but only received ${args.length} args.`);
      }
      args[messageArgIndex] = serializeMessage(args[messageArgIndex], serializer);
      return sendMessageFn(...args);
    };
  };
