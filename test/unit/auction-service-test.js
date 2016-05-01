/**
 * @fileOverview auction-service.js module tests.
 */

var uuid = require('node-uuid');
var moment = require('moment');
var auctionService = require('../../lib/auction-service');

var sinon = require('sinon');
var chai = require('chai');
chai.should();
var expect = chai.expect;

describe("auction-service", function() {

  it('should have #initPlayer', function () {
    var service = auctionService({});

    service.should.have.property('initPlayer');
    service.initPlayer.should.be.a('function');
  });

  describe('#initPlayer', function () {
    it('should create player with 1000 coins', function () {
      // arrange
      function Player(obj) {
        var key;
        for (key in obj) {
          if (obj.hasOwnProperty(key)) {
            this[key] = obj[key];
          }
        }
      }

      var db = {
        Player: Player
      };
      var service = auctionService(db);
      
      // act
      var name = uuid.v4();
      var player = service.initPlayer(name);

      // assert
      expect(player).to.be.an.instanceof(Player);
      player.name.should.equal(name);
      player.coins.should.equal(1000);
    });
  });

  it('should have #initInventory', function () {
    var service = auctionService({});

    service.should.have.property('initInventory');
    service.initInventory.should.be.a('function');
  });

  describe('#initInventory', function () {
    it('should create default inventory', function () {
      // arrange
      function Inventory(obj) {
        var key;
        for (key in obj) {
          if (obj.hasOwnProperty(key)) {
            this[key] = obj[key];
          }
        }
      }

      var db = {
        Inventory: Inventory
      };
      var service = auctionService(db);
      
      // act
      var playerId = 5;
      var inventory = service.initInventory(playerId);

      // assert
      expect(inventory).to.be.an.instanceof(Array);
      inventory.should.have.length(3);

      var i;
      for (i = 0; i < inventory.length; i++) {
        var item = inventory[i];
        expect(item).to.be.an.instanceof(Inventory);

        item.should.have.property('player_id');
        item.player_id.should.equal(playerId);
        item.should.have.property('item');
        item.should.have.property('quantity');

        switch (item.item) {
          case 'bread':
            item.quantity.should.equal(30);
            break;
          case 'carrot':
            item.quantity.should.equal(18);
            break;
          case 'diamond':
            item.quantity.should.equal(1);
            break;
          default:
            item.item.should.equal('restricted value');
        }
      }
    });
  });

  it('should have #queueAuction', function () {
    var service = auctionService({});

    service.should.have.property('queueAuction');
    service.queueAuction.should.be.a('function');
  });

  describe('#queueAuction', function () {
    it('should not allow queue auction without item specified', function (done) {
      // arrange
      var service = auctionService({});

      var auction = {
        quantity: 1,
        min_bid: 10
      };

      // act
      service.queueAuction({}, auction, function (err, result) {
        if (err) return done(err);

        // assert
        result.should.have.property('ok');
        result.ok.should.be.false;

        done();
      });
    });

    it('should not allow queue auction without quantity specified', function (done) {
      // arrange
      var service = auctionService({});

      var auction = {
        item: 'bread',
        min_bid: 10
      };

      // act
      service.queueAuction({}, auction, function (err, result) {
        if (err) return done(err);

        // assert
        result.should.have.property('ok');
        result.ok.should.be.false;

        done();
      });
    });

    it('should not allow queue auction without min_bid specified', function (done) {
      var service = auctionService({});

      var auction = {
        item: 'bread',
        quantity: 1
      };
      service.queueAuction({}, auction, function (err, result) {
        if (err) return done(err);
        result.should.have.property('ok');
        result.ok.should.be.false;

        done();
      });
    });

    it('should not allow queue auction if player does not have inventory', function (done) {
      // arrange
      var db = {
        Inventory: {
          getPlayerItems: function (playerId, fn) {
            fn(null, []);
          }
        }
      };
      var service = auctionService(db);

      var auction = {
        item: 'bread',
        quantity: 1,
        min_bid: 1
      };

      // act
      service.queueAuction({}, auction, function (err, result) {
        if (err) return done(err);

        // assert
        result.should.have.property('ok');
        result.ok.should.be.false;

        done();
      });
    });

    it('should not allow queue auction if player does not have enough items', function (done) {
      // arrange
      var db = {
        Inventory: {
          getPlayerItems: function (playerId, fn) {
            fn(null, [{item: 'bread', quantity: 4}]);
          }
        }
      };
      var service = auctionService(db);

      var auction = {
        item: 'bread',
        quantity: 5,
        min_bid: 1
      };

      // act
      service.queueAuction({}, auction, function (err, result) {
        if (err) return done(err);

        // assert
        result.should.have.property('ok');
        result.ok.should.be.false;

        done();
      });
    });

    it('should set seller', function (done) {
      // arrange
      function Auction(obj) {
        var key;
        for (key in obj) {
          if (obj.hasOwnProperty(key)) {
            this[key] = obj[key];
          }
        }
      }

      Auction.getCurrent = function (fn) {
        fn();
      };

      Auction.prototype.save = function (fn) {
        fn();
      };
      var saveSpy = sinon.spy(Auction.prototype, "save");


      var db = {
        Inventory: {
          getPlayerItems: function (playerId, fn) {
            fn(null, [{item: 'bread', quantity: 5}]);
          }
        },
        Auction: Auction
      };

      var service = auctionService(db);

      var player = {
        id: 5,
        name: 'player'
      };
      var auction = {
        item: 'bread',
        quantity: 5,
        min_bid: 1
      };

      // act
      service.queueAuction(player, auction, function (err, result) {
        if (err) return done(err);
        
        // assert
        saveSpy.callCount.should.equal(1);
        result.should.have.property('ok');
        result.ok.should.be.true;
        expect(result.current_auction).to.not.exist;

        result.should.have.property('auction');
        expect(result.auction).to.be.an.instanceof(Auction);
        result.auction.seller.should.equal(player.id);
        result.auction.seller_name.should.equal(player.name);

        done();
      });
    });
  });

  it('should have #startAuction', function () {
    var service = auctionService({});

    service.should.have.property('startAuction');
    service.startAuction.should.be.a('function');
  });

  describe('#startAuction', function () {
    it('should not start auction if there is no one', function (done) {
      // arrange
      var db = {
        Auction: {
          getNext: function (fn) {
            fn();
          }
        }
      };

      var service = auctionService(db);

      // act
      service.startAuction(function (err, result) {
        if (err) return done(err);

        // assert
        result.should.have.property('ok');
        result.ok.should.be.false;

        done();
      });
    });

    it('should not start auction if seller does not have inventory', function (done) {
      // arrange
      function Auction() {
      }

      Auction.prototype.save = function (fn) {
        fn();
      };
      var saveSpy = sinon.spy(Auction.prototype, "save");

      var auction = new Auction();
      auction.seller = 5;
      auction.item = 'bread';
      auction.quantity = 10;

      Auction.getNext = function (fn) {
        fn(null, auction);
      };

      Auction.get = function (id, fn) {
        fn(null, auction);
      };

      var db = {
        Auction: Auction,
        Inventory: {
          getPlayerItems: function (id, fn) {
            fn(null, []);
          }
        }
      };

      var service = auctionService(db);

      // act
      service.startAuction(function (err, result) {
        if (err) return done(err);

        // assert
        saveSpy.callCount.should.equal(1);
        result.should.have.property('ok');
        result.ok.should.be.false;

        result.should.have.property('auction');
        expect(result.auction).to.be.an.instanceof(Auction);
        result.auction.should.have.property('start_time');
        result.auction.should.have.property('end_time');
        result.auction.start_time.should.equal(result.auction.end_time); // immediately ended

        done();
      });
    });

    it('should not start auction if seller does not have enough items', function (done) {
      // arrange
      function Auction() {
      }

      Auction.prototype.save = function (fn) {
        fn();
      };
      var saveSpy = sinon.spy(Auction.prototype, "save");

      var auction = new Auction();
      auction.seller = 5;
      auction.item = 'bread';
      auction.quantity = 10;

      Auction.getNext = function (fn) {
        fn(null, auction);
      };

      Auction.get = function (id, fn) {
        fn(null, auction);
      };

      var db = {
        Auction: Auction,
        Inventory: {
          getPlayerItems: function (id, fn) {
            fn(null, [{item: 'bread', quantity: 9}]);
          }
        }
      };

      var service = auctionService(db);

      // act
      service.startAuction(function (err, result) {
        if (err) return done(err);

        // assert
        saveSpy.callCount.should.equal(1);
        result.should.have.property('ok');
        result.ok.should.be.false;

        result.should.have.property('auction');
        expect(result.auction).to.be.an.instanceof(Auction);
        result.auction.should.have.property('start_time');
        result.auction.should.have.property('end_time');
        result.auction.start_time.should.equal(result.auction.end_time); // immediately ended

        done();
      });
    });

    it('should start auction for 90s', function (done) {
      // arrange
      function Auction() {
      }

      Auction.prototype.save = function (fn) {
        fn();
      };
      var saveSpy = sinon.spy(Auction.prototype, "save");

      var auction = new Auction();
      auction.seller = 5;
      auction.item = 'bread';
      auction.quantity = 10;

      Auction.getNext = function (fn) {
        fn(null, auction);
      };

      Auction.get = function (id, fn) {
        fn(null, auction);
      };

      var db = {
        Auction: Auction,
        Inventory: {
          getPlayerItems: function (id, fn) {
            fn(null, [{item: 'bread', quantity: 20}]);
          }
        }
      };

      var service = auctionService(db);

      // act
      service.startAuction(function (err, result) {
        if (err) return done(err);

        // assert
        saveSpy.callCount.should.equal(1);
        result.should.have.property('ok');
        result.ok.should.be.true;

        result.should.have.property('auction');
        expect(result.auction).to.be.an.instanceof(Auction);
        result.auction.should.have.property('start_time');
        result.auction.should.have.property('end_time');
        
        moment(result.auction.end_time).diff(moment(result.auction.start_time), 's').should.equal(90);

        done();
      });
    });
  });

  it('should have #bet', function () {
    var service = auctionService({});

    service.should.have.property('bet');
    service.bet.should.be.a('function');
  });

  describe('#bet', function () {
    it('bid should be greater than 0', function (done) {
      // arrange
      var service = auctionService({});

      // act
      service.bet({}, -1, function (err, result) {
        if (err) return done(err);

        // assert
        result.should.have.property('ok');
        result.ok.should.be.false;

        done();
      });
    });

    it('should not allow if there is no active auctions', function (done) {
      // arrange
      var db = {
        Auction: {
          getCurrent: function (fn) {
            fn();
          }
        } 
      };
      var service = auctionService(db);

      // act
      service.bet({}, 10, function (err, result) {
        if (err) return done(err);

        // assert
        result.should.have.property('ok');
        result.ok.should.be.false;

        done();
      });
    });

    it('should not allow bet for your own auction', function (done) {
      // arrange
      var player = {
        id: 5
      };
      var db = {
        Auction: {
          getCurrent: function (fn) {
            fn(null, {seller: player.id});
          }
        } 
      };
      var service = auctionService(db);

      // act
      service.bet(player, 10, function (err, result) {
        if (err) return done(err);

        // assert
        result.should.have.property('ok');
        result.ok.should.be.false;

        done();
      });
    });

    it('should not allow bet if not enough money', function (done) {
      // arrange
      var player = {
        id: 5,
        coins: 50
      };
      var db = {
        Auction: {
          getCurrent: function (fn) {
            fn(null, {seller: player.id + 1});
          }
        } 
      };
      var service = auctionService(db);

      // act
      service.bet(player, 51, function (err, result) {
        if (err) return done(err);

        // assert
        result.should.have.property('ok');
        result.ok.should.be.false;

        done();
      });
    });

    it('should not allow bet less than minimum bid', function (done) {
      // arrange
      var player = {
        id: 5,
        coins: 50
      };
      var db = {
        Auction: {
          getCurrent: function (fn) {
            fn(null, {seller: player.id + 1, min_bid: 10, bid: 11});
          }
        } 
      };
      var service = auctionService(db);

      // act
      service.bet(player, 10, function (err, result) {
        if (err) return done(err);

        // assert
        result.should.have.property('ok');
        result.ok.should.be.false;

        done();
      });
    });

    it('should update auction', function (done) {
      // arrange
      function Auction() {
      }

      Auction.prototype.save = function (fn) {
        fn();
      };
      var saveSpy = sinon.spy(Auction.prototype, "save");

      var player = {
        id: 5,
        name: uuid.v4(),
        coins: 50
      };

      var auction = new Auction();
      auction.seller = player.id + 1;
      auction.item = 'bread';
      auction.quantity = 10;
      auction.min_bid = 10;
      auction.bid = 11;

      Auction.getNext = function (fn) {
        fn(null, auction);
      };

      Auction.get = function (id, fn) {
        fn(null, auction);
      };

      Auction.getCurrent = function (fn) {
        fn(null, auction);
      };

      var db = {
        Auction: Auction
      };
      
      var service = auctionService(db);

      // act
      var newBid = auction.bid + 1;
      service.bet(player, newBid, function (err, result) {
        if (err) return done(err);

        // assert
        saveSpy.callCount.should.equal(1);
        result.should.have.property('ok');
        result.ok.should.be.true;

        result.should.have.property('auction');
        expect(result.auction).to.be.an.instanceof(Auction);

        result.auction.bid.should.equal(newBid);
        result.auction.winner.should.equal(player.id);
        result.auction.winner_name.should.equal(player.name);

        done();
      });
    });

    it('should extend auction to 10 seconds', function (done) {
      // arrange
      function Auction() {
      }

      Auction.prototype.save = function (fn) {
        fn();
      };
      var saveSpy = sinon.spy(Auction.prototype, "save");

      var player = {
        id: 5,
        name: uuid.v4(),
        coins: 50
      };

      var auction = new Auction();
      auction.seller = player.id + 1;
      auction.item = 'bread';
      auction.quantity = 10;
      auction.min_bid = 10;
      auction.bid = 11;

      var now = moment();
      auction.start_time = now.toISOString();
      auction.end_time = now.add(5, 's').toISOString();

      Auction.getNext = function (fn) {
        fn(null, auction);
      };

      Auction.get = function (id, fn) {
        fn(null, auction);
      };

      Auction.getCurrent = function (fn) {
        fn(null, auction);
      };

      var db = {
        Auction: Auction
      };
      
      var service = auctionService(db);

      // act
      var newBid = auction.bid + 1;
      service.bet(player, newBid, function (err, result) {
        if (err) return done(err);

        // assert
        saveSpy.callCount.should.equal(1);
        result.should.have.property('ok');
        result.ok.should.be.true;

        result.should.have.property('auction');        
        moment(result.auction.end_time).diff(moment(result.auction.start_time), 's').should.equal(10);

        done();
      });
    });
  });

  it('should have #processAuction', function () {
    var service = auctionService({});

    service.should.have.property('processAuction');
    service.processAuction.should.be.a('function');
  });

  describe('#processAuction', function () {
    it('should do nothing if auction is already done', function (done) {
      // arrange
      var service = auctionService({});
      var auction = {
        done: true
      };

      // act
      service.processAuction(auction, function (err) {
        if (err) return done(err);

        // assert
        expect(auction).to.deep.equal({done: true});

        done();
      });
    });

    it('should set done=true and save auction if there is no winner', function (done) {
      // arrange
      var service = auctionService({});
      var auction = {
        save: function (fn) {
          fn();
        }
      };
      var saveSpy = sinon.spy(auction, "save");

      // act
      service.processAuction(auction, function (err) {
        if (err) return done(err);

        // assert
        saveSpy.callCount.should.equal(1);
        auction.should.have.property('done');
        auction.done.should.be.true;

        done();
      });
    });

    it('should exchange coins and inventory', function (done) {
      // arrange
      
      // Player
      function Player () {
      }

      Player.prototype.save = function (fn) {
        fn();
      };
      var saveSpy = sinon.spy(Player.prototype, "save");

      var initialSellerCoins = 5;
      var seller = new Player();
      seller.id = 5;
      seller.coins = initialSellerCoins;

      var initialWinnerCoins = 10;
      var winner = new Player();
      winner.id = 6;
      winner.coins = initialWinnerCoins;

      Player.get = function (id, fn) {
        if (id === seller.id) return fn(null, seller);
        fn(null, winner);
      };

      // Inventory
      function Inventory() {
      }

      var sellerInventory = {};
      var winnerInventory = {};
      Inventory.updatePlayerItem = function (player_id, item, quantity, fn) {
        if (player_id === seller.id) {
          sellerInventory.item = item;
          sellerInventory.quantity = quantity;
        } else if (player_id === winner.id) {
          winnerInventory.item = item;
          winnerInventory.quantity = quantity;
        }

        fn();
      };
      var updatePlayerItemSpy = sinon.spy(Inventory, "updatePlayerItem");


      var db = {
        Player: Player,
        Inventory: Inventory
      };

      var service = auctionService(db);

      var auction = {
        seller: seller.id,
        winner: winner.id,
        bid: 3,
        item: 'bread',
        quantity: 25,
        save: function (fn) {
          fn();
        }
      };

      // act
      service.processAuction(auction, function (err) {
        if (err) return done(err);

        // assert
        auction.should.have.property('done');
        auction.done.should.be.true;

        saveSpy.callCount.should.equal(2);
        seller.coins.should.equal(initialSellerCoins + auction.bid);
        winner.coins.should.equal(initialWinnerCoins - auction.bid);

        updatePlayerItemSpy.callCount.should.equal(2);
        sellerInventory.item.should.equal(auction.item);
        sellerInventory.quantity.should.equal(-auction.quantity);
        winnerInventory.item.should.equal(auction.item);
        winnerInventory.quantity.should.equal(auction.quantity);

        done();
      });
    });
  });

});