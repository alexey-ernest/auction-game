/**
 * @fileOverview Player endpoint.
 */

var express = require('express');
var router = express.Router();

var auth = require('../../../lib/middleware/auth');
var getPlayer = require('./get-player');
var deletePlayer = require('./delete-player');

/**
 * Get player info.
 */
router.get('/',
  auth.private(),
  getPlayer
  );

/**
 * Deregister player.
 */
router.delete('/',
  auth.private(),
  auth.logout(),
  deletePlayer
  );

module.exports = router;