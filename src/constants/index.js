// Message type used for dispatch events
// from the Proxy Stores to background
export const DISPATCH_TYPE = 'chromex.dispatch';

// Message type for state update events from
// background to Proxy Stores
export const STATE_TYPE = 'chromex.state';

// Message type for state patch events from
// background to Proxy Stores
export const PATCH_STATE_TYPE = 'chromex.patch_state';

// The `change` value for updated or inserted fields resulting from shallow diff
export const DIFF_STATUS_UPDATED = 'updated';

// The `change` value for removed fields resulting from shallow diff
export const DIFF_STATUS_REMOVED = 'removed';
