/**
 * @fileOverview Middleware for managing authentication status of current user.
 */

var async = require('async');
var PlayerSession = require('../player-session');

/**
 * Performs request authentication by examinig req.session.pid.
 *
 * @method     private
 * @return     {Function}  Middleware.
 */
exports.private = function () {
  return function (req, res, next) {
    if (!req.session || !req.session.pid) {
      return res.status(401).end();
    }

    // checking if there is player-session record
    PlayerSession.get(req.session.id, function (err, playerSession) {
      if (err) return next(err);
      if (!playerSession) {
        // player was deauthenticated
        return res.status(401).end();
      }

      next();
    });
  };
};

/**
 * Logs in user by name by examining req.player object.
 *
 * @method     login
 * @param      {string}    name    User name.
 * @return     {Function}  Middleware.
 */
exports.login = function () {
  return function (req, res, next) {
    // regenerate session id to avoid hijacking
    req.session.regenerate(function(err) {
      if (err) return next(err);

      if (!req.player) {
        return res.status(401).end();
      }

      // deauthenticate all other player-sessions
      PlayerSession.getPlayerSessions(req.player.id, function (err, sessions) {
        if (err) return next(err);

        // creating list of delete tasks
        var tasks = [];
        sessions.forEach(function (s) {
          tasks.push(function (fn) {
            s.delete(fn);
          });
        });
        async.parallel(tasks, function (err) {
          if (err) return next(err);

          // saving session-player correspondance to avoid collaborative usage
          var playerSession = new PlayerSession({
            sid: req.session.id,
            player_id: req.player.id
          });
          playerSession.save(function (err) {
            if (err) return next(err);

            // setting pid for the session
            req.session.pid = req.player.id;
            next();
          });
        });
      });
    });
  };
};

/**
 * Logs out currently logged in user.
 *
 * @method     logout
 * @return     {Function}  Middleware.
 */
exports.logout = function () {
  return function (req, res, next) {
    // delete player-session correspondence
    delete req.session.pid;

    var playerSession = new PlayerSession({sid: req.session.id});
    playerSession.delete(function (err) {
      if (err) return next(err);

      // regenerate session id to avoid hijacking
      req.session.regenerate(function(err) {
        next(err);
      });
    });
  };
};