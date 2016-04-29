/**
 * @fileOverview HTTP API endpoints.
 */

var express = require('express');
var router = express.Router();

var auth = require('../lib/mw/auth');
var register = require('../lib/mw/register');
var PlayerModel = require('../lib/player-model');

// mounting player API
var playerApi = require('./player-api');
router.use('/player', playerApi);

// mounting inventory API
var inventoryApi = require('./inventory-api');
router.use('/inventory', inventoryApi);

// mounting auction API
var auctionApi = require('./auction-api');
router.use('/auction', auctionApi);

/**
 * Healthcheck endpoint.
 */
router.get('/heartbeat', function (req, res) {
  res.send();
});

/**
 * Log in endpoint.
 */
router.post('/login',
  register('name'), // registers player by name
  auth.login(), // logs in user
  function (req, res, next) {
    var model = PlayerModel.create();
    model.update(req.player, '*');
    return res.json(model.toJSON(['default', 'private']));
  });

/**
 * Logout endpoint.
 */
router.delete('/logout',
  auth.private(),
  auth.logout(),
  function (req, res, next) {
    res.end();
  });

module.exports = router;
