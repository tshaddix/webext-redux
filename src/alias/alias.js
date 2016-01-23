export default aliases => store => next => action => {
  const alias = aliases[action.type];

  if (alias) {
    return next(alias(action));
  } else {
    return next(action);
  }
}