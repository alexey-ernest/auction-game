var app = require('..');
var request = require('supertest');

var chai = require('chai');
chai.should();
var expect = chai.expect;

var uuid = require('node-uuid');

var auctionService = require('../lib/auction-service');

/**
 * Helper function for loggin and preserving authentication cookie.
 *
 * @method     login
 * @param      {Function}  fn      Callback: function (err, agent, player) {}
 */
function login(name, fn) {
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
}

/**
 * Wrapper for standard done callback to deregister current player.
 *
 * @method     doneAndDeregister
 * @param      {string}    token   JWT token.
 * @param      {Function}  done    Done callback.
 * @return     {Function}  Callback function.
 */
function doneAndDeregister(token, done) {
  return function (err) {
    if (err) return done(err);
    request(app)
      .delete('/api/player')
      .set('Authorization', 'JWT ' + token)
      .expect(200, done);
  };
}

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
        doneAndDeregister(res.body.token, done)();
      });
  });

  it('should logs out if somebody else logs in with the same name', function (done) {
    login(function (err, token1) {
      if (err) return done(err);

      request(app)
        .get('/api/player')
        .set('Authorization', 'JWT ' + token1)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          var player = res.body;

          // login with the same name
          login(player.name, function (err, token2) {
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
                  .expect(401, doneAndDeregister(token2, done));
              });
          });
        });
    });
  });
});


// /**
//  * Logout endpoint tests.
//  */
// describe('/api/logout', function () {
//   it('should not allow unauthorized user to logout', function (done) {
//     request(app)
//       .delete('/api/logout')
//       .expect(401, done);
//   });

//   var current_player;
//   it('should logout', function (done) {
//     login(function (err, agent, player) {
//       if (err) return done(err);

//       current_player = player;
//       agent
//         .delete('/api/logout')
//         .expect(200, done);
//     });
//   });

//   it('should login again with the same name', function (done) {
//     login(current_player.name, function (err, agent) {
//       doneAndDeregister(agent, done)(err);
//     });
//   });
// });

// /**
//  * Player endpoint tests.
//  */
// describe('/api/player', function () {
//   it('should not get player info for unauthorized user', function (done) {
//     request(app)
//       .get('/api/player')
//       .expect(401, done);
//   });

//   it('should get player info for authorized user', function (done) {
//     login(function (err, agent, player) {
//       if (err) return done(err);
//       agent
//         .get('/api/player')
//         .expect(player, doneAndDeregister(agent, done));
//     });
//   });
// });

// /**
//  * Inventory endpoint tests.
//  */
// describe('/api/inventory', function () {
//   it('should not allow unauthorized user to get inventory', function (done) {
//     request(app)
//       .get('/api/inventory')
//       .expect(401, done);
//   });

//   it('should return default inventory items for new player', function (done) {
//     login(function (err, agent) {
//       if (err) return done(err);
//       agent
//         .get('/api/inventory')
//         .set('Accept', 'application/json')
//         .expect('Content-Type', /json/)
//         .expect(200)
//         .end(function (err, res) {
//           if (err) return done(err);

//           var items = res.body;
//           items.should.have.length(3);
          
//           // breads
//           var bread = items.filter(function (i) {
//             return i.item === 'bread';
//           });
//           bread.should.have.length(1);
//           bread = bread[0];
//           bread.should.have.property('quantity');
//           bread.quantity.should.equal(30);

//           // carrots
//           var carrot = items.filter(function (i) {
//             return i.item === 'carrot';
//           });
//           carrot.should.have.length(1);
//           carrot = carrot[0];
//           carrot.should.have.property('quantity');
//           carrot.quantity.should.equal(18);

//           // diamonds
//           var diamond = items.filter(function (i) {
//             return i.item === 'diamond';
//           });
//           diamond.should.have.length(1);
//           diamond = diamond[0];
//           diamond.should.have.property('quantity');
//           diamond.quantity.should.equal(1);

//           doneAndDeregister(agent, done)();
//         });
//     });
//   });
// });

// /**
//  * Auction endpoint tests.
//  */
// describe('/api/auction', function () {
//   it('should not allow unauthorized users to get current auction', function (done) {
//     request(app)
//       .get('/api/auction')
//       .expect(401, done);
//   });

//   it('should return empty JSON if there are no auctions', function (done) {
//     login(function (err, agent) {
//       if (err) return done(err);

//       agent
//         .get('/api/auction')
//         .expect({}, doneAndDeregister(agent, done));
//     });
//   });

//   it('should return empty JSON for latest auction if there are no auctions', function (done) {
//     login(function (err, agent) {
//       if (err) return done(err);

//       agent
//         .get('/api/auction/latest')
//         .expect({}, doneAndDeregister(agent, done));
//     });
//   });

//   it('should not allow unauthorized users to get auction by id', function (done) {
//     request(app)
//       .get('/api/auction/0')
//       .expect(401, done);
//   });

//   it('should return 404 for unexisting auction id', function (done) {
//     login(function (err, agent) {
//       if (err) return done(err);

