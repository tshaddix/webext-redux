import {
  DIFF_STATUS_ARRAY_UPDATED,
  DIFF_STATUS_KEYS_UPDATED,
  DIFF_STATUS_REMOVED,
  DIFF_STATUS_UPDATED
} from '../constants';
import { getPatch as getArrayPatch } from './arrayDiff';

const objectConstructor = ({}).constructor;

function isObject(o) {
  return typeof o === "object" && o !== null && o.constructor === objectConstructor;
}

function shouldTreatAsValue(oldObj, newObj) {
  const bothAreArrays = Array.isArray(oldObj) && Array.isArray(newObj);

  return (!isObject(newObj) && !bothAreArrays) || typeof newObj !== typeof oldObj;
}

function diffValues(oldObj, newObj, shouldContinue, context) {
  // If it's null, use the current value
  if (oldObj === null) {
    return { change: DIFF_STATUS_UPDATED, value: newObj };
  }

  // If it's a non-object, or if the type is changing, or if it's an array,
  // just go with the current value.
  if (shouldTreatAsValue(oldObj, newObj) || !shouldContinue(oldObj, newObj, context)) {
    return { change: DIFF_STATUS_UPDATED, value: newObj };
  }

  if (Array.isArray(oldObj) && Array.isArray(newObj)) {
    return { change: DIFF_STATUS_ARRAY_UPDATED, value: getArrayPatch(oldObj, newObj) };
  }

  // If it's an object, compute the differences for each key.
  return { change: DIFF_STATUS_KEYS_UPDATED, value: diffObjects(oldObj, newObj, shouldContinue, context) };
}

/**
 * Performs a deep diff on two objects, created a nested list of patches. For objects, each key is compared.
 * If keys are not equal by reference, diffing continues on the key's corresponding values in the old and new
 * objects. If keys have been removed, they are recorded as such.
 * Non-object, non-array values that are not equal are recorded as updated values. Arrays are diffed shallowly.
 * The shouldContinue function is called on every potential value comparison with the current and previous objects
 * (at the present state in the tree) and the current path through the tree as an additional `context` parameter.
 * Returning false from this function will treat the current value as an updated value, regardless of whether or
 * not it is actually an object.
 * @param {Object} oldObj The old object
 * @param {Object} newObj The new object
 * @param {Function} shouldContinue Called with oldObj, newObj, and context, which is the current object path
 * Return false to stop diffing and treat everything under the current key as an updated value
 * @param {*} context
 */
export default function diffObjects(oldObj, newObj, shouldContinue = () => true, context = []) {
  const difference = [];

  // For each key in the current state,
  // get the differences in values.
  Object.keys(newObj).forEach((key) => {
    if (oldObj[key] !== newObj[key]) {
      difference.push({
        key,
        ...diffValues(oldObj[key], newObj[key], shouldContinue, context.concat(key))
      });
    }
  });

  // For each key previously present,
  // record its deletion.
  Object.keys(oldObj).forEach(key => {
    if (!newObj.hasOwnProperty(key)) {
      difference.push({
        key, change: DIFF_STATUS_REMOVED
      });
    }
  });

  return difference;
}
