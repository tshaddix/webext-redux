import diffObjects from './diff';

export default function makeDiff(shouldContinue) {
  return function (oldObj, newObj) {
    return diffObjects(oldObj, newObj, shouldContinue);
  };
}