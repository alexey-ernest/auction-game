/**
 * @fileOverview Middleware for loading player info.
 */

var Player = require('../player');

/**
 * Loads player data corresponding to req.session.pid.
 *
 * @method     exports
 * @return     {Function}  Middleware.
 */
module.exports = function () {
  return function (req, res, next) {
    if (!req.session.pid) return next();
    Player.get(req.session.pid, function (err, player) {
      if (err) return next(err);
      if (!player) return next();
      req.player = player;
      next();
    });
  };
};