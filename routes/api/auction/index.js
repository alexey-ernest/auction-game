/**
 * @fileOverview Auction endpoint.
 */

var express = require('express');
var router = express.Router();

var auth = require('../../../lib/middleware/auth');

var db = require('../../../lib/db');
var getCurrent = require('./get-current')(db);
var getLatest = require('./get-latest')(db);
var getAuction = require('./get-auction')(db);
var addAuction = require('./add-auction')(db);
var bet = require('./bet')(db);
var deleteAuction = require('./delete-auction')(db);


/**
 * Get current auction.
 */
router.get('/',
  auth.private(),
  getCurrent
  );

/**
 * Get latest auction.
 */
router.get('/latest',
  auth.private(),
  getLatest
  );

/**
 * Get auction by id.
 */
router.get('/:id',
  auth.private(),
  getAuction
  );

/**
 * Add new auction to the queue.
 */
router.post('/',
  auth.private(),
  addAuction
  );

/**
 * Makes a bet on current auction.
 */
router.post('/bet',
  auth.private(),
  bet
  );

/**
 * Cancel queued auction.
 */
router.delete('/:id',
  auth.private(),
  deleteAuction
  );

module.exports = router;
