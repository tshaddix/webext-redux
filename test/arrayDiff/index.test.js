import * as diff from "../../src/strategies/deepDiff/arrayDiff/index";
import * as assert from "assert";

/**
 * Test for index interface
 */
describe("Index", () => {

  it("same function in index", () => {
    assert.deepStrictEqual(diff.same([1, 2, 3], [2, 3, 4]), [2, 3]);
  });

  it ("diff data and function in index", () => {
    const result = {
      added: [1, 2],
      removed: [3, 4],
    };

    assert.deepStrictEqual(diff.diff([3, 4, 5, 6], [1, 2, 5, 6]), result);
  });

  it("getPatch function in index", () => {
    assert.deepStrictEqual(diff.getPatch([1, 2, 3], [2, 3, 4]), [
      { type: "remove", oldPos: 0, newPos: 0, items: [1] },
      { type: "add", oldPos: 3, newPos: 2, items: [4] },
    ]);
  });

  it("applyPatch function in index", () => {
    assert.deepStrictEqual(diff.applyPatch([1, 2, 3], [
      { type: "remove", oldPos: 0, newPos: 0, items: [1] },
      { type: "add", oldPos: 3, newPos: 2, items: [4] },
    ]) , [2, 3, 4]);
  });

});
