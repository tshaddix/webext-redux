var should = require('should');
var sinon = require('sinon');

var alias = require('../lib').alias;

var getSessionAction = {
  type: 'GET_SESSION',
  payload: {
    withUser: true
  }
};

describe('#alias()',function() {
  var getSessionAlias = sinon.stub().returns({
    type: 'GET_SESSION_ALIAS',
    payload: {
      withUser: true,
      alias: true
    }
  });

  var aliases = alias({
    GET_SESSION: getSessionAlias
  });

  it('should call an alias when matching action type', function() {
    var next = sinon.spy();

    aliases()(next)(getSessionAction);

    should.exist(next.args[0][0]);
    should(next.args[0][0].type).eql('GET_SESSION_ALIAS');
    should(next.args[0][0].payload).eql({
      withUser: true,
      alias: true
    });
  });

  it('should call original action if no matching alias', function() {
    var next = sinon.spy();

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