//       agent
//         .get('/api/auction/0')
//         .expect(404, doneAndDeregister(agent, done));
//     });
//   });

//   it('should not allow queue auction for unauthorized user', function (done) {
//     request(app)
//       .post('/api/auction')
//       .send({})
//       .expect(401, done);
//   });

//   it('should return 400 if item is not specified', function (done) {
//     login(function (err, agent) {
//       if (err) return done(err);

//       var data = {
//         quantity: 1,
//         min_bid: 1
//       };
//       agent
//         .post('/api/auction')
//         .send(data)
//         .expect(400, doneAndDeregister(agent, done));
//     });
//   });

//   it('should return 400 if quantity is not specified', function (done) {
//     login(function (err, agent) {
//       if (err) return done(err);

//       var data = {
//         item: 'bread',
//         min_bid: 1
//       };
//       agent
//         .post('/api/auction')
//         .send(data)
//         .expect(400, doneAndDeregister(agent, done));
//     });
//   });

//   it('should return 400 if min_bid is not specified', function (done) {
//     login(function (err, agent) {
//       if (err) return done(err);

//       var data = {
//         item: 'bread',
//         quantity: 1
//       };
//       agent
//         .post('/api/auction')
//         .send(data)
//         .expect(400, doneAndDeregister(agent, done));
//     });
//   });

//   it('should be forbidden to sell unexisting item', function (done) {
//     login(function (err, agent) {
//       if (err) return done(err);

//       var data = {
//         item: 'apple',
//         quantity: 1,
//         min_bid: 1
//       };
//       agent
//         .post('/api/auction')
//         .send(data)
//         .expect(403, doneAndDeregister(agent, done));
//     });
//   });

//   it('should be forbidden to sell more than you have', function (done) {
//     login(function (err, agent) {
//       if (err) return done(err);

//       var data = {
//         item: 'bread',
//         quantity: 31,
//         min_bid: 1
//       };
//       agent
//         .post('/api/auction')
//         .send(data)
//         .expect(403, doneAndDeregister(agent, done));
//     });
//   });

//   var current_agent, current_auction;
//   it('should add new auction to the queue', function (done) {
//     login(function (err, agent, player) {
//       if (err) return done(err);

//       current_agent = agent;
//       var data = {
//         item: 'bread',
//         quantity: 10,
//         min_bid: 1
//       };
//       agent
//         .post('/api/auction')
//         .send(data)
//         .expect(201)
//         .end(function (err, res) {
//           if (err) return done(err);
          
//           var auction = res.body;

//           auction.should.have.property('id');
//           auction.should.have.property('created');

//           auction.should.have.property('seller');
//           auction.seller.should.equal(player.id);
//           auction.should.have.property('seller_name');
//           auction.seller_name.should.equal(player.name);

//           auction.should.have.property('start_time');
//           expect(auction.start_time).to.be.null;
//           auction.should.have.property('end_time');
//           expect(auction.end_time).to.be.null;

//           auction.should.have.property('item');
//           auction.item.should.equal(data.item);
//           auction.should.have.property('quantity');
//           auction.quantity.should.equal(data.quantity);
//           auction.should.have.property('min_bid');
//           auction.min_bid.should.equal(data.min_bid);

//           auction.should.have.property('bid');
//           expect(auction.bid).to.be.null;
//           auction.should.have.property('winner');
//           expect(auction.winner).to.be.null;
//           auction.should.have.property('winner_name');
//           expect(auction.winner_name).to.be.null;

//           current_auction = auction;
//           done();
//         });
//     });
//   }); 

//   it('should return auction by id', function (done) {
//     current_agent
//       .get('/api/auction/' + current_auction.id)
//       .expect(current_auction, done);
//   });

//   it('should return 404 if delete unexisting auction', function (done) {
//     current_agent
//       .delete('/api/auction/0')
//       .expect(404, done);
//   });

//   it('should be forbidden to delete not owned auction', function (done) {
//     login(function (err, agent) {
//       if (err) return done(err);

//       var data = {
//         item: 'carrot',
//         quantity: 1,
//         min_bid: 1
//       };
//       agent
//         .post('/api/auction')
//         .send(data)
//         .expect(201)
//         .end(function (err, auction) {
//           if (err) return done(err);
//           agent
//             .delete('/api/auction/' + current_auction.id)
//             .expect(403, doneAndDeregister(agent, done));
//         });
//     });
//   });

//   it('should delete auction by id', function (done) {
//     current_agent
//       .delete('/api/auction/' + current_auction.id)
//       .expect(200, doneAndDeregister(current_agent, done));
//   });

//   it('should not allow bet if there are no active auctions', function (done) {
//     login(function (err, agent) {
//       if (err) return done(err);
//       agent
//         .post('/api/auction/bet')
//         .send({bid: 20})
//         .expect(404, doneAndDeregister(agent, done));
//     });
//   });

//   it('should start auction', function (done) {
//     login(function (err, agent, player) {
//       if (err) return done(err);

