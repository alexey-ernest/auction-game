/**
 * @fileOverview GET /api/inventory endpoint.
 */

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

module.exports = function (db) {
  var Inventory = db.Inventory;

	return function (req, res, next) {
    Inventory.getPlayerItems(req.player.id, function (err, items) {
      if (err) return next(err);
      res.json(items.map(mapInventoryItem));
    });
  };
};