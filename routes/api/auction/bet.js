/**
 * @fileOverview POST /api/auction/bet endpoint.
 */

var common = require('./common');

module.exports = function (db) {
  var auctionService = require('../../../lib/auction-service')(db);

	return function (req, res, next) {
    auctionService.bet(req.player, req.body.bid, function (err, result) {
      if (err) return next(err);
      if (!result.ok) {
        // the bet could not be accepted
        return common.handleErrorResult(result, res);
      }

      var json = common.mapAuction(result.auction);
      res.status(200).json(json);
    });
  };
};