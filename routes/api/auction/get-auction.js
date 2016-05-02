/**
 * @fileOverview GET /api/auction/{id} endpoint.
 */

var common = require('./common');

module.exports = function (db) {
  var Auction = db.Auction;

	return function (req, res, next) {
    Auction.get(req.params.id, function (err, auction) {
      if (err) return next(err);
      if (!auction) {
        return res.status(404).end();
      }
      res.json(common.mapAuction(auction));
    });
  };
};