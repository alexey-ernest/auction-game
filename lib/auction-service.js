/**
 * @fileOverview Auction business logic.
 */

var Player = require('./player');
var Inventory = require('./inventory');
var Auction = require('./auction');
var AuctionModel = require('./auction-model');
var moment = require('moment');
var async = require('async');

/**
 * Inits new player defaults.
 *
 * @method     initPlayer
 * @param      {string}  name    Player name.
 * @return     {Player}  Player object with default values.
 */
exports.initPlayer = function (name) {
  return new Player({
    name: name,
    coins: 1000
  });
};

/**
 * Inits default inventory items for a player.
 *
 * @method     initInventory
 * @param      {string}  player_id  Owner player id.
 * @return     {Array}   Array of Inventory items.
 */
exports.initInventory = function (player_id) {
  var items = [
    new Inventory({
      player_id: player_id, 
      item: 'bread', 
      quantity: 30
    }),
    new Inventory({
      player_id: player_id, 
      item: 'carrot', 
      quantity: 18
    }),
    new Inventory({
      player_id: player_id, 
      item: 'diamond', 
      quantity: 1
    })
  ];

  return items;
};

/**
 * Adds new auction to the queue.
 *
 * @method     queueAuction
 * @param      {Object}    player    Player object.
 * @param      {Object}    data      Auction data.
 * @param      {Function}  fn        Callback.
 */
exports.queueAuction = function (player, data, fn) {
  // validating inputs
  model = AuctionModel.create();
  model.update(data, '*');
  model.validate().then(function () {
    if (!model.isValid) {
      return fn(null, {
        ok: false,
        type: 'badRequest',
        error: model.errors
      });
    }
    
    var item = data.item;
    var quantity = data.quantity;
    var min_bid = data.min_bid;

    // check if player has enough quantity of item
    Inventory.getPlayerItems(player.id, function (err, items) {
      if (err) return fn(err);

      var auction_item = items.filter(function (i) {
        return i.item === item;
      });
      if (!auction_item.length) {
        return fn(null, {
          ok: false,
          type: 'forbidden',
          error: 'Player ' + player.name + ' does not have ' + item
        });
      }

      auction_item = auction_item[0];
      if (auction_item.quantity < quantity) {
        return fn(null, {
          ok: false,
          type: 'forbidden',
          error: 'Player ' + player.name + ' does not have enough quantity of ' + item
        });
      }

      // get current auction
      Auction.getCurrent(function (err, current) {
        if (err) return fn(err);

        var auction = new Auction({
          seller: player.id,
          seller_name: player.name,
          item: item,
          quantity: quantity,
          min_bid: min_bid
        });

        // queue auction
        auction.save(function (err) {
          if (err) return fn(err);

          fn(null, {
            ok: true,
            auction: auction,
            current_auction: current
          });
        });
      });
    });
  });
};

/**
 * Starts next auction.
 *
 * @method     startAuction
 * @param      {Function}  fn      Callback.
 */
exports.startAuction = function (seconds, fn) {
  if (typeof seconds === 'function') {
    fn = seconds;
    seconds = 0;
  }
  seconds = seconds === parseInt(seconds, 10) && seconds > 0 ? seconds : 90;

  Auction.getNext(function (err, auction) {
    if (err) return fn(err);
    if (!auction) {
      // there is no auction in the queue
      return fn();
    }

    var now = moment();
    auction.start_time = now.toISOString();
    auction.end_time = now.add(seconds, 's').toISOString();
    auction.save(function (err) {
      if (err) return fn(err);
      Auction.get(auction.id, function (err, data) {
        if (err) return fn(err);
        fn(null, data);
      });
    });
  });
};

/**
 * Makes a bet on current auction.
 *
 * @method     bet
 * @param      {Object}    player      Player object.
 * @param      {Number}    bid         Player's bid.
 * @param      {Function}  fn          Callback.
 */
exports.bet = function (player, bid, fn) {
  // validating inputs
  bid = parseInt(bid, 10);
  if (!bid) {
    return fn(null, {
      ok: false,
      type: 'badRequest',
      error: 'Bid should be > 0.'
    });
  }

  Auction.getCurrent(function (err, auction) {
    if (err) return fn(err);
    if (!auction) return fn(null, {
      ok: false,
      type: 'notFound',
      error: 'There is no currently active auctions'
    });

    if (auction.seller === player.id) return fn(null, {
      ok: false,
      type: 'forbidden',
      error: 'Player ' + player.name + ' is not allowed to bet for his own auction ' + auction.id
    });

    if (player.coins < bid) return fn(null, {
      ok: false,
      type: 'forbidden',
      error: 'Player ' + player.name + ' does not have enough money to make a bid of ' + bid + ' coins on auction ' + auction.id
    });

    var minAllowedBid = Math.max(auction.min_bid, auction.bid);
    if (bid < minAllowedBid) return fn(null, {
      ok: false,
      type: 'forbidden',
      error: 'Minimum allowed bid for auction ' + auction.id + ' is ' + minAllowedBid
    });

    // extend auction to 10 seconds if required
    var endMoment = moment(auction.end_time);
    var nowMoment = moment();
    if (endMoment.diff(nowMoment, 's') < 10) {
      auction.end_time = nowMoment.add(10, 's').toISOString();
    }

    auction.bid = bid;
    auction.winner = player.id;
    auction.winner_name = player.name;

    // saving bid
    auction.save(function (err) {
      if (err) return fn(err);
      Auction.get(auction.id, function (err, auction) {
        if (err) return fn(err);
        fn(null, {
          ok: true,
          auction: auction
        });
      });
    });
  });
};

function updateInventory(player_id, item, quantity) {
  return function (fn) {
    Inventory.updatePlayerItem(player_id, item, quantity, fn);
  };
}

function updateBalance(player, coins) {
  return function (fn) {
    player.coins += coins;
    player.save(fn);
  };
}

/**
 * Processes auction.
 *
 * @method     bet
 * @param      {Object}    auction  Auction to process.
 * @param      {Function}  fn       Callback.
 */
exports.processAuction = function (auction, fn) {
  if (auction.done) {
    return fn();
  }

  if (!auction.winner) {
    auction.done = true;
    return auction.save(fn);
  }

  Player.get(auction.seller, function (err, seller) {
    if (err) return fn(err);
    Player.get(auction.winner, function (err, winner) {
      if (err) return fn(err);

      // updating seller inventory
      async.parallel([
          updateInventory(seller.id, auction.item, -auction.quantity),
          updateBalance(seller, auction.bid),
          updateInventory(winner.id, auction.item, auction.quantity),
          updateBalance(winner, -auction.bid)
        ], function (err) {
          if (err) return fn(err);

          auction.done = true;
          auction.save(fn);
        });
    });
  });
};
