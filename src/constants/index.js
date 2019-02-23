// Message type used for dispatch events
// from the Proxy Stores to background
export const DISPATCH_TYPE = 'chromex.dispatch';

// Message type for state update events from
// background to Proxy Stores
export const STATE_TYPE = 'chromex.state';

// Message type for state patch events from
// background to Proxy Stores
export const PATCH_STATE_TYPE = 'chromex.patch_state';

// The default name for the port communication via
// react-chrome-redux
export const DEFAULT_PORT_NAME = "chromex.port_name";
