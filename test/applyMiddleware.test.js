import should from 'should';
import sinon from 'sinon';
import { Store, applyMiddleware } from '../src';

// Adapt tests from applyMiddleware spec from Redux
describe('applyMiddleware', function () {
  const portName = 'test';
  // simulates redux-thunk middleware
  const thunk = ({ dispatch, getState }) => next => action =>
    typeof action === 'function' ? action(dispatch, getState) : next(action);

  beforeEach(function () {
    global.self = {};

    // Mock chrome.runtime API
    self.chrome = {
      runtime: {
        connect() {
          return {
            onMessage: {
              addListener() {
              }
            }
          };
        },
        onMessage: {
          addListener: () => {}
        }
      }
    };
  });

  it('warns when dispatching during middleware setup', () => {
    function dispatchingMiddleware(store) {
      store.dispatch({type:'anything'});
      return next => action => next(action);
    }
    const middleware = [dispatchingMiddleware];

    should.throws(() => {
      applyMiddleware(new Store({portName, state: {a: 'a'}}), ...middleware);
    }, Error);
  });

  it('wraps dispatch method with middleware once', () => {
    function test(spyOnMethods) {
      return methods => {
        spyOnMethods(methods);
        return next => action => next(action);
      };
    }

    const spy = sinon.spy();
    const store = applyMiddleware(new Store({portName}), test(spy), thunk);

    store.dispatch(() => ({a: 'a'}));

    spy.calledOnce.should.eql(true);

    spy.args[0][0].should.have.property('getState');
    spy.args[0][0].should.have.property('dispatch');
  });

  it('passes recursive dispatches through the middleware chain', () => {
    self.chrome.runtime.sendMessage = (extensionId, data, options, cb) => {
      cb(data.payload);
    };
    function test(spyOnMethods) {
      return () => next => action => {
        spyOnMethods(action);
        return next(action);
      };
    }
    function asyncActionCreator(data) {
      return dispatch =>
        new Promise((resolve) =>
          setTimeout(() => {
            dispatch(() => data);
            resolve();
          }, 0)
        );
    }

    const spy = sinon.spy();
    const store = applyMiddleware(new Store({portName}), test(spy), thunk);

    return store.dispatch(asyncActionCreator({a: 'a'}))
      .then(() => {
        spy.args.length.should.eql(2);
      });
  });

  it('passes through all arguments of dispatch calls from within middleware', () => {
    const spy = sinon.spy();
    const testCallArgs = ['test'];

    function multiArgMiddleware() {
      return next => (action, callArgs) => {
        if (Array.isArray(callArgs)) {
          return action(...callArgs);
        }
        return next(action);
      };
    }

    function dummyMiddleware({ dispatch }) {
      return next => action => { // eslint-disable-line no-unused-vars
        return dispatch(action, testCallArgs);
      };
    }

    const store = applyMiddleware(new Store({portName}), multiArgMiddleware, dummyMiddleware);

    store.dispatch(spy);
    spy.args[0].should.eql(testCallArgs);
  });

  it('should be able to access getState from thunk', function () {
    const middleware = [thunk];
    const store = applyMiddleware(new Store({portName, state: {a: 'a'}}), ...middleware);

    store.getState().should.eql({a: 'a'});
    store.dispatch((dispatch, getState) => {
      getState().should.eql({a: 'a'});
    });
  });
});