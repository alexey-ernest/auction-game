// env
if (!process.env.POSTGRES_CONNECTION) {
  console.log("POSTGRES_CONNECTION environment variable required.");
  process.exit(1);
}

var pg = require('pg');

/**
 * Helper function to get db connection from the pool.
 *
 * @method     connect
 * @param      {Function}  fn      Callback.
 */
function connect(fn) {
  pg.connect(process.env.POSTGRES_CONNECTION, function(err, client, done) {
    if (err) return fn(err);
    fn(null, client);
    done();
  });
}

/**
 * Player-session correspondance.
 *
 * @class
 * @param      {Object}  obj     Object to copy properties from.
 */
function PlayerSession(obj) {
  var key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      this[key] = obj[key];
    }
  }
}

/**
 * Saves player-session correspondance.
 *
 * @method     save
 * @param      {Function}  fn      Callback.
 */
PlayerSession.prototype.save = function (fn) {
  var playerSession = this;
  connect(function (err, db) {
    if (err) return fn(err);
    db.query(
      'INSERT INTO player_sessions (sid, player_id) VALUES ($1, $2)', 
      [playerSession.sid, playerSession.player_id], 
      fn);
  });
};

/**
 * Deletes player-session correspondance (automatically logout player).
 *
 * @method     delete
 * @param      {Function}  fn      Callback.
 */
PlayerSession.prototype.delete = function (fn) {
  var playerSession = this;
  connect(function (err, db) {
    if (err) return fn(err);
    db.query(
      'DELETE FROM player_sessions WHERE sid = $1', 
      [playerSession.sid], 
      fn);
  });
};

/**
 * Gets player-session correspondance.
 *
 * @method     get
 * @param      {Number}    id      Session id.
 * @param      {Function}  fn      Callback.
 */
PlayerSession.get = function (id, fn) {
  connect(function (err, db) {
    if (err) return fn(err);
    db.query(
      'SELECT sid, player_id FROM player_sessions WHERE sid = $1', 
      [id], 
      function (err, result) {
        if (err) return fn(err);
        if (!result.rows.length) return fn();
        fn(null, new PlayerSession(result.rows[0]));
      });
  });
};

/**
 * Gets all player-session correspondance.
 *
 * @method     get
 * @param      {Number}    id      Player id.
 * @param      {Function}  fn      Callback.
 */
PlayerSession.getPlayerSessions = function (id, fn) {
  connect(function (err, db) {
    if (err) return fn(err);
    db.query(
      'SELECT sid, player_id FROM player_sessions WHERE player_id = $1', 
      [id], 
      function (err, result) {
        if (err) return fn(err);
        if (!result.rows.length) return fn(null, []);

        var sessions = result.rows.map(function (i) {
          return new PlayerSession(i);
        });
        fn(null, sessions);
      });
  });
};

module.exports = PlayerSession;