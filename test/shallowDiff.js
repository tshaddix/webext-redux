import shallowDiff from '../src/strategies/shallowDiff/diff';
import patchShallowDiff from "../src/strategies/shallowDiff/patch";
import {
  DIFF_STATUS_UPDATED,
  DIFF_STATUS_REMOVED,
} from '../src/strategies/constants';

describe('shallowDiff strategy', () => {
  describe('#diff()', () => {
    it('should return an object containing updated fields', () => {
      const old = { a: 1 };
      const latest = { a: 2, b: 3 };
      const diff = shallowDiff(old, latest);

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
      const diff = shallowDiff(old, latest);

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
      const latest = {a: 0, b: null, c: undefined, d: false, e: NaN, f: '', g: ""};
      const diff = shallowDiff(old, latest);

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
  });
  describe('#patch()', function () {
    let oldObj, newObj;

    beforeEach(() => {
      oldObj = { b: 1, c: {} };
      newObj = patchShallowDiff(oldObj, [
        { key: 'a', value: 123, change: DIFF_STATUS_UPDATED },
        { key: 'b', change: DIFF_STATUS_REMOVED },
      ]);
    });
    it('should update correctly', function () {
      newObj.should.not.equal(oldObj);
      newObj.c.should.equal(oldObj.c);
      newObj.should.eql({ a: 123, c: {} });
    });
  });
});