//       current_agent = agent;
//       var data = {
//         item: 'bread',
//         quantity: 10,
//         min_bid: 5
//       };
//       agent
//         .post('/api/auction')
//         .send(data)
//         .expect(201)
//         .end(function (err) {
//           if (err) return done(err);

//           auctionService.startAuction(3, function (err, auction) {
//             if (err) return done(err);
//             current_player = player;
//             done();
//           });
//         });
//       });
//     });

//   it('should get current auction', function (done) {
//     login(function (err, agent) {
//       if (err) return done(err);
//       agent
//         .get('/api/auction')
//         .expect(200)
//         .end(function (err, res) {
//           if (err) return done(err);
          
//           current_auction = res.body;
//           current_auction.should.have.property('seller');
//           current_auction.seller.should.equal(current_player.id);
//           current_auction.should.have.property('seller_name');
//           current_auction.seller_name.should.equal(current_player.name);

//           doneAndDeregister(agent, done)();
//         });
//     });
//   });

//   it('should queue new auction if the queue is not empty', function (done) {
//     login(function (err, agent) {
//       if (err) return done(err);

//       var data = {
//         item: 'carrot',
//         quantity: 5,
//         min_bid: 1
//       };
//       agent
//         .post('/api/auction')
//         .send(data)
//         .expect(202, doneAndDeregister(agent, done));
//     });
//   });

//   it('should not allow bet for your own auction', function (done) {
//     current_agent
//       .post('/api/auction/bet')
//       .send({bid: 20})
//       .expect(403, done);
//   });

//   it('should not allow bet if not enough coins', function (done) {
//     login(function (err, agent) {
//       if (err) return done(err);

//       agent
//         .post('/api/auction/bet')
//         .send({bid: 2000})
//         .expect(403, doneAndDeregister(agent, done));
//     });
//   });

//   it('should not allow bet less than minimum bid', function (done) {
//     login(function (err, agent) {
//       if (err) return done(err);

//       agent
//         .post('/api/auction/bet')
//         .send({bid: current_auction.min_bid - 1})
//         .expect(403, doneAndDeregister(agent, done));
//     });
//   });

//   it('should accept bid', function (done) {
//     login(function (err, agent, player) {
//       if (err) return done(err);

//       var bid = current_auction.min_bid + 1;
//       agent
//         .post('/api/auction/bet')
//         .send({bid: bid})
//         .expect(200)
//         .end(function (err, res) {
//           if (err) return done(err);
          
//           var auction = res.body;
//           auction.bid.should.equal(bid);
//           auction.winner.should.equal(player.id);
//           auction.winner_name.should.equal(player.name);
//           current_auction = auction;

//           doneAndDeregister(agent, done)();
//         });
//     });
//   });

//   it('should not allow bid less than last bid', function (done) {
//     login(function (err, agent, player) {
//       if (err) return done(err);

//       var bid = current_auction.min_bid - 1;
//       agent
//         .post('/api/auction/bet')
//         .send({bid: bid})
//         .expect(403, doneAndDeregister(agent, done));
//     });
//   });

//   it('should accept another bid and extend auction time to 10s minimum', function (done) {
//     login(function (err, agent, player) {
//       if (err) return done(err);

//       var bid = current_auction.min_bid + 1;
//       agent
//         .post('/api/auction/bet')
//         .send({bid: bid})
//         .expect(200)
//         .end(function (err, res) {
//           if (err) return done(err);
          
//           var auction = res.body;
//           auction.bid.should.equal(bid);
//           auction.winner.should.equal(player.id);
//           auction.winner_name.should.equal(player.name);
//           current_auction = auction;

//           doneAndDeregister(agent, done)();
//         });
//     });
//   });

//   it('should not expire in less than 10 seconds after the latest bid', function (done) {
//     this.timeout(10 * 1000);

//     login(function (err, agent) {
//       if (err) return done(err);

//       // wait 9 seconds, auction should still be active
//       setTimeout(function () {
//         agent
//           .get('/api/auction')
//           .expect(current_auction, doneAndDeregister(agent, done));
//       }, 9 * 1000);
//     });
//   });

//   it('should not get auction if it is expired', function (done) {
//     this.timeout(3 * 1000);

//     login(function (err, agent) {
//       if (err) return done(err);

//       // wait until auction expire
//       setTimeout(function () {
//         agent
//           .get('/api/auction')
//           .expect({}, doneAndDeregister(agent, done));
//       }, 2 * 1000);
//     });
//   });

//   it('should return the auction as latest after expiration', function (done) {
//     login(function (err, agent) {
//       if (err) return done(err);
//       agent
//         .get('/api/auction/latest')
//         .expect(current_auction, doneAndDeregister(agent, done));
//     });
//   });

//   it('should not allow delete already started auction', function (done) {
//     current_agent
//       .delete('/api/auction/' + current_auction.id)
//       .expect(403, doneAndDeregister(current_agent, done));
//   });  
// });
