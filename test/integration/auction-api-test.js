/**
 * @fileOverview Auction endpoint tests.
 */

var app = require('../..');
var request = require('supertest');
var uuid = require('node-uuid');
var common = require('./common');
var moment = require('moment');

var chai = require('chai');
chai.should();
var expect = chai.expect;

var db = require('../../lib/db');
var auctionService = require('../../lib/auction-service')(db);

describe('/api/auction', function () {

  describe('GET /', function () {
    it('should not allow unauthorized users to get current auction', function (done) {
      request(app)
        .get('/api/auction')
        .expect(401, done);
    });

    it('should return nothing if there are no auctions', function (done) {
      common.login(function (err, token) {
        if (err) return done(err);

        request(app)
          .get('/api/auction')
          .set('Authorization', 'JWT ' + token)
          .expect(200)
          .expect({}, common.doneAndDeregister(token, done));
      });
    });
  });

  describe('GET /latest', function () {
    it('should return nothing for latest auction if there are no auctions', function (done) {
      common.login(function (err, token) {
        if (err) return done(err);

        request(app)
          .get('/api/auction/latest')
          .set('Authorization', 'JWT ' + token)
          .expect(200)
          .expect({}, common.doneAndDeregister(token, done));
      });
    });
  });

  describe('GET /{id}', function () {
    it('should not allow unauthorized users to get auction by id', function (done) {
      request(app)
        .get('/api/auction/0')
        .expect(401, done);
    });

    it('should return 404 for unexisting auction id', function (done) {
      common.login(function (err, token) {
        if (err) return done(err);

        request(app)
          .get('/api/auction/0')
          .set('Authorization', 'JWT ' + token)
          .expect(404, common.doneAndDeregister(token, done));
      });
    });
  });
  

  describe('POST /', function () {

    it('should not allow queue auction for unauthorized user', function (done) {
      request(app)
        .post('/api/auction')
        .send({})
        .expect(401, done);
    });

    it('should return 400 if item is not specified', function (done) {
      common.login(function (err, token) {
        if (err) return done(err);

        var data = {
          quantity: 1,
          min_bid: 1
        };
        request(app)
          .post('/api/auction')
          .set('Authorization', 'JWT ' + token)
          .send(data)
          .expect(400, common.doneAndDeregister(token, done));
      });
    });

    it('should return 400 if quantity is not specified', function (done) {
      common.login(function (err, token) {
        if (err) return done(err);

        var data = {
          item: 'bread',
          min_bid: 1
        };
        request(app)
          .post('/api/auction')
          .set('Authorization', 'JWT ' + token)
          .send(data)
          .expect(400, common.doneAndDeregister(token, done));
      });
    });

    it('should return 400 if min_bid is not specified', function (done) {
      common.login(function (err, token) {
        if (err) return done(err);

        var data = {
          item: 'bread',
          quantity: 1
        };
        request(app)
          .post('/api/auction')
          .set('Authorization', 'JWT ' + token)
          .send(data)
          .expect(400, common.doneAndDeregister(token, done));
      });
    });

    it('should be forbidden to sell unexisting item', function (done) {
      common.login(function (err, token) {
        if (err) return done(err);

        var data = {
          item: 'apple',
          quantity: 1,
          min_bid: 1
        };
        request(app)
          .post('/api/auction')
          .set('Authorization', 'JWT ' + token)
          .send(data)
          .expect(403, common.doneAndDeregister(token, done));
      });
    });

    it('should be forbidden to sell more than you have', function (done) {
      common.login(function (err, token) {
        if (err) return done(err);

        var data = {
          item: 'bread',
          quantity: 31,
          min_bid: 1
        };
        request(app)
          .post('/api/auction')
          .set('Authorization', 'JWT ' + token)
          .send(data)
          .expect(403, common.doneAndDeregister(token, done));
      });
    });

    var current_token, current_auction;
    it('should add new auction to the queue', function (done) {
      common.login(function (err, token) {
        if (err) return done(err);

        current_token = token;
        var data = {
          item: 'bread',
          quantity: 10,
          min_bid: 1
        };

        request(app)
          .post('/api/auction')
          .set('Authorization', 'JWT ' + token)
          .send(data)
          .expect(201)
          .end(function (err, res) {
            if (err) return done(err);
            
            var auction = res.body;
            auction.should.have.property('id');

            auction.should.have.property('created');
            var createdMoment = moment(auction.created);
            var nowMoment = moment();
            expect(nowMoment.diff(createdMoment, 's')).to.equal(0);

            auction.should.have.property('seller');
            auction.seller.should.equal(player.id);
            auction.should.have.property('seller_name');
            auction.seller_name.should.equal(player.name);

            auction.should.have.property('start_time');
            expect(auction.start_time).to.be.null;
            auction.should.have.property('end_time');
            expect(auction.end_time).to.be.null;

            auction.should.have.property('item');
            auction.item.should.equal(data.item);
            auction.should.have.property('quantity');
            auction.quantity.should.equal(data.quantity);
            auction.should.have.property('min_bid');
            auction.min_bid.should.equal(data.min_bid);

            auction.should.have.property('bid');
            expect(auction.bid).to.be.null;
            auction.should.have.property('winner');
            expect(auction.winner).to.be.null;
            auction.should.have.property('winner_name');
            expect(auction.winner_name).to.be.null;

            current_auction = auction;

            done();
          });
      });
    }); 

    it('should return auction by id', function (done) {
      request(app)
        .get('/api/auction/' + current_auction.id)
        .set('Authorization', 'JWT ' + current_token)
        .expect(current_auction, done);
    });

    it('should return 404 if delete unexisting auction', function (done) {
      request(app)
        .delete('/api/auction/0')
        .set('Authorization', 'JWT ' + current_token)
        .expect(404, done);
    });

    it('should be forbidden to delete not owned auction', function (done) {
      common.login(function (err, token) {
        if (err) return done(err);

        var data = {
          item: 'carrot',
          quantity: 1,
          min_bid: 1
        };

        request(app)
          .post('/api/auction')
          .set('Authorization', 'JWT ' + token)
          .send(data)
          .expect(201)
          .end(function (err, auction) {
            if (err) return done(err);

            request(app)
              .delete('/api/auction/' + current_auction.id)
              .set('Authorization', 'JWT ' + token)
              .expect(403, common.doneAndDeregister(token, done));
          });
      });
    });

    it('should delete auction by id', function (done) {
      request(app)
        .delete('/api/auction/' + current_auction.id)
        .set('Authorization', 'JWT ' + current_token)
        .expect(200, common.doneAndDeregister(current_token, done));
    });

    it('should not allow bet if there are no active auctions', function (done) {
      common.login(function (err, token) {
        if (err) return done(err);

        request(app)
          .post('/api/auction/bet')
          .set('Authorization', 'JWT ' + token)
          .send({bid: 20})
          .expect(404, common.doneAndDeregister(token, done));
      });
    });

    var auctionDuration = 3;
    var current_player;
    it('should start auction', function (done) {
      common.login(function (err, token) {
        if (err) return done(err);

        current_token = token;
        var data = {
          item: 'bread',
          quantity: 10,
          min_bid: 5
        };

        request(app)
          .post('/api/auction')
          .set('Authorization', 'JWT ' + token)
          .send(data)
          .expect(201)
          .end(function (err) {
            if (err) return done(err);

            request(app)
              .get('/api/player')
              .set('Authorization', 'JWT ' + token)
              .expect(200)
              .end(function (err, res) {
                if (err) return done(err);

                current_player = res.body;
                auctionService.startAuction(auctionDuration, done);
              });
          });
        });
      });

    it('should get current auction', function (done) {
      common.login(function (err, token) {
        if (err) return done(err);

        request(app)
          .get('/api/auction')
          .set('Authorization', 'JWT ' + token)
          .expect(200)
          .end(function (err, res) {
            if (err) return done(err);
            
            current_auction = res.body;

            current_auction.should.have.property('seller');
            current_auction.seller.should.equal(current_player.id);
            current_auction.should.have.property('seller_name');
            current_auction.seller_name.should.equal(current_player.name);

            var nowMoment = moment();
            var startMoment = moment(current_auction.start_time);
            var endMoment = moment(current_auction.end_time);
            expect(nowMoment.diff(startMoment, 's')).to.equal(0);
            expect(endMoment.diff(startMoment, 's')).to.equal(auctionDuration);

            current_auction.should.have.property('timeLeft');
            expect(Math.abs(current_auction.timeLeft - auctionDuration) <= 1).to.be.true;

            common.doneAndDeregister(token, done)();
          });
      });
    });

    it('should queue new auction if the queue is not empty', function (done) {
      common.login(function (err, token) {
        if (err) return done(err);

        var data = {
          item: 'carrot',
          quantity: 5,
          min_bid: 1
        };

        request(app)
          .post('/api/auction')
          .set('Authorization', 'JWT ' + token)
          .send(data)
          .expect(202, common.doneAndDeregister(token, done));
      });
    });

    it('should not allow bet for your own auction', function (done) {
      request(app)
        .post('/api/auction/bet')
        .set('Authorization', 'JWT ' + current_token)
        .send({bid: 20})
        .expect(403, done);
    });

    it('should not allow bet if not enough coins', function (done) {
      common.login(function (err, token) {
        if (err) return done(err);

        request(app)
          .post('/api/auction/bet')
          .set('Authorization', 'JWT ' + token)
          .send({bid: 2000})
          .expect(403, common.doneAndDeregister(token, done));
      });
    });

    it('should not allow bet less than minimum bid', function (done) {
      common.login(function (err, token) {
        if (err) return done(err);

        request(app)
          .post('/api/auction/bet')
          .set('Authorization', 'JWT ' + token)
          .send({bid: current_auction.min_bid - 1})
          .expect(403, common.doneAndDeregister(token, done));
      });
    });

    it('should accept bid', function (done) {
      common.login(function (err, token) {
        if (err) return done(err);

        request(app)
          .get('/api/player')
          .set('Authorization', 'JWT ' + token)
          .expect(200)
          .end(function (err, res) {
            if (err) return done(err);

            var player = res.body;
            var bid = current_auction.min_bid + 1;
            request(app)
              .post('/api/auction/bet')
              .set('Authorization', 'JWT ' + token)
              .send({bid: bid})
              .expect(200)
              .end(function (err, res) {
                if (err) return done(err);
                
                var auction = res.body;
                auction.bid.should.equal(bid);
                auction.winner.should.equal(player.id);
                auction.winner_name.should.equal(player.name);
                current_auction = auction;

                common.doneAndDeregister(token, done)();
              });
          });
      });
    });

    it('should not allow bid less than last bid', function (done) {
      common.login(function (err, token) {
        if (err) return done(err);

        var bid = current_auction.min_bid - 1;
        request(app)
          .post('/api/auction/bet')
          .set('Authorization', 'JWT ' + token)
          .send({bid: bid})
          .expect(403, common.doneAndDeregister(token, done));
      });
    });

    it('should accept another bid and extend auction time to 10s minimum', function (done) {
      common.login(function (err, token) {
        if (err) return done(err);

        request(app)
          .get('/api/player')
          .set('Authorization', 'JWT ' + token)
          .expect(200)
          .end(function (err, res) {
            if (err) return done(err);

            var player = res.body;
            var bid = current_auction.min_bid + 1;
            request(app)
              .post('/api/auction/bet')
              .set('Authorization', 'JWT ' + token)
              .send({bid: bid})
              .expect(200)
              .end(function (err, res) {
                if (err) return done(err);
                
                var auction = res.body;
                auction.bid.should.equal(bid);
                auction.winner.should.equal(player.id);
                auction.winner_name.should.equal(player.name);

                var nowMoment = moment();
                var endMoment = moment(auction.end_time);
                expect(Math.abs(endMoment.diff(nowMoment, 's') - 10) <= 1).to.be.true;

                current_auction = auction;

                common.doneAndDeregister(token, done)();
              });
          });
      });
    });

    it('should not expire in less than 10 seconds after the latest bid', function (done) {
      this.timeout(10 * 1000);

      common.login(function (err, token) {
        if (err) return done(err);

        // wait 9 seconds, auction should still be active
        setTimeout(function () {
          request(app)
            .get('/api/auction')
            .set('Authorization', 'JWT ' + token)
            .expect(current_auction, common.doneAndDeregister(token, done));
        }, 9 * 1000);
      });
    });

    it('should not get current auction if it is expired', function (done) {
      this.timeout(3 * 1000);

      common.login(function (err, token) {
        if (err) return done(err);

        // wait until auction expire
        setTimeout(function () {
          request(app)
            .get('/api/auction')
            .set('Authorization', 'JWT ' + token)
            .expect({}, common.doneAndDeregister(token, done));
        }, 2 * 1000);
      });
    });

    it('should return the auction as latest after expiration', function (done) {
      common.login(function (err, token) {
        if (err) return done(err);

        request(app)
          .get('/api/auction/latest')
          .set('Authorization', 'JWT ' + token)
          .expect(current_auction, common.doneAndDeregister(token, done));
      });
    });

    it('should not allow delete already started auction', function (done) {
      request(app)
        .delete('/api/auction/' + current_auction.id)
        .set('Authorization', 'JWT ' + current_token)
        .expect(403, common.doneAndDeregister(current_token, done));
    });
  });
});
