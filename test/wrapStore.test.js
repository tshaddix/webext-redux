import '@babel/polyfill';

import sinon from 'sinon';
import should from 'should';

import {wrapStore} from '../src';
import shallowDiff from '../src/strategies/shallowDiff/diff';
import {DISPATCH_TYPE, STATE_TYPE, PATCH_STATE_TYPE} from '../src/constants';

describe('wrapStore', function () {
  const portName = 'test';

  beforeEach(function () {
    global.self = {};

    // Mock chrome.runtime API
    self.chrome = {
      runtime: {
        onMessage: {
          addListener: () => {},
        },
        onMessageExternal: {
          addListener: () => {},
        },
        onConnect: {
          addListener: () => {},
        },
        onConnectExternal: {
          addListener: () => {},
        },
      },
      tabs: {
        query: () => {}
      }
    };
  });

  function setupListeners() {
    const listeners = {
      onMessage: [],
      onMessageExternal: [],
      onConnect: [],
      onConnectExternal: [],
    };

    self.chrome = {
      runtime: {
        onMessage: {
          addListener: fn => listeners.onMessage.push(fn),
        },
        onMessageExternal: {
          addListener: fn => listeners.onMessageExternal.push(fn),
        },
        onConnect: {
          addListener: fn => listeners.onConnect.push(fn),
        },
        onConnectExternal: {
          addListener: fn => listeners.onConnectExternal.push(fn),
        },
      },
      tabs: {
        query: () => {}
      }
    };

    return listeners;
  }

  describe("on receiving messages", function () {
    let listeners, store, payload, message, sender, callback;

    beforeEach(function () {
      listeners = setupListeners();
      store = {
        dispatch: sinon.spy(),
      };

      payload = {
        a: 'a',
      };
      message = {
        type: DISPATCH_TYPE,
        portName,
        payload
      };
      sender = {};
      callback = () => {}; // noop.  Maybe should validate it is invoked?
    });

    it('should dispatch actions received on onMessage to store', function () {
      wrapStore(store, {portName});
      listeners.onMessage.forEach(l => l(message, sender, callback));

      store.dispatch.calledOnce.should.eql(true);
      store.dispatch
        .alwaysCalledWith(
          Object.assign({}, payload, {
            _sender: sender,
          }),
        )
        .should.eql(true);
    });

    it('should not dispatch actions received on onMessage for other ports', function () {
      wrapStore(store, {portName});
      message.portName = portName + '2';
      listeners.onMessage.forEach(l => l(message, sender, callback));

      store.dispatch.notCalled.should.eql(true);
    });

    it('should deserialize incoming messages correctly', function () {
      const deserializer = sinon.spy(JSON.parse);

      wrapStore(store, {portName, deserializer});
      message.payload = JSON.stringify(payload);
      listeners.onMessage.forEach(l => l(message, sender, callback));

      deserializer.calledOnce.should.eql(true);
      store.dispatch
        .alwaysCalledWith(
          Object.assign({}, payload, {
            _sender: sender,
          }),
        )
        .should.eql(true);
    });

    it('should not deserialize incoming messages for other ports', function () {
      const deserializer = sinon.spy(JSON.parse);

      wrapStore(store, {portName, deserializer});
      message.portName = portName + '2';
      message.payload = JSON.stringify(payload);
      listeners.onMessage.forEach(l => l(message, sender, callback));

      deserializer.called.should.eql(false);
    });
  });

  it('should serialize initial state and subsequent patches correctly', function () {
    const listeners = setupListeners();

    // Mock store subscription
    const subscribers = [];
    const store = {
      subscribe: subscriber => {
        subscribers.push(subscriber);
        return () => ({});
      },
      getState: () => ({})
    };

    // Stub state access (the first access will be on
    // initialization, and the second will be on update)
    const firstState = { a: 1, b: 2 };
    const secondState = { a: 1, b: 3, c: 5 };

    sinon.stub(store, 'getState')
      .onFirstCall().returns(firstState)
      .onSecondCall().returns(secondState);

    // Mock the port object for onConnect and spy on postMessage
    const port = {
      name: portName,
      postMessage: sinon.spy(),
      onDisconnect: {
        addListener: () => ({})
      }
    };

    const serializer = (payload) => JSON.stringify(payload);

    wrapStore(store, {portName, serializer});

    // Simulate a port connection with the mocked port
    listeners.onConnect.forEach(l => l(port));
    // Simulate a state update by calling subscribers
    subscribers.forEach(subscriber => subscriber());

    const expectedSetupMessage = {
      type: STATE_TYPE,
      payload: serializer(firstState)
    };
    const expectedPatchMessage = {
      type: PATCH_STATE_TYPE,
      payload: serializer(shallowDiff(firstState, secondState))
    };

    port.postMessage.calledTwice.should.eql(true);
    port.postMessage.firstCall.args[0].should.eql(expectedSetupMessage);
    port.postMessage.secondCall.args[0].should.eql(expectedPatchMessage);
  });

  it('should use the provided diff strategy', function () {
    const listeners = setupListeners();

    // Mock store subscription
    const subscribers = [];
    const store = {
      subscribe: subscriber => {
        subscribers.push(subscriber);
        return () => ({});
      },
      getState: () => ({})
    };

    // Stub state access (the first access will be on
    // initialization, and the second will be on update)
    const firstState = { a: 1, b: 2 };
    const secondState = { a: 1, b: 3, c: 5 };

    sinon.stub(store, 'getState')
      .onFirstCall().returns(firstState)
      .onSecondCall().returns(secondState);

    // Mock the port object for onConnect and spy on postMessage
    const port = {
      name: portName,
      postMessage: sinon.spy(),
      onDisconnect: {
        addListener: () => ({})
      }
    };

    // Create a fake diff strategy
    const diffStrategy = (oldObj, newObj) => ([{
      type: 'FAKE_DIFF',
      oldObj, newObj
    }]);

    wrapStore(store, {portName, diffStrategy});

    // Simulate a port connection with the mocked port
    listeners.onConnect.forEach(l => l(port));
    // Simulate a state update by calling subscribers
    subscribers.forEach(subscriber => subscriber());

    const expectedPatchMessage = {
      type: PATCH_STATE_TYPE,
      payload: diffStrategy(firstState, secondState)
    };

    port.postMessage.calledTwice.should.eql(true);
    port.postMessage.secondCall.args[0].should.eql(expectedPatchMessage);
  });

  describe("when validating options", function () {
    const store = {
      dispatch: sinon.spy(),
    };

    it('should use defaults if no options present', function () {
      should.doesNotThrow(() => wrapStore(store));
    });

    it('should throw an error if serializer is not a function', function () {
      should.throws(() => {
        wrapStore(store, { portName, serializer: "abc" });
      }, Error);
    });

    it('should throw an error if deserializer is not a function', function () {
      should.throws(() => {
        wrapStore(store, {portName, deserializer: "abc"});
      }, Error);
    });

    it('should throw an error if diffStrategy is not a function', function () {
      should.throws(() => {
        wrapStore(store, {portName, diffStrategy: "abc"});
      }, Error);
    });
  });

  it(
    'should send a safety message to all tabs once initialized',
    function () {
      const tabs = [123,456,789,1011,1213];
      const tabResponders = [];
      const store = {
        dispatch: sinon.spy(),
      };

      self.chrome = {
        runtime: {
          onMessage: {
            addListener: () => {},
          },
          onMessageExternal: {
            addListener: () => {},
          },
          onConnect: {
            addListener: () => {},
          },
          onConnectExternal: {
            addListener: () => {},
          },
        },
        tabs: {
          query: (tabObject, cb) => {
            cb(tabs);
          },
          sendMessage: (tabId) => {
            tabResponders.push(tabId);
          }
        }
      };

      wrapStore(store, {portName});

      tabResponders.length.should.equal(5);
    },
  );
});
