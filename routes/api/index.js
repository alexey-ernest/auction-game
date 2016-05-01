/**
 * @fileOverview HTTP API endpoints.
 */

var express = require('express');
var router = express.Router();

var auth = require('../../lib/middleware/auth');
var PlayerModel = require('../../lib/player-model');

// mounting auth API
var authApi = require('./auth');
router.use('/', authApi);

// mounting player API
var playerApi = require('./player');
router.use('/player', playerApi);

// mounting inventory API
var inventoryApi = require('./inventory');
router.use('/inventory', inventoryApi);

// mounting auction API
var auctionApi = require('./auction');
router.use('/auction', auctionApi);

module.exports = router;