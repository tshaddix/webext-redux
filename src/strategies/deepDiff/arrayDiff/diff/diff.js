import bestSubSequence from "./lcs";

/**
 * Computes the differences between the two arrays.
 *
 * @param {array} a the base array
 * @param {array} b the target array
 * @param compareFunc the comparison function used to determine equality (a, b) => boolean
 * @return {object} the difference between the arrays
 */
export function diff(
  a, b,
  compareFunc = (ia, ib) => ia === ib
) {
  const ret = {
    removed: [],
    added: [],
  };

  bestSubSequence(
    a, b, compareFunc,
    (type, oldArr, oldStart, oldEnd, newArr, newStart, newEnd) => {
      if (type === "add") {
        for (let i = newStart; i < newEnd; ++i) {
          ret.added.push(newArr[i]);
        }
      } else if (type === "remove") {
        for (let i = oldStart; i < oldEnd; ++i) {
          ret.removed.push(oldArr[i]);
        }
      }
    }
  );
  return ret;

}
