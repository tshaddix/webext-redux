import should from 'should';
import sinon from 'sinon';
import cloneDeep from 'lodash.clonedeep';

import { withSerializer, withDeserializer } from '../src/serialization';

describe("serialization functions", function () {
  describe("#withSerializer", function () {
    const jsonSerialize = (payload) => JSON.stringify(payload);

    let payload, message, serializedMessage, sender;

    beforeEach(function () {
      payload = {
        message: "Hello World",
        numbers: [1, 2, 3]
      };

      message = {
        type: 'TEST',
        payload
      };

      serializedMessage = {
        type: 'TEST',
        payload: jsonSerialize(payload)
      };

      sender = sinon.spy();
    });

    it("should serialize the message payload before sending", function () {
      const serializedSender = sinon.spy(withSerializer(jsonSerialize)(sender));

      serializedSender(message);

      // Assert that sender and serialized sender were called exactly once
      sender.calledOnce.should.eql(true);
      serializedSender.calledOnce.should.eql(true);
      // Assert that the sender was called with the serialized payload
      sender.firstCall.args[0].should.eql(serializedMessage);
    });

    it("should enforce the number of arguments", function () {
      const serializedSender = withSerializer(jsonSerialize)(sender, 1);

      // Assert that the serialized sender threw due to insufficient arguments
      should.throws(() => serializedSender(message));
      // Assert that the actual sender was never called
      sender.called.should.eql(false);
    });

    it("should extract the correct argument index", function () {
      const serializedSender = sinon.spy(withSerializer(jsonSerialize)(sender, 1));

      serializedSender(null, message);

      // Assert that sender and serialized sender were called exactly once
      sender.calledOnce.should.eql(true);
      serializedSender.calledOnce.should.eql(true);
      // Assert that the message was extracted from the correct argument index
      sender.firstCall.args[1].should.eql(serializedMessage);
    });

    it("should have the same result when the same message is sent twice", function () {
      const serializedSender = sinon.spy(withSerializer(jsonSerialize)(sender));

      serializedSender(message);
      const firstResult = cloneDeep(sender.firstCall.args[0]);

      serializedSender(message);
      const secondResult = cloneDeep(sender.secondCall.args[0]);

      // Assert that sender and serialized sender were called exactly twice
      sender.calledTwice.should.eql(true);
      serializedSender.calledTwice.should.eql(true);
      // Assert that the sender was called with the same message both times
      firstResult.should.eql(secondResult);
    });

    it("should not modify the original message", function () {
      const serializedSender = sinon.spy(withSerializer(jsonSerialize)(sender));

      serializedSender(message);

      // Assert deep equality between message payload and the payload object
      message.payload.should.eql(payload);
      // Assert that the original message and the sent message were different objects
      sender.firstCall.args[0].should.not.be.exactly(message);
    });

  });

  describe("#withDeserializer", function () {
    const jsonDeserialize = (payload) => JSON.parse(payload);

    // Mock a simple listener scenario
    let listeners;
    const addListener = listener => {
      listeners.push(listener);
    };
    const onMessage = (message) => {
      listeners.forEach(listener => {
        listener(message);
      });
    };

    let payload, message, deserializedMessage, listener, serializedAddListener;

    beforeEach(function () {
      payload = JSON.stringify({
        message: "Hello World",
        numbers: [1, 2, 3]
      });

      message = {
        type: 'TEST',
        payload
      };

      deserializedMessage = {
        type: 'TEST',
        payload: jsonDeserialize(payload)
      };

      listeners = [];
      listener = sinon.spy();
      serializedAddListener = sinon.spy(withDeserializer(jsonDeserialize)(addListener));
    });

    it("should deserialize the message payload before the callback", function () {
      serializedAddListener(listener);
      onMessage(message);

      // Assert that the listener was called once
      listener.calledOnce.should.eql(true);
      // Assert that it was called with the deserialized payload
      listener.firstCall.args[0].should.eql(deserializedMessage);
    });

    it("should only add the listener once", function () {
      serializedAddListener(listener);
      onMessage(message);
      onMessage(message);

      // Assert that the listener was called exactly twice
      listener.calledTwice.should.eql(true);
      // Assert that addListener is called once
      serializedAddListener.calledOnce.should.eql(true);
    });

    it("should have the same result when the same message is received twice", function () {
      serializedAddListener(listener);

      onMessage(message);
      const firstResult = cloneDeep(listener.firstCall.args[0]);

      onMessage(message);
      const secondResult = cloneDeep(listener.secondCall.args[0]);

      // Assert that the listener was called with the same message both times
      firstResult.should.eql(secondResult);
    });

    it("should not modify the original incoming message", function () {
      serializedAddListener(listener);
      onMessage(message);

      // Assert deep equality between message payload and the payload object
      message.payload.should.eql(payload);
      // Assert that the original message and the received message are different objects
      listener.firstCall.args[0].should.not.be.exactly(message);
    });

    it("should not deserialize messages it isn't supposed to", function () {
      const shouldDeserialize = (message) => message.type === 'DESERIALIZE_ME';

      serializedAddListener(listener, shouldDeserialize);
      onMessage(message);

      // Assert that the message has not been deserialized
      listener.firstCall.args[0].should.eql(message);
    });

    it("should deserialize messages it is supposed to", function () {
      const shouldDeserialize = (message) => message.type === 'TEST';

      serializedAddListener(listener, shouldDeserialize);
      onMessage(message);

      // Assert that the message has been deserialized
      listener.firstCall.args[0].should.eql(deserializedMessage);
    });

  });
});
