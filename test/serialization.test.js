import 'babel-polyfill';

import should from 'should';
import sinon from 'sinon';

import { withSerializer, withDeserializer } from '../src/serialization';

describe("serialization functions", function () {
  describe("#withSerializer", function () {
    const jsonSerialize = (payload) => JSON.stringify(payload);

    let payload, message;
    beforeEach(function () {
      payload = {
        message: "Hello World",
        numbers: [1, 2, 3]
      };

      message = {
        type: 'TEST',
        payload
      };
    });

    it("should serialize the message payload before sending", function () {
      const sender = sinon.spy();
      const serializedSender = sinon.spy(withSerializer(jsonSerialize)(sender));

      serializedSender(message);

      sender.calledOnce.should.eql(true);
      serializedSender.calledOnce.should.eql(true);
      sender.firstCall.args[0].payload.should.eql(jsonSerialize(payload));
    });

    it("should enforce the number of arguments", function () {
      const sender = sinon.spy();
      const serializedSender = withSerializer(jsonSerialize)(sender, 1);

      should.throws(() => serializedSender(message));
      sender.called.should.eql(false);
    });

    it("should extract the correct argument index", function () {
      const sender = sinon.spy();
      const serializedSender = sinon.spy(withSerializer(jsonSerialize)(sender, 1));

      serializedSender(null, message);

      sender.calledOnce.should.eql(true);
      serializedSender.calledOnce.should.eql(true);
      sender.firstCall.args[1].payload.should.eql(jsonSerialize(payload));
    });

  });

  describe("#withDeserializer", function () {
    const jsonDeserialize = (payload) => JSON.parse(payload);

    let payload, message;
    beforeEach(function () {
      payload = {
        message: "Hello World",
        numbers: [1, 2, 3]
      };

      message = {
        type: 'TEST',
        payload: JSON.stringify(payload)
      };
    });

    it("should deserialize the message payload before the callback", function () {
      const jsonDeserialize = sinon.spy((payload) => JSON.parse(payload));
      //Mock a simple listener scenario
      let listeners = [];
      const addListener = listener => { listeners.push(listener) };
      const triggerListeners = (message) => { listeners.forEach(listener => { listener(message) }) };

      const listener = sinon.spy();
      const serializedListener = sinon.spy(withDeserializer(jsonDeserialize)(addListener));
      serializedListener(listener);

      triggerListeners(message);
      listener.calledOnce.should.eql(true);
      serializedListener.calledOnce.should.eql(true);
      listener.firstCall.args[0].payload.should.eql(payload);
    });
  });
});
