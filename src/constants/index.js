// Message type used for dispatch events
// from the Proxy Stores to background
export const DISPATCH_TYPE = "webext.dispatch";

// Message type for fetching current state from
// background to Proxy Stores
export const FETCH_STATE_TYPE = "webext.fetch_state";

// Message type for state update events from
// background to Proxy Stores
export const STATE_TYPE = "webext.state";

// Message type for state patch events from
// background to Proxy Stores
export const PATCH_STATE_TYPE = "webext.patch_state";

// The default name for the port communication via
// react-chrome-redux
export const DEFAULT_PORT_NAME = "webext.port_name";
