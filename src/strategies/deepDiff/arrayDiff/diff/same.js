import bestSubSequence from "./lcs";

/**
 *
 * @param a the base array
 * @param b the target array
 * @param compareFunc the comparison function used to determine equality (a, b) => boolean
 * @return {array}
 */
export default function (
  a, b,
  compareFunc = (ia, ib) => ia === ib
) {
  const ret = [];

  bestSubSequence(
    a, b, compareFunc,
    (type, oldArr, oldStart, oldEnd) => {
      if (type === "same") {
        for (let i = oldStart; i < oldEnd; ++i) {
          ret.push(oldArr[i]);
        }
      }
    }
  );
  return ret;
}
