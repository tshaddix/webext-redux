import 'babel-polyfill';

import sinon from 'sinon';

import {wrapStore} from '../src';
import {DISPATCH_TYPE} from '../src/constants';

describe('wrapStore', function () {
  const portName = 'test';

  beforeEach(function () {
    // Mock chrome.runtime API
    global.chrome = {
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
    };
  });

  function setupListeners() {
    const listeners = {
      onMessage: [],
      onMessageExternal: [],
      onConnect: [],
      onConnectExternal: [],
    };

    global.chrome = {
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
    };

    return listeners;
  }

  it('should dispatch actions received on onMessage to store', function () {
    const listeners = setupListeners();
    const store = {
      dispatch: sinon.spy(),
    };

    wrapStore(store, {portName});

    const payload = {
      a: 'a',
    };
    const message = {
      type: DISPATCH_TYPE,
      portName,
      payload,
    };
    const sender = {};
    const callback = () => {}; // noop.  Maybe should validate it is invoked?

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

  it(
    'should not dispatch actions received on onMessage for other ports',
    function () {
      const listeners = setupListeners();
      const store = {
        dispatch: sinon.spy(),
      };

      wrapStore(store, {portName});

      const payload = {
        a: 'a',
      };
      const message = {
        type: DISPATCH_TYPE,
        portName: portName + '2',
        payload,
      };
      const sender = {};
      const callback = () => {}; // noop.  Maybe should validate it is invoked?

      listeners.onMessage.forEach(l => l(message, sender, callback));
      store.dispatch.notCalled.should.eql(true);
    },
  );
});
