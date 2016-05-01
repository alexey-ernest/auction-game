/**
 * @fileOverview Middleware for managing authentication of players.
 */

// env
if (!process.env.TOKEN_SECRET) {
  console.log("TOKEN_SECRET environment variable required.");
  process.exit(1);
}

var async = require('async');
var jwt = require('jsonwebtoken');
var passport = require('passport');
var uuid = require('node-uuid');

var PlayerModel = require('../player-model');
var db = require('../db');
var Player = db.Player;
var Inventory = db.Inventory;
var PlayerSession = db.PlayerSession;
var auctionService = require('../auction-service')(db);


// configure passport with JWT
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var opts = {
  secretOrKey: process.env.TOKEN_SECRET,
  jwtFromRequest: ExtractJwt.fromAuthHeader()
};

passport.use('jwt', new JwtStrategy(opts, function (jwtPayload, done) {
  Player.get(jwtPayload.player_id, function(err, player) {
    if (err) return done(err, false);
    if (!player) return done(null, false);

    // searching for session
    PlayerSession.get(player.id, function (err, playerSession) {
      if (err) return done(err, false);
      if (!playerSession) return done(null, false);
      
      if (playerSession.session_id !== jwtPayload.session_id) {
        return done(null, false);
      }

      done(null, player);
    });
  });
}));

/**
 * Performs request authentication by JWT.
 *
 * @method     private
 * @return     {Function}  Middleware.
 */
exports.private = function () {
  return passport.authenticate('jwt', {
    session: false, 
    assignProperty: 'player'
  });
};


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
 * Registers new player or finds existing one by name and assigns it to req.player.
 *
 * @method     exports
 * @param      {string}    fieldName  Body's field name.
 * @return     {Function}  Middleware.
 */
exports.register = function (fieldName) {
  return function (req, res, next) {
    if (!req.body[fieldName]) {
      return res.status(400).send({ message: 'Bad Request: ' + fieldName + ' is not specified.' });
    }
    var name = req.body[fieldName];

    Player.getId(name, function (err, id) {
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
          initPlayer(name),
          validatePlayer(),
          savePlayer(),
          initInventory(),
          saveInventory()
        ], 
        function (err, result) {
          if (err) {
            if (err.type === 'badRequest') {
              // validation errors
              return res.status(400).send({ message: err });
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

/**
 * Generates new JWT token.
 *
 * @method     login
 * @param      {string}    name    User name.
 * @return     {Function}  Middleware.
 */
exports.login = function () {
  return function (req, res, next) {
    var payload = {
      player_id: req.player.id,
      session_id: uuid.v4()
    };
    req.token = jwt.sign(payload, process.env.TOKEN_SECRET, {expiresIn: 86400});

    // updating session
    PlayerSession.get(req.player.id, function (err, playerSession) {
      if (err) return next(err);

      if (playerSession) {
        playerSession.session_id = payload.session_id;
        playerSession.update(next);
      } else {
        playerSession = new PlayerSession({
          player_id: req.player.id,
          session_id: payload.session_id
        });
        playerSession.insert(next);
      }
    });
  };
};

/**
 * Logs out player.
 *
 * @method     logout
 * @return     {Function}  Middleware.
 */
exports.logout = function () {
  return function (req, res, next) {

    // delete session
    var playerSession = new PlayerSession({player_id: req.player.id});
    playerSession.delete(next);
  };
};