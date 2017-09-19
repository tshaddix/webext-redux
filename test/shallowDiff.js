import shallowDiff from '../src/wrap-store/shallowDiff';
import {
  DIFF_STATUS_UPDATED,
  DIFF_STATUS_REMOVED,
} from '../src/constants';

describe('#shallowDiff()', () => {
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
});
