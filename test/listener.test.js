import sinon from "sinon";
import { createDeferredListener } from "../src/listener";
import should from "should";

const filterAny = () => {
  return true;
};

describe("createDeferredListener", () => {
  it("queues calls to the listener", async () => {
    const { setListener, listener } = createDeferredListener(filterAny);
    const spy = sinon.spy();

    // Trigger a couple of events
    listener("message", "sender", "sendResponse");
    listener("message2", "sender2", "sendResponse2");

    // Listener should receive previous messages
    setListener(spy);

    // Trigger more events
    listener("message3", "sender3", "sendResponse3");
    listener("message4", "sender4", "sendResponse4");

    // Wait for promise queue to clear
    await Promise.resolve();

    spy.callCount.should.equal(4);
    spy.getCall(0).args.should.eql(["message", "sender", "sendResponse"]);
    spy.getCall(1).args.should.eql(["message2", "sender2", "sendResponse2"]);
    spy.getCall(2).args.should.eql(["message3", "sender3", "sendResponse3"]);
    spy.getCall(3).args.should.eql(["message4", "sender4", "sendResponse4"]);
  });

  it("ignores messages that don't pass the filter", async () => {
    const filter = (message) => {
      return message === "message";
    };

    const { setListener, listener } = createDeferredListener(filter);
    const spy = sinon.spy();

    const result1 = listener("message", "sender", "sendResponse");
    const result2 = listener("message2", "sender2", "sendResponse2");

    result1.should.eql(true);
    console.log(result2);
    should(result2).eql(undefined);

    setListener(spy);

    // Wait for promise queue to clear
    await Promise.resolve();

    spy.callCount.should.equal(1);
    spy.getCall(0).args.should.eql(["message", "sender", "sendResponse"]);
  });
});
