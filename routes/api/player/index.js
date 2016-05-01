/**
 * @fileOverview Player endpoint.
 */

var express = require('express');
var router = express.Router();

var auth = require('../../../lib/middleware/auth');
var PlayerModel = require('../../../lib/player-model');

/**
 * Get player info.
 */
router.get('/',
  auth.private(),
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
  auth.logout(),
  function (req, res, next) {
    req.player.delete(function (err) {
      if (err) return next(err);
      res.end();
    });
  });

module.exports = router;