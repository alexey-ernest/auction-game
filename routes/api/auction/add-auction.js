/**
 * @fileOverview POST /api/auction endpoint.
 */

var common = require('./common');

module.exports = function (db) {
  var auctionService = require('../../../lib/auction-service')(db);

	return function (req, res, next) {
    auctionService.queueAuction(req.player, req.body, 
      function (err, result) {
        if (err) return next(err);
        if (!result.ok) {
          // auction cannot be accepted
          return common.handleErrorResult(result, res);
        }

        var json = common.mapAuction(result.auction);
        if (!result.current_auction) {
          // there is no other auction currently in process
          res.statusCode = 201; // CREATED
        } else {
          // auction added to the queue
          res.statusCode = 202; // ACCEPTED for further processing (queued)
        }

        res.json(json);
      });
  };
};