import * as redux from 'redux';

export class Store<T> {
	/**
   * Creates a new Proxy store
   * @param options An object of form {portName, state, extensionId}, where `portName` is a required string and defines the name of the port for state transition changes, `state` is the initial state of this store (default `{}`) `extensionId` is the extension id as defined by chrome when extension is loaded (default `''`)
   */
	constructor(options: {
		portName: string,
		state?: any,
		extensionId?: string,
	});

	/**
   * Returns a promise that resolves when the store is ready.
   * @return promise A promise that resolves when the store has established a connection with the background page.
  */
	ready(): Promise<void>;

	/**
   * Returns a promise that resolves when the store is ready.
   * @param callback An callback that will fire when the store is ready.
   * @return promise A promise that resolves when the store has established a connection with the background page.
  */
	ready<T>(cb: () => T): Promise<T>;

	  /**
   * Subscribes a listener function for all state changes
   * @param listener A listener function to be called when store state changes
   * @return An unsubscribe function which can be called to remove the listener from state updates
   */
  subscribe(listener: () => void): () => void;

  /**
   * Replace the current state with a new state. Notifies all listeners of state change.
   * @param state The new state for the store
   */
  replaceState(state: T): void;

  /**
   * Get the current state of the store
   * @return the current store state
   */
  getState(): T;

  /**
   * Dispatch an action to the background using messaging passing
   * @param  data The action data to dispatch
   * @return Promise that will resolve/reject based on the action response from the background
   */
  dispatch<R>(data: redux.AnyAction): Promise<R>;
}

export function wrapStore<S>(
	store: redux.Store<S>,
	configuration: {
		portName: string,
		dispatchResponder?(dispatchResult: any, send: (response: any) => void): void,
	},
): void;

export function alias(aliases: {
	[key: string]: () => void
}): redux.Middleware;
