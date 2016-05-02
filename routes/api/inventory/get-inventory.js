/**
 * @fileOverview GET /api/inventory endpoint.
 */

module.exports = function (db) {
  var Inventory = db.Inventory;

  return function (req, res, next) {
    Inventory.getPlayerItems(req.player.id, function (err, items) {
      if (err) return next(err);
      res.json(items);
    });
  };
};