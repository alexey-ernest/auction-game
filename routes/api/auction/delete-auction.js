/**
 * @fileOverview DELETE /api/auction/{id} endpoint.
 */

module.exports = function (db) {
  var Auction = db.Auction;

	return function (req, res, next) {
    Auction.get(req.params.id, function (err, auction) {
      if (err) return next(err);
      if (!auction) {
        return res.status(404).end();
      }
      if (auction.seller !== req.player.id) {
        // can't cancel not owned auction
        return res.status(403).end(); 
      }
      if (auction.start_time) {
        // can't cancel already started auction
        return res.status(403).end(); 
      }

      // delete auction
      auction.delete(function (err) {
        if (err) return next(err);
        res.end();
      });
    });
  };
};
