/**
 * @fileOverview Player endpoint.
 */

var express = require('express');
var router = express.Router();

var auth = require('../lib/mw/auth');
var loadplayer = require('../lib/mw/loadplayer');

var PlayerModel = require('../lib/player-model');

/**
 * Get player info.
 */
router.get('/',
  auth.private(),
  loadplayer(),
  function (req, res, next) {
    var model = PlayerModel.create();
    model.update(req.player, '*');
    res.json(model.toJSON(['default', 'private']));
  });

/**
 * Deregister player.
 */
router.delete('/',
  auth.private(),
  loadplayer(),
  auth.logout(),
  function (req, res, next) {
    req.player.delete(function (err) {
      if (err) return next(err);
      res.end();
    });
  });

module.exports = router;