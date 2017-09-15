// import should from 'should';

import shallowDiff from '../src/wrap-store/shallowDiff';

describe('#shallowDiff()', () => {
  it('should return an object containing updated fields', () => {
    const old = { a: 1 };
    const latest = { a: 2, b: 3 };

    shallowDiff(old, latest).should.have.property('updated').which.eql({a: 2, b: 3});
  });

  it('should return an object containing removed fields', () => {
    const old = { b: 1 };
    const latest = {};

    shallowDiff(old, latest).should.have.property('removed').which.eql(['b']);
  });
});
