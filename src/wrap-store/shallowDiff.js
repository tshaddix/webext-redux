/**
 * Returns a new Object containing only the fields in `new` that differ from `old`
 *
 * @param {Object} old
 * @param {Object} new
 * @return {Object{updated, removed}} An object containing the updated and removed
 *   fields. Updated is an object containing any fields added or changed. Removed
 *   is an array of keys that exist in the old object but are missing in the new object.
 */
export default function shallowDiff(oldObj, newObj) {
  const updated = {};
  const removed = [];

  Object.keys(newObj).forEach((key) => {
    if (oldObj[key] !== newObj[key]) {
      updated[key] = newObj[key];
    }
  });

  Object.keys(oldObj).forEach(key => {
    if(!newObj[key]) {
      removed.push(key);
    }
  });

  return {
    updated,
    removed,
  };
}
