import same from "../../src/strategies/deepDiff/arrayDiff/diff/same";
import * as assert from "assert";

/**
 * Test for same function
 */
describe("Same", () => {
  it("Array not modified by function", () => {
    const a = [1, 2, 3],
          b = [2, 3, 4];

    same(a, b);
    assert.deepStrictEqual(a, [1, 2, 3], "input array changed!");
    assert.deepStrictEqual(b, [2, 3, 4], "input array changed!");
  });

  it("Different Type Check", () => {
    assert.deepStrictEqual(same([1, 2, 3], [2, 3, 4]), [2, 3]);
    assert.deepStrictEqual(same(["1", "2", "3"], ["2", "3", "4"]), ["2", "3"]);
    assert.deepStrictEqual(same([true, false], [false, false]), [false]);
  });

  it.skip("Random Check", function () {
    this.timeout(100 * 1000);

    function lcs(a, b) {
      const s = Array(a.length + 1);

      for (let i = 0; i <= a.length; ++i) {
        s[i] = Array(b.length + 1);
        s[i][0] = { len: 0 };
      }
      for (let i = 0; i <= b.length; ++i) {
        s[0][i] = { len: 0 };
      }
      for (let i = 1; i <= a.length; ++i) {
        for (let j = 1; j <= b.length; ++j) {
          if (a[i - 1] === b[j - 1]) {
            const v = s[i - 1][j - 1].len + 1;

            s[i][j] = { len: v, direct: [-1, -1] };
          } else {
            const v1 = s[i - 1][j].len;
            const v2 = s[i][j - 1].len;

            if (v1 > v2) {
              s[i][j] = { len: v1, direct: [-1, 0] };
            } else {
              s[i][j] = { len: v2, direct: [0, -1] };
            }
          }
        }
      }
      let n = a.length,
          m = b.length;
      const ret = [];

      while (s[n][m].len !== 0) {
        const node = s[n][m];

        if (node.direct[0] === node.direct[1]) {
          ret.push(a[n - 1]);
        }
        n += node.direct[0];
        m += node.direct[1];
      }
      return ret.reverse();
    }

    function getRandom() {
      const length = Math.floor(Math.random() * 20 + 2);

      return Array(length)
        .fill(0)
        .map(() => Math.floor(Math.random() * 10));
    }

    function isSubSeq(main, sub) {
      let i = 0;

      main.forEach((n) => (i += n === sub[i] ? 1 : 0));
      return i === sub.length;
    }

    for (let i = 0; i < 5000; ++i) {
      const arr1 = getRandom(),
            arr2 = getRandom();
      const lcsResult = lcs(arr1, arr2),
            sameResult = same(arr1, arr2);

      assert.strictEqual(
        lcsResult.length,
        sameResult.length,
        `[${arr1}] <=> [${arr2}], correct: [${lcsResult}], incorrect: [${sameResult}]`
      );
      assert.strictEqual(
        isSubSeq(arr1, sameResult) && isSubSeq(arr2, sameResult),
        true
      );
    }
  });

  it("Functional Check", () => {
    function same_str(a, b) {
      return same(a.split(""), b.split("")).join("");
    }

    assert.deepStrictEqual(same_str("846709", "2798"), "79");
    assert.deepStrictEqual(same_str("5561279", "597142"), "512");

    assert.deepStrictEqual(same_str("", ""), "");
    assert.deepStrictEqual(same_str("a", ""), "");
    assert.deepStrictEqual(same_str("", "b"), "");
    assert.deepStrictEqual(same_str("abcd", "e"), "");
    assert.deepStrictEqual(same_str("abc", "abc"), "abc");
    assert.deepStrictEqual(same_str("abcd", "obce"), "bc");
    assert.deepStrictEqual(same_str("abc", "ab"), "ab");
    assert.deepStrictEqual(same_str("cab", "ab"), "ab");
    assert.deepStrictEqual(same_str("abc", "bc"), "bc");
    assert.deepStrictEqual(same_str("abcde", "zbodf"), "bd");
    assert.deepStrictEqual(same_str("bcd", "bod"), "bd");
    assert.deepStrictEqual(same_str("aa", "aaaa"), "aa");
    assert.deepStrictEqual(same_str("aaaa", "aa"), "aa");
    assert.deepStrictEqual(same_str("TGGT", "GG"), "GG");
    assert.deepStrictEqual(
      same_str("GTCGTTCGGAATGCCGTTGCTCTGTAAA", "ACCGGTCGAGTGCGCGGAAGCCGGCCGAA"),
      "GTCGTCGGAAGCCGGCCGAA"
    );
    assert.deepStrictEqual(
      same_str(
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        "ABCDEFGHIJKL12345678901234567890MNOPQRSTUVWXYZ"
      ),
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    );
  });

  it("Customize compare function", () => {
    function compare(a, b) {
      return a.name === b.name && a.age === b.age;
    }
    const a = [
            { name: "Mike", age: 10 },
            { name: "Apple", age: 13 },
            { name: "Jack", age: 15 },
          ],
          b = [
            { name: "Apple", age: 13 },
            { name: "Mimi", age: 0 },
            { name: "Jack", age: 15 },
          ],
          result = [
            { name: "Apple", age: 13 },
            { name: "Jack", age: 15 },
          ];

    assert.deepStrictEqual(same(a, b, compare), result);
  });
});
