// Function taken from redux source
// https://github.com/reactjs/redux/blob/master/src/compose.js
function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg;
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  return funcs.reduce((a, b) => (...args) => a(b(...args)));
}

// Based on redux implementation of applyMiddleware to support all standard
// redux middlewares
export default function applyMiddleware(store, ...middlewares) {
  let dispatch = () => {
    throw new Error(
      'Dispatching while constructing your middleware is not allowed. '+
      'Other middleware would not be applied to this dispatch.'
    );
  };

  const middlewareAPI = {
    getState: store.getState.bind(store),
    dispatch: (...args) => dispatch(...args)
  };

  middlewares = (middlewares || []).map(middleware => middleware(middlewareAPI));

  dispatch = compose(...middlewares)(store.dispatch);
  store.dispatch = dispatch;

  return store;
}
