import diffObjects from './diff';

/**
 * A higher order function that takes a `shouldContinue` function
 * and returns a custom deep diff function that uses the provided
 * `shouldContinue` function to decide when to stop traversing
 * the state tree.
 * @param {Function} shouldContinue A function, called during
 * diffing just after each state tree traversal, which should
 * return a boolean indicating whether or not to continue down
 * the tree, or to just treat the current object as a value. It
 * is called with the old state, the new state, and the current
 * position in the state tree (provided as a list of keys so far).
 */
export default function makeDiff(shouldContinue) {
  return function (oldObj, newObj) {
    return diffObjects(oldObj, newObj, shouldContinue);
  };
}