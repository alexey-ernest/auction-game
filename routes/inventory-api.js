/**
 * @fileOverview Inventory endpoint.
 */

var express = require('express');
var router = express.Router();

var auth = require('../lib/mw/auth');
var loadplayer = require('../lib/mw/loadplayer');

var Inventory = require('../lib/inventory');

/**
 * Helper method for mapping db inventory items.
 *
 * @method     mapInventoryItem
 * @param      {Object}  i       Inventory object.
 * @return     {Object}  Mapped Object.
 */
function mapInventoryItem(i) {
  return {
    id: i.id,
    item: i.item,
    quantity: i.quantity
  };
}

/**
 * Get player inventory items.
 */
router.get('/',
  auth.private(),
  loadplayer(),
  function (req, res, next) {
    Inventory.getPlayerItems(req.player.id, function (err, items) {
      if (err) return next(err);
      res.json(items.map(mapInventoryItem));
    });
  });


module.exports = router;