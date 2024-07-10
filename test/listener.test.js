import sinon from "sinon";
import { createDeferredListener } from "../src/listener";

describe("createDeferredListener", () => {
  it("queues calls to the listener", async () => {
    const { setListener, listener } = createDeferredListener();
    const spy = sinon.spy();

    // Trigger a couple of events
    listener("message", "sender", "sendResponse");
    listener("message2", "sender2", "sendResponse2");

    // Listener should receive previous messages
    setListener(spy);

    // Trigger more events
    listener("message3", "sender3", "sendResponse3");
    listener("message4", "sender4", "sendResponse4");

    await Promise.resolve();

    spy.callCount.should.equal(4);
    spy.getCall(0).args.should.eql(["message", "sender", "sendResponse"]);
    spy.getCall(1).args.should.eql(["message2", "sender2", "sendResponse2"]);
    spy.getCall(2).args.should.eql(["message3", "sender3", "sendResponse3"]);
    spy.getCall(3).args.should.eql(["message4", "sender4", "sendResponse4"]);
  });
});
