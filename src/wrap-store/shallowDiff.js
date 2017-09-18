const STATUS_UPDATED = 'updated';
const STATUS_REMOVED = 'removed';

/**
 * Returns a new Object containing only the fields in `new` that differ from `old`
 *
 * @param {Object} old
 * @param {Object} new
 * @return {Array} An array of changes. The changes have a `key`, `value`, and `change`.
 *   The change is either `updated`, which is if the value has changed or been added,
 *   or `removed`.
 */
export default function shallowDiff(oldObj, newObj) {
  const difference = [];

  Object.keys(newObj).forEach((key) => {
    if (oldObj[key] !== newObj[key]) {
      difference.push({
        key,
        value: newObj[key],
        change: STATUS_UPDATED
      });
    }
  });

  Object.keys(oldObj).forEach(key => {
    if (!newObj[key]) {
      difference.push({
        key,
        change: STATUS_REMOVED
      });
    }
  });

  return difference;
}
