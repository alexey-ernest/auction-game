/**
 * @fileOverview Tests for /api/login controller.
 */

var uuid = require('node-uuid');

var sinon = require('sinon');
var chai = require('chai');
chai.should();
var expect = chai.expect;

var login = require('../../routes/api/auth/login');

describe("/api/login", function() {
  it("should respond with token", function() {
    var req = {
      token: uuid.v4()
    };

    var result;
    var res = {
      json: function (data) {
        result = data;
      }
    };
    var spy = sinon.spy(res, 'json');

    login(req, res);
    expect(spy.calledOnce).to.equal(true);
    result.should.have.property('token');
    result.token.should.equal(req.token);
  });     
});