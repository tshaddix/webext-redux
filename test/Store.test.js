var should = require('should');
var sinon = require('sinon');

var Store = require('../lib').Store;
var constants = require('../lib/constants');

describe('Store', function() {
  beforeEach(function() {
    // Mock chrome.runtime API
    global.chrome = {
      runtime: {
        connect: function(opts) {
          return {
            onMessage: {
              addListener: function(listener) {
              }
            }
          }
        },
        sendMessage: function(data, cb) {
          cb();
        }
      }
    };
  });

  describe('#new Store()', function() {
    it('should setup a listener on the chrome port defined by the portName option and call replaceState on new state messages', function() {
      // mock connect.onMessage listeners array
      var listeners = [];

      // override mock chrome API for this test
      global.chrome.runtime.connect = function(opts) {
        return {
          onMessage: {
            addListener: function(listener) {
              listeners.push(listener);
            }
          }
        };
      };

      var store = new Store({portName: 'test'});

      // make replaceState() a spy function
      store.replaceState = sinon.spy();

      // verify one listener was added on port connect
      listeners.length.should.equal(1);

      var l = listeners[0];

      // send one state type message
      l({
        type: constants.STATE_TYPE,
        payload: {}
      });

      var badMessage = {
        type: 'NOT_' + constants.STATE_TYPE,
        payload: {}
      };

      // send one non-state type message
      l(badMessage);

      // make sure replace state was only called once
      store.replaceState.calledOnce.should.equal(true);
      store.replaceState.alwaysCalledWithExactly(badMessage)
    });

    it('should set the initial state to empty object by default', function() {
      var store = new Store({portName: 'test'});

      store.getState().should.eql({});
    });

    it('should set the initial state to opts.state if available', function() {
      var store = new Store({portName: 'test', state: {a: 'a'}});

      store.getState().should.eql({a: 'a'});
    });
  });

  describe('#replaceState()', function() {
    it('should replace the state of the store', function() {
      var store = new Store({portName: 'test'});

      store.getState().should.eql({});

      store.replaceState({a: 'a'});

      store.getState().should.eql({a: 'a'});
    });
  });

  describe('#getState()', function() {
    it('should get the current state of the Store', function() {
      var store = new Store({portName: 'test', state: {a: 'a'}});

      store.getState().should.eql({a: 'a'});

      store.replaceState({b: 'b'});

      store.getState().should.eql({b: 'b'});
    });
  });

  describe('#subscribe()', function() {
    it('should register a listener for state changes', function() {
      var store = new Store({portName: 'test'});

      var newState = {b: 'b'};
      var callCount = 0;

      store.subscribe(function() {
        callCount += 1;
        store.getState().should.eql(newState);
      });

      store.replaceState(newState);

      callCount.should.eql(1);
    });

    it('should return a function which will unsubscribe the listener', function() {
      var store = new Store({portName: 'test'});

      var listener = sinon.spy();

      var unsub = store.subscribe(listener);

      store.replaceState({b: 'b'});

      listener.calledOnce.should.eql(true);

      unsub();

      store.replaceState({c: 'c'});

      listener.calledOnce.should.eql(true);
    });
  });

  describe('#dispatch()', function() {
    it('should send a message with the correct dispatch type and payload', function() {
      var spy = global.chrome.runtime.sendMessage = sinon.spy();

      var store = new Store({portName: 'test'});

      store.dispatch({a: 'a'});

      spy.calledOnce.should.eql(true);
      spy.alwaysCalledWith({
        type: constants.DISPATCH_TYPE,
        payload: {a: 'a'}
      }).should.eql(true);
    });

    it('should return a promise that resolves with successful action', function() {
      var mock = global.chrome.runtime.sendMessage = function(data, cb) {
        cb({value: {payload: 'hello'}});
      };

      var store = new Store({portName: 'test'});

      var p = store.dispatch({a: 'a'});

      return p.should.be.fulfilledWith('hello');
    });

    it('should return a promise that rejects with an action error', function() {
      var mock = global.chrome.runtime.sendMessage = function(data, cb) {
        cb({value: {payload: 'hello'}, error: {extraMsg: 'test'}});
      };

      var store = new Store({portName: 'test'});

      var p = store.dispatch({a: 'a'});

      return p.should.be.rejectedWith(Error, {extraMsg: 'test'});
    });
  });
});
