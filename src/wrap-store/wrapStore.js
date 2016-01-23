import {
  DISPATCH_TYPE,
  STATE_TYPE
} from '../constants';

export default (store, {portName}) => {
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== portName) {
      return;
    }

    const sendState = () => {
      port.postMessage({
        type: STATE_TYPE,
        payload: store.getState()
      });
    };

    port.onMessage.addListener((msg) => {
      if (msg.type === DISPATCH_TYPE) {
        store.dispatch(msg.payload);
      }
    });

    const unsubscribe = store.subscribe(sendState);

    port.onDisconnect.addListener(unsubscribe);

    // send initial state
    sendState();
  });
};