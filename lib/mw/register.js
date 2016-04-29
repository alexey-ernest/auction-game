/**
 * @fileOverview Middleware for registering players.
 */

var async = require('async');
var Player = require('../player');
var PlayerModel = require('../player-model');
var Inventory = require('../inventory');
var auctionService = require('../auction-service');

function initPlayer(name) {
  return function (fn) {
    player = auctionService.initPlayer(name);
    fn(null, player);
  };
}

function validatePlayer() {
  return function (player, fn) {
    model = PlayerModel.create();
    model.update(player, '*');
    model.validate().then(function () {
      if (!model.isValid) {
        model.errors.type = 'badRequest';
        return fn(model.errors);
      }
      fn(null, player);
    });
  };
}

function savePlayer() {
  return function (player, fn) {
    player.save(function (err) {
      if (err) return fn(err);
      fn(null, player);
    });
  };
}

function initInventory() {
  return function (player, fn) {
    var items = auctionService.initInventory(player.id);
    fn(null, player, items);
  };
}

function saveInventory() {
  return function (player, items, fn) {
    Inventory.batchInsert(items, function (err) {
      if (err) return fn(err);
      fn(null, player);
    });
  };
}

/**
 * Registers new player or find existing one by name and assigns it to req.player.
 *
 * @method     exports
 * @param      {string}    fieldName  Player's name field name.
 * @return     {Function}  Middleware.
 */
module.exports = function (fieldName) {
  return function (req, res, next) {
    // searching for existing user
    Player.getId(req.body[fieldName], function (err, id) {
      if (err) return next(err);
      var player, model;
      if (id) {
        // get existing player
        Player.get(id, function (err, player) {
          if (err) return next(err);
          req.player = player;
          next();
        });
      } else {
        // init new player with inventory
        async.waterfall([
          initPlayer(req.body[fieldName]),
          validatePlayer(),
          savePlayer(),
          initInventory(),
          saveInventory()
        ], 
        function (err, result) {
          if (err) {
            if (err.type === 'badRequest') {
              // validation errors
              return res.status(400).send({ errors: err });
            }
            
            return next(err);
          }

          req.player = result;
          next();
        });
      }
    });
  };
};
