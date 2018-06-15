import { DIFF_STATUS_KEYS_UPDATED, DIFF_STATUS_REMOVED, DIFF_STATUS_UPDATED } from "../constants";

const objectConstructor = ({}).constructor;
function isObject(o) {
  return typeof o === "object" && o.constructor === objectConstructor;
}

function diffValues(cur, prev, shouldContinue, context) {
  // If it's a non-object, or if the type is changing, or if it's an array,
  // just go with the current value.
  if (!isObject(cur) || typeof cur !== typeof prev || Array.isArray(cur) || (shouldContinue && !shouldContinue(cur, prev, context))) {
    return { type: DIFF_STATUS_UPDATED, value: cur }
  }
  // If it's an object, compute the differences for each key.
  else {
    return { type: DIFF_STATUS_KEYS_UPDATED, value: diffObjects(cur, prev, shouldContinue, context) }
  }
}

export default function diffObjects(cur, prev, shouldContinue = null, context = []) {
  const difference = []

  // For each key in the current state,
  // get the differences in values.
  Object.keys(cur).forEach((key) => {
    if (prev[key] !== cur[key]) {
      difference.push({
        key,
        ...diffValues(cur[key], prev[key], shouldContinue, context.concat(key))
      });
    }
  });

  // For each key previously present,
  // record its deletion.
  Object.keys(prev).forEach(key => {
    if (cur[key] === undefined) {
      difference.push({
        key, type: DIFF_STATUS_REMOVED
      });
    }
  });

  return difference;
}