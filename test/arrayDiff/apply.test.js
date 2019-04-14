import * as diff from "../../src/strategies/deepDiff/arrayDiff/diff/apply";
import * as assert from "assert";

/**
 * Test for same function
 */
describe("Apply Patch", () => {

  it("Array not modified by function", () => {
    const a = [1, 2, 3];

    diff.applyPatch(a, [
      { type: "remove", oldPos: 0, newPos: 0, items: [1] },
      { type: "add", oldPos: 3, newPos: 2, items: [4] },
    ]);
    assert.deepStrictEqual(a, [1, 2, 3], "input array changed!");
  });

  it("Functional test", () => {
    function add(oldPos, newPos, str) {
      return {
        type: "add",
        oldPos,
        newPos,
        items: str.split(""),
      };
    }
    function remove(oldPos, newPos, str) {
      return {
        type: "remove",
        oldPos,
        newPos,
        items: str.split(""),
      };
    }
    function apply_str(a, b, script, msg) {
      assert.deepStrictEqual(
        diff.applyPatch(a.split(""), script),
        b.split(""),
        msg
      );
    }

    apply_str("", "", [], "empty");
    apply_str("a", "", [remove(0, 0, "a")], "remove a");
    apply_str("", "b", [add(0, 0, "b")], "add b");
    apply_str("abcd", "e", [remove(0, 0, "abcd"), add(4, 0, "e")], "for abcd-e");
    apply_str("abc", "abc", [], "same abc");
    apply_str("abcd", "obce", [remove(0, 0, "a"), add(1, 0, "o"), remove(3, 3, "d"), add(4, 3, "e")], "abcd->obce");
    apply_str("abc", "ab", [remove(2, 2, "c")], "abc->ac");
    apply_str("cab", "ab", [remove(0, 0, "c")], "cab->ab");
    apply_str("abcde", "zbodf", [remove(0, 0, "a"), add(1, 0, "z"),
      remove(2, 2, "c"), add(3, 2, "o"),
      remove(4, 4, "e"), add(5, 4, "f"),
    ], "abcde->cbodf");
    apply_str("bcd", "bod", [remove(1, 1, "c"), add(2, 1, "o")], "bcd->bod");
    apply_str("a", "aa", [add(1, 1, "a")], "a -> aa");
    apply_str("aa", "aaaa", [add(2, 2, "aa")], "aa -> aaaa");
    apply_str("aaaa", "aa", [remove(2, 2, "aa")], "aaaa -> aa");
    apply_str("TGGT", "GG", [remove(0, 0, "T"), remove(3, 2, "T")], "TGGT -> GG");
    // debugger;
    apply_str(
      "G", "AGG", [
        add(0, 0, "AG"),
      ]);

    apply_str(
      "GTCGTTCGGAATGCCGTTGCTCTGTAAA", "ACCGGTCGAGTGCGCGGAAGCCGGCCGAA", [
        add(0, 0, "ACCG"),
        add(3, 7, "GA"),
        remove(5, 13, "T"),
        add(6, 11, "GCG"),
        remove(11, 19, "T"),
        remove(16, 23, "TT"),
        remove(20, 25, "T"),
        remove(22, 26, "T"),
        remove(24, 27, "TA"),
      ], "GTCGTTCGGAATGCCGTTGCTCTGTAAA");

    apply_str(
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "ABCDEFGHIJKL12345678901234567890MNOPQRSTUVWXYZ", [
        add(12, 12, "12345678901234567890") ], "remove 12345678901234567890");

  });

  it("Functional test on different input style", () => {
    function add(oldPos, newPos, str) {
      return {
        type: "add",
        oldPos,
        newPos,
        items: str.split(""),
      };
    }
    function remove(oldPos, newPos, str) {
      return {
        type: "remove",
        oldPos,
        newPos,
        length: str.length,
      };
    }
    function apply_str(a, b, script, msg) {
      assert.deepStrictEqual(
        diff.applyPatch(a.split(""), script),
        b.split(""),
        msg
      );
    }

    apply_str("", "", [], "empty");
    apply_str("a", "", [remove(0, 0, "a")], "remove a");
    apply_str("", "b", [add(0, 0, "b")], "add b");
    apply_str("abcd", "e", [remove(0, 0, "abcd"), add(4, 0, "e")], "for abcd-e");
    apply_str("abc", "abc", [], "same abc");
    apply_str("abcd", "obce", [remove(0, 0, "a"), add(1, 0, "o"), remove(3, 3, "d"), add(4, 3, "e")], "abcd->obce");
    apply_str("abc", "ab", [remove(2, 2, "c")], "abc->ac");
    apply_str("cab", "ab", [remove(0, 0, "c")], "cab->ab");
    apply_str("abcde", "zbodf", [remove(0, 0, "a"), add(1, 0, "z"),
      remove(2, 2, "c"), add(3, 2, "o"),
      remove(4, 4, "e"), add(5, 4, "f"),
    ], "abcde->cbodf");
    apply_str("bcd", "bod", [remove(1, 1, "c"), add(2, 1, "o")], "bcd->bod");
    apply_str("a", "aa", [add(1, 1, "a")], "a -> aa");
    apply_str("aa", "aaaa", [add(2, 2, "aa")], "aa -> aaaa");
    apply_str("aaaa", "aa", [remove(2, 2, "aa")], "aaaa -> aa");
    apply_str("TGGT", "GG", [remove(0, 0, "T"), remove(3, 2, "T")], "TGGT -> GG");
    // debugger;
    apply_str(
      "G", "AGG", [
        add(0, 0, "AG"),
      ]);

    apply_str(
      "GTCGTTCGGAATGCCGTTGCTCTGTAAA", "ACCGGTCGAGTGCGCGGAAGCCGGCCGAA", [
        add(0, 0, "ACCG"),
        add(3, 7, "GA"),
        remove(5, 13, "T"),
        add(6, 11, "GCG"),
        remove(11, 19, "T"),
        remove(16, 23, "TT"),
        remove(20, 25, "T"),
        remove(22, 26, "T"),
        remove(24, 27, "TA"),
      ], "GTCGTTCGGAATGCCGTTGCTCTGTAAA");

    apply_str(
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "ABCDEFGHIJKL12345678901234567890MNOPQRSTUVWXYZ", [
        add(12, 12, "12345678901234567890") ], "remove 12345678901234567890");

  });

});
