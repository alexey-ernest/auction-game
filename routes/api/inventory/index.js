/**
 * @fileOverview Inventory endpoint.
 */

var express = require('express');
var router = express.Router();

var auth = require('../../../lib/middleware/auth');
var db = require('../../../lib/db');
var getInventory = require('./get-inventory')(db);


/**
 * Get player inventory items.
 */
router.get('/',
  auth.private(),
  getInventory
  );

module.exports = router;