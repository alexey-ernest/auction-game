/**
 * @fileOverview Login and logout endpoint tests.
 */

var app = require('../..');
var request = require('supertest');
var uuid = require('node-uuid');
var common = require('./common');

var chai = require('chai');
chai.should();
var expect = chai.expect;

/**
 * Login endpoint tests.
 */
describe('/api/login', function () {
  var player = {};

  it('should check too short name', function (done) {
    var data = {
      name: 'pl'
    };
    request(app)
      .post('/api/login')
      .send(data)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400)
      .end(function (err, res) {
        if (err) return done(err);
        res.body.should.have.property('message');
        var errors = res.body.message;
        errors.should.have.property('name');
        done();
      });
  });

  it('should check too large name', function (done) {
    var data = {
      name: ('player' + uuid.v4() + uuid.v4()).substring(0, 51)
    };    
    request(app)
      .post('/api/login')
      .send(data)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400)
      .end(function (err, res) {
        if (err) return done(err);
        res.body.should.have.property('message');
        var errors = res.body.message;
        errors.should.have.property('name');
        done();
      });
  });

  it('should return token', function (done) {
    var data = {
      name: 'player' + uuid.v4()
    };    
    request(app)
      .post('/api/login')
      .send(data)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        res.body.should.have.property('token');
        common.doneAndDeregister(res.body.token, done)();
      });
  });

  it('should logs out if somebody else logs in with the same name', function (done) {
    common.login(function (err, token1) {
      if (err) return done(err);

      request(app)
        .get('/api/player')
        .set('Authorization', 'JWT ' + token1)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          var player = res.body;

          // login with the same name
          common.login(player.name, function (err, token2) {
            if (err) return done(err);

            request(app)
              .get('/api/player')
              .set('Authorization', 'JWT ' + token2)
              .expect(200)
              .end(function (err) {
                if (err) return done(err);

                request(app)
                  .get('/api/player')
                  .set('Authorization', 'JWT ' + token1)
                  .expect(401, common.doneAndDeregister(token2, done));
              });
          });
        });
    });
  });
});


/**
 * Logout endpoint tests.
 */
describe('/api/logout', function () {
  it('should not allow unauthorized user to logout', function (done) {
    request(app)
      .delete('/api/logout')
      .expect(401, done);
  });

  var player;
  it('should logout', function (done) {
    common.login(function (err, token) {
      if (err) return done(err);

      request(app)
        .get('/api/player')
        .set('Authorization', 'JWT ' + token)
        .end(function (err, res) {
          if (err) return done(err);
          
          player = res.body;

          request(app)
            .delete('/api/logout')
            .set('Authorization', 'JWT ' + token)
            .expect(200, done);
        });
    });
  });

  it('should login again with the same name', function (done) {
    common.login(player.name, function (err, token) {
      if (err) return done(err);

      request(app)
        .delete('/api/player')
        .set('Authorization', 'JWT ' + token)
        .expect(200, done);
    });
  });
});