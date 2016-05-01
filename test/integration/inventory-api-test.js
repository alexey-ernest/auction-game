/**
 * @fileOverview Inventory endpoint tests.
 */

var app = require('../..');
var request = require('supertest');
var uuid = require('node-uuid');
var common = require('./common');

var chai = require('chai');
chai.should();
var expect = chai.expect;

describe('/api/inventory', function () {
  it('should not allow unauthorized user to get inventory', function (done) {
    request(app)
      .get('/api/inventory')
      .expect(401, done);
  });

  it('should return default inventory items for new player', function (done) {
    common.login(function (err, token) {
      if (err) return done(err);

      request(app)
        .get('/api/inventory')
        .set('Authorization', 'JWT ' + token)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);

          var items = res.body;
          items.should.have.length(3);
          
          // breads
          var bread = items.filter(function (i) {
            return i.item === 'bread';
          });
          bread.should.have.length(1);
          bread = bread[0];
          bread.should.have.property('quantity');
          bread.quantity.should.equal(30);

          // carrots
          var carrot = items.filter(function (i) {
            return i.item === 'carrot';
          });
          carrot.should.have.length(1);
          carrot = carrot[0];
          carrot.should.have.property('quantity');
          carrot.quantity.should.equal(18);

          // diamonds
          var diamond = items.filter(function (i) {
            return i.item === 'diamond';
          });
          diamond.should.have.length(1);
          diamond = diamond[0];
          diamond.should.have.property('quantity');
          diamond.quantity.should.equal(1);

          common.doneAndDeregister(token, done)();
        });
    });
  });
});
