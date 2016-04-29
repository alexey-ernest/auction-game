/**
 * @fileOverview Common helper functions for tests.
 */

var app = require('..');
var request = require('supertest');
var uuid = require('node-uuid');

/**
 * Helper function for loggin and preserving authentication cookie.
 *
 * @method     login
 * @param      {Function}  fn      Callback: function (err, agent, player) {}
 */
exports.login = function (name, fn) {
  if (typeof name === 'function') {
    fn = name;
    name = 'player' + uuid.v4();
  }

  request(app)
    .post('/api/login')
    .send({name: name})
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(200)
    .end(function (err, res) {
      if (err) return fn(err);
      fn(null, res.body.token);
    });
};

/**
 * Wrapper for standard done callback to deregister current player.
 *
 * @method     doneAndDeregister
 * @param      {string}    token   JWT token.
 * @param      {Function}  done    Done callback.
 * @return     {Function}  Callback function.
 */
exports.doneAndDeregister = function(token, done) {
  return function (err) {
    if (err) return done(err);
    request(app)
      .delete('/api/player')
      .set('Authorization', 'JWT ' + token)
      .expect(200, done);
  };
};
