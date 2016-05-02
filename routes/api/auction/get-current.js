/**
 * @fileOverview GET /api/auction endpoint.
 */

var moment = require('moment');
var common = require('./common');

module.exports = function (db) {
  var Auction = db.Auction;

	return function (req, res, next) {
    Auction.getCurrent(function (err, auction) {
      if (err) return next(err);
      if (!auction) {
        return res.end();
      }

      // calculating time left
      var endMoment = moment(auction.end_time);
      var nowMoment = moment();
      var timeLeft = endMoment.diff(nowMoment, 's');
      auction.timeLeft = timeLeft;

      res.json(common.mapAuction(auction));
    });
  };
};