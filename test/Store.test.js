import "@babel/polyfill";

import should from "should";
import sinon from "sinon";

import { Store } from "../src";
import { DISPATCH_TYPE, FETCH_STATE_TYPE, STATE_TYPE } from "../src/constants";
import {
  DIFF_STATUS_UPDATED,
  DIFF_STATUS_REMOVED,
} from "../src/strategies/constants";

describe("Store", function () {
  const portName = "test";

  beforeEach(function () {
    global.self = {};

    // Mock chrome.runtime API
    self.chrome = {
      runtime: {
        connect() {
          return {
            onMessage: {
              addListener() {},
            },
          };
        },
        sendMessage(extensionId, data, options, cb) {
          cb();
        },
        onMessage: {
          addListener: () => {},
        },
      },
    };
  });

  describe("#new Store()", function () {
    let listeners;

    beforeEach(function () {
      // mock connect.onMessage listeners array
      listeners = [];

      // override mock chrome API for this test
      self.chrome.runtime = {
        sendMessage: () => {},
        onMessage: {
          addListener: (listener) => {
            listeners.push(listener);
          },
        },
      };
    });

    it("should setup a listener on the chrome port defined by the portName option", function () {
      const spy = (self.chrome.runtime.sendMessage = sinon.spy());

      new Store({ portName });

      spy.calledOnce.should.eql(true);
      spy
        .alwaysCalledWith(null, {
          type: FETCH_STATE_TYPE,
          portName,
        })
        .should.eql(true);
    });

    it("should call replaceState on new state messages", function () {
      const store = new Store({ portName });

      // make replaceState() a spy function
      store.replaceState = sinon.spy();

      const [l] = listeners;

      const payload = {
        a: 1,
      };

      // send one state type message
      l({
        type: STATE_TYPE,
        payload,
        portName,
      });

      // send one non-state type message
      l({
        type: `NOT_${STATE_TYPE}`,
        payload: {
          a: 2,
        },
      });

      // make sure replace state was only called once
      store.replaceState.calledOnce.should.equal(true);
      store.replaceState.firstCall.args[0].should.eql(payload);
    });

    it("should deserialize incoming messages", function () {
      const deserializer = sinon.spy(JSON.parse);
      const store = new Store({ portName, deserializer });

      // make replaceState() a spy function
      store.replaceState = sinon.spy();

      const [l] = listeners;

      const payload = {
        a: 1,
      };

      // send one state type message
      l({
        type: STATE_TYPE,
        payload: JSON.stringify(payload),
        portName,
      });

      // send one non-state type message
      l({
        type: `NOT_${STATE_TYPE}`,
        payload: JSON.stringify({
          a: 2,
        }),
      });

      // make sure replace state was called with the deserialized payload
      store.replaceState.firstCall.args[0].should.eql(payload);
    });

    it("should set the initial state to empty object by default", function () {
      const store = new Store({ portName });

      store.getState().should.eql({});
    });

    it("should set the initial state to opts.state if available", function () {
      const store = new Store({ portName, state: { a: "a" } });

      store.getState().should.eql({ a: "a" });
    });

    it("should setup a initializeStore listener", function () {
      // mock onMessage listeners array
      const initializeStoreListener = [];

      // override mock chrome API for this test
      self.chrome.runtime.sendMessage = (extensionId, message, options, listener) => {
        initializeStoreListener.push(listener);
      };

      const store = new Store({ portName });

      // verify one listener was added on port connect
      initializeStoreListener.length.should.equal(1);

      const [l] = initializeStoreListener;

      // make readyResolve() a spy function
      store.readyResolve = sinon.spy();

      const payload = {
        a: 1,
      };

      // Receive message response
      l({ type: FETCH_STATE_TYPE, payload });

      store.readyResolved.should.eql(true);
      store.readyResolve.calledOnce.should.equal(true);
    });

    it("should listen only to portName state changes", function () {
      // mock onMessage listeners array
      const stateChangesListener = [];

      // override mock chrome API for this test
      self.chrome.runtime = {
        onMessage: {
          addListener: (listener) => {
            stateChangesListener.push(listener);
          },
        },
        sendMessage: () => {}
      };

      const store = new Store({ portName });
      const portName2 = "test2";
      const store2 = new Store({ portName: portName2 });

      // verify one listener was added on port connect
      stateChangesListener.length.should.equal(2);

      const [l1, l2] = stateChangesListener;

      // make readyResolve() a spy function
      store.readyResolve = sinon.spy();
      store2.readyResolve = sinon.spy();

      // send message for port 1
      l1({ type: STATE_TYPE, portName, payload: [{ change: "updated", key: "a", value: "1" }] });
      l2({ type: STATE_TYPE, portName, payload: [{ change: "updated", key: "b", value: "2" }] });

      stateChangesListener.length.should.equal(2);

      store.readyResolved.should.eql(true);
      store.readyResolve.calledOnce.should.equal(true);
      store2.readyResolved.should.eql(false);
      store2.readyResolve.calledOnce.should.equal(false);

      // send message for port 2
      l1({ type: STATE_TYPE, portName: portName2, payload: [{ change: "updated", key: "a", value: "1" }] });
      l2({ type: STATE_TYPE, portName: portName2, payload: [{ change: "updated", key: "b", value: "2" }] });
      stateChangesListener.length.should.equal(2);
      store.readyResolved.should.eql(true);
      store.readyResolve.calledOnce.should.equal(true);
      store2.readyResolved.should.eql(true);
      store2.readyResolve.calledOnce.should.equal(true);
    });
  });

  describe("#patchState()", function () {
    it("should patch the state of the store", function () {
      const store = new Store({ portName, state: { b: 1 } });

      store.getState().should.eql({ b: 1 });

      store.patchState([
        { key: "a", value: 123, change: DIFF_STATUS_UPDATED },
        { key: "b", change: DIFF_STATUS_REMOVED },
      ]);

      store.getState().should.eql({ a: 123 });
    });

    it("should use the provided patch strategy to patch the state", function () {
      // Create a fake patch strategy
      const patchStrategy = sinon.spy((state) => ({
        ...state,
        a: state.a + 1,
      }));
      // Initialize the store
      const store = new Store({
        portName,
        state: { a: 1, b: 5 },
        patchStrategy,
      });

      store.getState().should.eql({ a: 1, b: 5 });

      // Patch the state
      store.patchState([]);

      const expectedState = { a: 2, b: 5 };

      // make sure the patch strategy was used
      patchStrategy.callCount.should.eql(1);
      // make sure the state got patched
      store.state.should.eql(expectedState);
    });
  });

  describe("#replaceState()", function () {
    it("should replace the state of the store", function () {
      const store = new Store({ portName });

      store.getState().should.eql({});

      store.replaceState({ a: "a" });

      store.getState().should.eql({ a: "a" });
    });
  });

  describe("#getState()", function () {
    it("should get the current state of the Store", function () {
      const store = new Store({ portName, state: { a: "a" } });

      store.getState().should.eql({ a: "a" });

      store.replaceState({ b: "b" });

      store.getState().should.eql({ b: "b" });
    });
  });

  describe("#subscribe()", function () {
    it("should register a listener for state changes", function () {
      const store = new Store({ portName }),
            newState = { b: "b" };

      let callCount = 0;

      store.subscribe(() => {
        callCount += 1;
        store.getState().should.eql(newState);
      });

      store.replaceState(newState);

      callCount.should.eql(1);
    });

    it("should return a function which will unsubscribe the listener", function () {
      const store = new Store({ portName }),
            listener = sinon.spy(),
            unsub = store.subscribe(listener);

      store.replaceState({ b: "b" });

      listener.calledOnce.should.eql(true);

      unsub();

      store.replaceState({ c: "c" });

      listener.calledOnce.should.eql(true);
    });
  });

  describe("#dispatch()", function () {
    it("should send a message with the correct dispatch type and payload given an extensionId", function () {
      const spy = (self.chrome.runtime.sendMessage = sinon.spy());
      const store = new Store({ portName, extensionId: "xxxxxxxxxxxx" });

      store.dispatch({ a: "a" });

      spy.callCount.should.eql(2);
      spy.args[0][0].should.eql("xxxxxxxxxxxx");
      spy.args[0][1].should.eql({ type: FETCH_STATE_TYPE, portName: "test" });
      spy.args[1][0].should.eql("xxxxxxxxxxxx");
      spy.args[1][1].should.eql({ type: DISPATCH_TYPE, portName: "test", payload: { a: "a" } });
    });

    it("should send a message with the correct dispatch type and payload not given an extensionId", function () {
      const spy = (self.chrome.runtime.sendMessage = sinon.spy()),
            store = new Store({ portName });

      store.dispatch({ a: "a" });

      spy.callCount.should.eql(2);

      should(spy.args[0][0]).eql(null);
      spy.args[0][1].should.eql({ type: FETCH_STATE_TYPE, portName: "test" });
      should(spy.args[1][0]).eql(null);
      spy.args[1][1].should.eql({ type: DISPATCH_TYPE, portName: "test", payload: { a: "a" } });
    });

    it("should serialize payloads before sending", function () {
      const spy = (self.chrome.runtime.sendMessage = sinon.spy()),
            serializer = sinon.spy(JSON.stringify),
            store = new Store({ portName, serializer });

      store.dispatch({ a: "a" });


      spy.callCount.should.eql(2);

      should(spy.args[0][0]).eql(null);
      spy.args[0][1].should.eql({ type: FETCH_STATE_TYPE, portName: "test" });
      should(spy.args[1][0]).eql(null);
      spy.args[1][1].should.eql({ type: DISPATCH_TYPE, portName: "test", payload: JSON.stringify({ a: "a" }) });
    });

    it("should return a promise that resolves with successful action", function () {
      self.chrome.runtime.sendMessage = (extensionId, data, options, cb) => {
        cb({ value: { payload: "hello" } });
      };

      const store = new Store({ portName }),
            p = store.dispatch({ a: "a" });

      return p.should.be.fulfilledWith("hello");
    });

    it("should return a promise that rejects with an action error", function () {
      self.chrome.runtime.sendMessage = (extensionId, data, options, cb) => {
        cb({ value: { payload: "hello" }, error: { extraMsg: "test" } });
      };

      const store = new Store({ portName }),
            p = store.dispatch({ a: "a" });

      return p.should.be.rejectedWith(Error, { extraMsg: "test" });
    });

    it("should return a promise that resolves with undefined for an undefined return value", function () {
      self.chrome.runtime.sendMessage = (extensionId, data, options, cb) => {
        cb({ value: undefined });
      };

      const store = new Store({ portName }),
            p = store.dispatch({ a: "a" });

      return p.should.be.fulfilledWith(undefined);
    });
  });

  describe("when validating options", function () {
    it("should use defaults if no options present", function () {
      should.doesNotThrow(() => new Store());
    });

    it("should throw an error if serializer is not a function", function () {
      should.throws(() => {
        new Store({ portName, serializer: "abc" });
      }, Error);
    });

    it("should throw an error if deserializer is not a function", function () {
      should.throws(() => {
        new Store({ portName, deserializer: "abc" });
      }, Error);
    });

    it("should throw an error if patchStrategy is not a function", function () {
      should.throws(() => {
        new Store({ portName, patchStrategy: "abc" });
      }, Error);
    });
  });
});
