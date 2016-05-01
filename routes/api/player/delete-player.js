/**
 * @fileOverview DELETE /api/player endpoint.
 */

module.exports = function (req, res, next) {
  req.player.delete(function (err) {
    if (err) return next(err);
    res.end();
  });
};