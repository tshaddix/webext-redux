import should from 'should';
import sinon from 'sinon';

import { alias } from '../src';

const getSessionAction = {
  type: 'GET_SESSION',
  payload: {
    withUser: true
  }
};

describe('#alias()', function () {
  const getSessionAlias = sinon.stub().returns({
          type: 'GET_SESSION_ALIAS',
          payload: {
            withUser: true,
            alias: true
          }
        }),
        aliases = alias({
          GET_SESSION: getSessionAlias
        });

  it('should call an alias when matching action type', function () {
    const next = sinon.spy();

    aliases()(next)(getSessionAction);

    should.exist(next.args[0][0]);
    should(next.args[0][0].type).eql('GET_SESSION_ALIAS');
    should(next.args[0][0].payload).eql({
      withUser: true,
      alias: true
    });
  });

  it('should call original action if no matching alias', function () {
    const next = sinon.spy();

    aliases()(next)({
      type: 'ACTION_2',
      payload: {
        actionStuff: true
      }
    });

    should.exist(next.args[0][0]);
    should(next.args[0][0].type).eql('ACTION_2');
    should(next.args[0][0].payload).eql({
      actionStuff: true
    });
  });
});
