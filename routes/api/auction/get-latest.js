/**
 * @fileOverview GET /api/auction/latest endpoint.
 */

var moment = require('moment');
var common = require('./common');

module.exports = function (db) {
  var Auction = db.Auction;

	return function (req, res, next) {
    Auction.getLatest(function (err, auction) {
      if (err) return next(err);
      if (!auction) {
        return res.end();
      }

      // showing latest for 10 seconds only
      var endMoment = moment(auction.end_time);
      var nowMoment = moment();
      if (nowMoment.diff(endMoment, 's') > 10) {
        return res.end();
      }

      res.json(common.mapAuction(auction));
    });
  };
};