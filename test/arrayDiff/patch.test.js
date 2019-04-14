import * as es from "../../src/strategies/deepDiff/arrayDiff/diff/patch";
import * as assert from "assert";

/**
 * Test for same function
 */
describe("Get Patch", () => {

  it("Array not modified by function", () => {
    const a = [1, 2, 3], b = [2, 3, 4];

    es.getPatch(a, b);
    assert.deepStrictEqual(a, [1, 2, 3], "input array changed!");
    assert.deepStrictEqual(b, [2, 3, 4], "input array changed!");
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
    function es_str(a, b, script, msg) {
      assert.deepStrictEqual(
        es.getPatch(a.split(""), b.split("")),
        script,
        msg
      );
    }

    es_str("", "", [], "empty");
    es_str("a", "", [remove(0, 0, "a")], "remove a");
    es_str("", "b", [add(0, 0, "b")], "add b");
    es_str("abcd", "e", [remove(0, 0, "abcd"), add(4, 0, "e")], "for abcd-e");
    es_str("abc", "abc", [], "same abc");
    es_str("abcd", "obce", [remove(0, 0, "a"), add(1, 0, "o"), remove(3, 3, "d"), add(4, 3, "e")], "abcd->obce");
    es_str("abc", "ab", [remove(2, 2, "c")], "abc->ac");
    es_str("cab", "ab", [remove(0, 0, "c")], "cab->ab");
    es_str("abcde", "zbodf", [remove(0, 0, "a"), add(1, 0, "z"),
      remove(2, 2, "c"), add(3, 2, "o"),
      remove(4, 4, "e"), add(5, 4, "f"),
    ], "abcde->cbodf");
    es_str("bcd", "bod", [remove(1, 1, "c"), add(2, 1, "o")], "bcd->bod");
    es_str("a", "aa", [add(1, 1, "a")], "a -> aa");
    es_str("aa", "aaaa", [add(2, 2, "aa")], "aa -> aaaa");
    es_str("aaaa", "aa", [remove(2, 2, "aa")], "aaaa -> aa");
    es_str("TGGT", "GG", [remove(0, 0, "T"), remove(3, 2, "T")], "TGGT -> GG");
    // debugger;
    es_str(
      "G", "AGG", [
        add(0, 0, "AG"),
      ]);

    es_str(
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

    es_str(
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "ABCDEFGHIJKL12345678901234567890MNOPQRSTUVWXYZ", [
        add(12, 12, "12345678901234567890") ], "remove 12345678901234567890");
  });

});
