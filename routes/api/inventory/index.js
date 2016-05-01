/**
 * @fileOverview Inventory endpoint.
 */

var express = require('express');
var router = express.Router();

var auth = require('../../../lib/middleware/auth');
var db = require('../../../lib/db');
var Inventory = db.Inventory;

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
  function (req, res, next) {
    Inventory.getPlayerItems(req.player.id, function (err, items) {
      if (err) return next(err);
      res.json(items.map(mapInventoryItem));
    });
  });


module.exports = router;