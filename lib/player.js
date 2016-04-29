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
 * Auction player.
 *
 * @class
 * @param      {Object}  obj     Object to copy properties from.
 */
function Player(obj) {
  var key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      this[key] = obj[key];
    }
  }
}

/**
 * Saves player's data into db.
 *
 * @method     save
 * @param      {Function}  fn      Callback.
 */
Player.prototype.save = function (fn) {
  if (this.id) {
    this.update(fn);
  } else {
    var player = this;
    connect(function (err, db) {
      if (err) return fn(err);
      db.query(
        'INSERT INTO players (name, coins) VALUES ($1, $2) RETURNING id', 
        [player.name, player.coins], 
        function (err, result) {
          if (err) return fn(err);
          player.id = result.rows[0].id;
          fn();
        });
    });
  }
};

/**
 * Updates player fields in db.
 *
 * @method     update
 * @param      {Function}  fn      Callback.
 */
Player.prototype.update = function (fn) {
  var player = this;
  connect(function (err, db) {
    if (err) return fn(err);
    db.query(
      'UPDATE players SET coins = $1::int WHERE id = $2', 
      [player.coins, player.id], 
      fn);
  });
};

/**
 * Deletes player from db permanently.
 *
 * @method     delete
 * @param      {Function}  fn      Callback.
 */
Player.prototype.delete = function (fn) {
  var player = this;
  connect(function (err, db) {
    if (err) return fn(err);
    db.query(
      'DELETE FROM players WHERE id = $1', 
      [player.id], 
      fn);
  });
};

/**
 * Gets player id by name.
 *
 * @method     getId
 * @param      {string}    name    Player name.
 * @param      {Function}  fn      Callback.
 */
Player.getId = function (name, fn) {
  connect(function (err, db) {
    if (err) return fn(err);
    db.query(
      'SELECT id FROM players WHERE name = $1', 
      [name], 
      function (err, result) {
        if (err) return fn(err);
        if (!result.rows.length) return fn();
        fn(null, result.rows[0].id);
      });
  });
};

/**
 * Gets player data by id.
 *
 * @method     get
 * @param      {Number}    id      Player id.
 * @param      {Function}  fn      Callback.
 */
Player.get = function (id, fn) {
  connect(function (err, db) {
    if (err) return fn(err);
    db.query(
      'SELECT id, name, coins FROM players WHERE id = $1', 
      [id], 
      function (err, result) {
        if (err) return fn(err);
        if (!result.rows.length) return fn();
        fn(null, new Player(result.rows[0]));
      });
  });
};

module.exports = Player;