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
  const channelName = "test";

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
        sendMessage(data, options, cb) {
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

    it("should setup a listener on the channel defined by the channelName option", function () {
      const spy = (self.chrome.runtime.sendMessage = sinon.spy());

      new Store({ channelName });

      spy.calledOnce.should.eql(true);
      spy
        .alwaysCalledWith({
          type: FETCH_STATE_TYPE,
          channelName,
        })
        .should.eql(true);
    });

    it("should call replaceState on new state messages", function () {
      const store = new Store({ channelName });

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
        channelName,
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
      const store = new Store({ channelName, deserializer });

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
        channelName,
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
      const store = new Store({ channelName });

      store.getState().should.eql({});
    });

    it("should set the initial state to opts.state if available", function () {
      const store = new Store({ channelName, state: { a: "a" } });

      store.getState().should.eql({ a: "a" });
    });

    it("should setup a initializeStore listener", function () {
      // mock onMessage listeners array
      const initializeStoreListener = [];

      // override mock chrome API for this test
      self.chrome.runtime.sendMessage = (message, options, listener) => {
        initializeStoreListener.push(listener);
      };

      const store = new Store({ channelName });

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

    it("should listen only to channelName state changes", function () {
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

      const store = new Store({ channelName });
      const channelName2 = "test2";
      const store2 = new Store({ channelName: channelName2 });

      stateChangesListener.length.should.equal(2);

      const [l1, l2] = stateChangesListener;

      // make readyResolve() a spy function
      store.readyResolve = sinon.spy();
      store2.readyResolve = sinon.spy();

      // send message for channel 1
      l1({ type: STATE_TYPE, channelName, payload: [{ change: "updated", key: "a", value: "1" }] });
      l2({ type: STATE_TYPE, channelName, payload: [{ change: "updated", key: "b", value: "2" }] });

      stateChangesListener.length.should.equal(2);

      store.readyResolved.should.eql(true);
      store.readyResolve.calledOnce.should.equal(true);
      store2.readyResolved.should.eql(false);
      store2.readyResolve.calledOnce.should.equal(false);

      // send message for channel 2
      l1({ type: STATE_TYPE, channelName: channelName2, payload: [{ change: "updated", key: "a", value: "1" }] });
      l2({ type: STATE_TYPE, channelName: channelName2, payload: [{ change: "updated", key: "b", value: "2" }] });
      stateChangesListener.length.should.equal(2);
      store.readyResolved.should.eql(true);
      store.readyResolve.calledOnce.should.equal(true);
      store2.readyResolved.should.eql(true);
      store2.readyResolve.calledOnce.should.equal(true);
    });
  });

  describe("#patchState()", function () {
    it("should patch the state of the store", function () {
      const store = new Store({ channelName, state: { b: 1 } });

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
        channelName,
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
      const store = new Store({ channelName });

      store.getState().should.eql({});

      store.replaceState({ a: "a" });

      store.getState().should.eql({ a: "a" });
    });
  });

  describe("#getState()", function () {
    it("should get the current state of the Store", function () {
      const store = new Store({ channelName, state: { a: "a" } });

      store.getState().should.eql({ a: "a" });

      store.replaceState({ b: "b" });

      store.getState().should.eql({ b: "b" });
    });
  });

  describe("#subscribe()", function () {
    it("should register a listener for state changes", function () {
      const store = new Store({ channelName }),
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
      const store = new Store({ channelName }),
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
    it("should send a message with the correct dispatch type and payload", function () {
      const spy = (self.chrome.runtime.sendMessage = sinon.spy()),
            store = new Store({ channelName });

      store.dispatch({ a: "a" });

      spy.callCount.should.eql(2);

      spy.args[0][0].should.eql({ type: FETCH_STATE_TYPE, channelName: "test" });
      spy.args[1][0].should.eql({ type: DISPATCH_TYPE, channelName: "test", payload: { a: "a" } });
    });

    it("should serialize payloads before sending", function () {
      const spy = (self.chrome.runtime.sendMessage = sinon.spy()),
            serializer = sinon.spy(JSON.stringify),
            store = new Store({ channelName, serializer });

      store.dispatch({ a: "a" });


      spy.callCount.should.eql(2);

      spy.args[0][0].should.eql({ type: FETCH_STATE_TYPE, channelName: "test" });
      spy.args[1][0].should.eql({ type: DISPATCH_TYPE, channelName: "test", payload: JSON.stringify({ a: "a" }) });
    });

    it("should return a promise that resolves with successful action", function () {
      self.chrome.runtime.sendMessage = (data, options, cb) => {
        cb({ value: { payload: "hello" } });
      };

      const store = new Store({ channelName }),
            p = store.dispatch({ a: "a" });

      return p.should.be.fulfilledWith("hello");
    });

    it("should return a promise that rejects with an action error", function () {
      self.chrome.runtime.sendMessage = (data, options, cb) => {
        cb({ value: { payload: "hello" }, error: { extraMsg: "test" } });
      };

      const store = new Store({ channelName }),
            p = store.dispatch({ a: "a" });

      return p.should.be.rejectedWith(Error, { extraMsg: "test" });
    });

    it("should return a promise that resolves with undefined for an undefined return value", function () {
      self.chrome.runtime.sendMessage = (data, options, cb) => {
        cb({ value: undefined });
      };

      const store = new Store({ channelName }),
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
        new Store({ channelName, serializer: "abc" });
      }, Error);
    });

    it("should throw an error if deserializer is not a function", function () {
      should.throws(() => {
        new Store({ channelName, deserializer: "abc" });
      }, Error);
    });

    it("should throw an error if patchStrategy is not a function", function () {
      should.throws(() => {
        new Store({ channelName, patchStrategy: "abc" });
      }, Error);
    });
  });
});
