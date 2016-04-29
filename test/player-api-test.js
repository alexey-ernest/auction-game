/**
 * @fileOverview Player endpoint tests.
 */

var app = require('..');
var request = require('supertest');
var uuid = require('node-uuid');
var common = require('./common');

var chai = require('chai');
chai.should();
var expect = chai.expect;

describe('/api/player', function () {
  it('should not get player info for unauthorized user', function (done) {
    request(app)
      .get('/api/player')
      .expect(401, done);
  });

  it('should get player info for authorized user', function (done) {
    common.login(function (err, token) {
      if (err) return done(err);

      request(app)
        .get('/api/player')
        .set('Authorization', 'JWT ' + token)
        .end(function (err, res) {
          if (err) return done(err);

          res.body.should.have.property('id');
          res.body.should.have.property('name');
          res.body.should.have.property('coins');
          
          common.doneAndDeregister(token, done)();
        });
    });
  });
});