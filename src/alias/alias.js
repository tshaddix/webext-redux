/**
 * Simple middleware intercepts actions and replaces with
 * another by calling an alias function with the original action
 * @type {object} aliases an object that maps action types (keys) to alias functions (values) (e.g. { SOME_ACTION: newActionAliasFunc })
 */

const dispatchWithSender = (dispatch, originalAction) => {
  return action => {
    const actionWithSender = Object.assign({}, action, { _sender: originalAction._sender});

    dispatch(actionWithSender);
  };
};

export default aliases => () => next => action => {
  const alias = aliases[action.type];

  if (alias) {
    const aliasResult = alias(action);

    if (typeof aliasResult === "function") {
      return next((dispatch, getState) =>
        aliasResult(dispatchWithSender(dispatch, action), getState)
      );
    }
    return next(Object.assign({}, aliasResult, { _sender: action._sender}));
  }

  return next(action);
};
