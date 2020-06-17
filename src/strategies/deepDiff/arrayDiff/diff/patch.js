import bestSubSequence from "./lcs";

/**
 * Computes the patch necessary to turn array a into array b.
 *
 * @param a the base array
 * @param b the target array
 * @param compareFunc the comparison function used to determine equality (a, b) => boolean
 * @return {object} the computed patch
 */
export function getPatch(
  a, b,
  compareFunc = (ia, ib) => ia === ib) {
  const patch = [];
  let lastAdd = null;
  let lastRemove = null;

  /**
   *
   * @param {string} type "add" | "remove" | "same"
   * @param {array} oldArr the old array
   * @param {number} oldStart the old start
   * @param {number} oldEnd the old end
   * @param {array} newArr the new array
   * @param {number} newStart the new start
   * @param {number} newEnd the new end
   */
  function pushChange(
    type,
    oldArr, oldStart, oldEnd,
    newArr, newStart, newEnd) {
    if (type === "same") {
      if (lastRemove) {
        patch.push(lastRemove);
      }
      if (lastAdd) {
        patch.push(lastAdd);
      }
      lastRemove = null;
      lastAdd = null;
    } else if (type === "remove") {
      if (!lastRemove) {
        lastRemove = {
          type: "remove",
          oldPos: oldStart,
          newPos: newStart,
          items: [],
        };
      }
      for (let i = oldStart; i < oldEnd; ++i) {
        lastRemove.items.push(oldArr[i]);
      }
      if (lastAdd) {
        lastAdd.oldPos += oldEnd - oldStart;
        if (lastRemove.oldPos === oldStart) {
          lastRemove.newPos -= oldEnd - oldStart;
        }
      }
    } else if (type === "add") {
      if (!lastAdd) {
        lastAdd = {
          type: "add",
          oldPos: oldStart,
          newPos: newStart,
          items: [],
        };
      }
      for (let i = newStart; i < newEnd; ++i) {
        lastAdd.items.push(newArr[i]);
      }
    }
  }

  bestSubSequence(a, b, compareFunc, pushChange);

  pushChange("same", [], 0, 0, [], 0, 0);

  return patch;
}
