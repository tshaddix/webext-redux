import deepDiff from '../src/strategies/deepDiff/diff';
import patchDeepDiff from '../src/strategies/deepDiff/patch';
import makeDiff from '../src/strategies/deepDiff/makeDiff';
import {
  DIFF_STATUS_ARRAY_UPDATED,
  DIFF_STATUS_KEYS_UPDATED,
  DIFF_STATUS_REMOVED,
  DIFF_STATUS_UPDATED
} from '../src/strategies/constants';
import sinon from 'sinon';

describe('deepDiff strategy', () => {
  describe("#diff()", () => {
    it('should return an object containing updated fields', () => {
      const old = { a: 1 };
      const latest = { a: 2, b: 3 };
      const diff = deepDiff(old, latest);

      diff.length.should.eql(2);
      diff.should.eql([
        {
          key: 'a',
          value: 2,
          change: DIFF_STATUS_UPDATED,
        },
        {
          key: 'b',
          value: 3,
          change: DIFF_STATUS_UPDATED,
        }
      ]);
    });

    it('should return an object containing removed fields', () => {
      const old = { b: 1 };
      const latest = {};
      const diff = deepDiff(old, latest);

      diff.length.should.eql(1);
      diff.should.eql([
        {
          key: 'b',
          change: DIFF_STATUS_REMOVED,
        }
      ]);
    });

    it('should not mark falsy values as removed', () => {
      const old = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7 };
      const latest = { a: 0, b: null, c: undefined, d: false, e: NaN, f: '', g: "" };
      const diff = deepDiff(old, latest);

      diff.length.should.eql(7);
      diff.should.eql([
        {
          key: 'a',
          value: 0,
          change: DIFF_STATUS_UPDATED,
        },
        {
          key: 'b',
          value: null,
          change: DIFF_STATUS_UPDATED,
        },
        {
          key: 'c',
          value: undefined,
          change: DIFF_STATUS_UPDATED,
        },
        {
          key: 'd',
          value: false,
          change: DIFF_STATUS_UPDATED,
        },
        {
          key: 'e',
          value: NaN,
          change: DIFF_STATUS_UPDATED,
        },
        {
          key: 'f',
          value: '',
          change: DIFF_STATUS_UPDATED,
        },
        {
          key: 'g',
          value: "",
          change: DIFF_STATUS_UPDATED,
        }
      ]);
    });

    describe('when references to keys are equal', () => {

      let old, latest;

      beforeEach(() => {
        old = { a: { b: 1 } };
        latest = { ...old };
      });

      it('should not generate a diff', () => {
        const diff = deepDiff(old, latest);

        diff.length.should.eql(0);
      });

      it('should not compare nested values', () => {
        let accessed = false;

        sinon.stub(old.a, 'b').get(() => {
          accessed = true;
          return 1;
        });
        deepDiff(old, latest);
        accessed.should.eql(false);
        latest.a.b;
        accessed.should.eql(true);
      });
    });

    describe('when references to keys are different', () => {

      let old, latest;

      beforeEach(() => {
        old = { a: { b: 1 } };
        latest = { a: { b: 1 } };
      });

      it('should generate a diff', () => {
        const diff = deepDiff(old, latest);

        diff.should.eql([
          {
            key: 'a',
            change: DIFF_STATUS_KEYS_UPDATED,
            value: []
          }
        ]);
      });

      it('should compare nested values', () => {
        let accessed = false;

        sinon.stub(old.a, 'b').get(() => {
          accessed = true;
          return 1;
        });
        deepDiff(old, latest);
        accessed.should.eql(true);
      });
    });

    describe('when values are different', () => {

      let old, latest;

      beforeEach(() => {
        old = { a: { b: 1, c: 2 } };
        latest = { a: { ...old.a, b: 3, d: 4 } };
      });

      it('should generate a diff', () => {
        const diff = deepDiff(old, latest);

        diff.should.eql([
          {
            key: 'a',
            change: DIFF_STATUS_KEYS_UPDATED,
            value: [
              {
                key: 'b',
                change: DIFF_STATUS_UPDATED,
                value: 3
              },
              {
                key: 'd',
                change: DIFF_STATUS_UPDATED,
                value: 4
              }
            ]
          }
        ]);
      });
    });

    describe('when a null value is being replaced with an object', () => {
      it('should generate a diff', () => {
        const old = { a: null };
        const latest = { a: { b: 1 } };

        const diff = deepDiff(old, latest);

        diff.length.should.eql(1);
        diff.should.eql([
          {
            key: 'a',
            value: { b: 1 },
            change: DIFF_STATUS_UPDATED,
          }
        ]);
      });
    });

    describe("shouldContinue param", () => {

      let old, latest, shouldContinue, diff;

      beforeEach(() => {
        old = { a: { b: 1, c: 2, i: { j: 6 } }, e: { f: 5, g: { h: { k: 2 } } } };
        latest = { ...old, e: { ...old.e, g: { h: { k: 3 } } } };
        shouldContinue = sinon.spy(() => true);
        diff = deepDiff(old, latest, shouldContinue);
      });

      it("should be called on each object-like value that's different", () => {
        // Expect calls for e, e.g, and e.g.h, but *not* a or a.i
        shouldContinue.callCount.should.eql(3);
      });

      it("should be called with the right context", () => {
        shouldContinue.calledWith(old.e, latest.e, ['e']).should.eql(true);
        shouldContinue.calledWith(old.e.g, latest.e.g, ['e', 'g']).should.eql(true);
        shouldContinue.calledWith(old.e.g.h, latest.e.g.h, ['e', 'g', 'h']).should.eql(true);
      });

      describe("with default logic", () => {
        it("should not affect the diff", () => {
          diff.should.eql([
            {
              key: "e",
              change: "updated_keys",
              value: [
                {
                  key: "g",
                  change: "updated_keys",
                  value: [
                    {
                      key: "h",
                      change: "updated_keys",
                      value: [
                        {
                          key: "k",
                          change: "updated",
                          value: 3
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]);
        });
      });

      describe("with custom logic", () => {
        it("should honor the custom logic", () => {
          // Stop at the second level
          shouldContinue = sinon.spy((oldObj, newObj, context) => context.length <= 1);
          diff = deepDiff(old, latest, shouldContinue);
          shouldContinue.callCount.should.eql(2);
          shouldContinue.calledWith(old.e, latest.e, ['e']).should.eql(true);
          shouldContinue.calledWith(old.e.g, latest.e.g, ['e', 'g']).should.eql(true);
          shouldContinue.calledWith(old.e.g.h, latest.e.g.h, ['e', 'g', 'h']).should.eql(false);
          diff.should.eql([
            {
              key: "e",
              change: "updated_keys",
              value: [
                {
                  key: "g",
                  change: "updated",
                  // Diff stopped here
                  value: { h: { k: 3 } }
                }
              ]
            }
          ]);
        });
      });
    });

    describe('handles array values', () => {
      it('should generate an array patch for an appended item', () => {
        const old = {
          a: [1]
        };
        const latest = {
          a: [1, 2]
        };

        const diff = deepDiff(old, latest);

        // console.log('***** arrays', diff);
        diff.length.should.eql(1);
        diff.should.eql([
          {
            key: 'a',
            change: DIFF_STATUS_ARRAY_UPDATED,
            value: [
              {
                type: 'add',
                oldPos: 1,
                newPos: 1,
                items: [2]
              }
            ]
          }
        ]);
      });

      it('should generate an array patch for an inserted item', () => {
        const old = {
          a: [1, 3]
        };
        const latest = {
          a: [1, 2, 3]
        };

        const diff = deepDiff(old, latest);

        // console.log('***** arrays', diff);
        diff.length.should.eql(1);
        diff.should.eql([
          {
            key: 'a',
            change: DIFF_STATUS_ARRAY_UPDATED,
            value: [
              {
                type: 'add',
                oldPos: 1,
                newPos: 1,
                items: [2]
              }
            ]
          }
        ]);
      });

      it('should generate an array patch for an inserted object', () => {
        const aObject = { a: 'a' };
        const cObject = { c: 'c' };
        const old = {
          a: [aObject, cObject]
        };
        const latest = {
          a: [aObject, { b: 'b' }, cObject]
        };

        const diff = deepDiff(old, latest);

        // console.log('***** arrays', diff);
        diff.length.should.eql(1);
        diff.should.eql([
          {
            key: 'a',
            change: DIFF_STATUS_ARRAY_UPDATED,
            value: [
              {
                type: 'add',
                oldPos: 1,
                newPos: 1,
                items: [{ b: 'b' }]
              }
            ]
          }
        ]);
      });
    });
  });

  describe("#patch()", () => {
    describe("when there are no differences", () => {
      it("should return the same object", () => {
        const oldObj = { a: 1 };
        const newObj = patchDeepDiff(oldObj, []);

        newObj.should.equal(oldObj);
      });
    });
    describe("when keys are updated", () => {
      let oldObj, newObj, diff;

      beforeEach(() => {
        oldObj = { a: {}, b: {} };
        diff = [{ key: 'a', change: DIFF_STATUS_KEYS_UPDATED, value: [] }];
        newObj = patchDeepDiff(oldObj, diff);
      });

      it("should copy the keys", () => {
        newObj.should.not.equal(oldObj);
      });

      it("should not copy unchanged values", () => {
        newObj.a.should.equal(oldObj.a);
        newObj.b.should.equal(oldObj.b);
      });

      it("should not modify the original object", () => {
        oldObj = { a: {}, b: 1 };
        const ref_oldObj = oldObj;
        const ref_oldObj_a = oldObj.a;
        const ref_oldObj_b = oldObj.b;

        patchDeepDiff(oldObj, diff);
        oldObj.should.equal(ref_oldObj);
        oldObj.a.should.equal(ref_oldObj_a);
        oldObj.b.should.equal(ref_oldObj_b);

      });
    });
    describe("when values are updated", () => {
      let oldObj, newObj, diff;

      beforeEach(() => {
        oldObj = { a: { b: 1 }, c: {} };
        diff = [{ key: 'a', change: DIFF_STATUS_KEYS_UPDATED, value: [
          { key: 'b', change: DIFF_STATUS_UPDATED, value: 2 }, { key: 'd', change: DIFF_STATUS_UPDATED, value: 3 }
        ] }];
        newObj = patchDeepDiff(oldObj, diff);
      });
      it("should copy the keys", () => {
        newObj.should.not.equal(oldObj);
        newObj.a.should.not.equal(oldObj.a);
      });
      it("should not copy unchanged values", () => {
        newObj.c.should.equal(oldObj.c);
      });
      it("should modify the updated values", () => {
        newObj.a.b.should.eql(2);
        newObj.a.d.should.eql(3);
      });
    });
    describe("when values are removed", () => {
      let oldObj, newObj, diff;

      beforeEach(() => {
        oldObj = { a: { b: 1 }, c: {} };
        diff = [{ key: 'c', change: DIFF_STATUS_REMOVED }];
        newObj = patchDeepDiff(oldObj, diff);
      });
      it("should copy the keys", () => {
        newObj.should.not.equal(oldObj);
      });
      it("should delete the removed values", () => {
        newObj.should.not.have.property('c');
      });
      it("should not delete the other values", () => {
        newObj.a.should.equal(oldObj.a);
      });
      it("should not modify the original object", () => {
        oldObj.should.have.property('c');
      });
    });

    describe("when arrays are updated", () => {
      const oldObj = {
        a: [ 1 ]
      };

      it("should append the value", () => {
        const diff = [
          {
            key: 'a',
            change: DIFF_STATUS_ARRAY_UPDATED,
            value: [
              {
                type: 'add',
                oldPos: 1,
                newPos: 1,
                items: [2]
              }
            ]
          }
        ];

        const newObj = patchDeepDiff(oldObj, diff);

        newObj.should.eql({a:[1, 2]});
      });
    });
  });

  describe("round trips", () => {
    it("a simple array item append", () => {
      const oldObj = { a: [1] };
      const newObj = { a: [1, 2] };

      const result = patchDeepDiff(oldObj, deepDiff(oldObj, newObj));

      result.should.eql(newObj);
    });
  });

  describe("#makeDiff", () => {
    it("should return a diff strategy function that uses the provided shouldContinue param", () => {
      const shouldContinue = sinon.spy(() => true);
      const diffStrategy = makeDiff(shouldContinue);

      shouldContinue.callCount.should.eql(0);
      diffStrategy({ a: { b: 1 }}, { a: { b: 2 }});
      shouldContinue.callCount.should.be.greaterThan(0);
    });
  });
});
