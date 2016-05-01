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
 * Inventory item holding information about player item and it's quantity.
 *
 * @class
 * @param      {Object}  obj     Object to copy properties from.
 */
function Inventory(obj) {
  var key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      this[key] = obj[key];
    }
  }
}

/**
 * Saves inventory item in db.
 *
 * @method     save
 * @param      {Function}  fn      Callback.
 */
Inventory.prototype.save = function (fn) {
  if (this.id) {
    this.update(fn);
  } else {
    var inventory = this;
    connect(function (err, db) {
      if (err) return fn(err);
      db.query(
        'INSERT INTO inventory (player_id, item, quantity) VALUES ($1, $2, $3) RETURNING id', 
        [inventory.player_id, inventory.item, inventory.quantity], 
        function (err, result) {
          if (err) return fn(err);
          inventory.id = result.rows[0].id;
          fn();
        });
    });
  }
};

/**
 * Updates inventory item in db.
 *
 * @method     update
 * @param      {Function}  fn      Callback.
 */
Inventory.prototype.update = function (fn) {
  var inventory = this;
  connect(function (err, db) {
    if (err) return fn(err);
    db.query(
      'UPDATE inventory SET quantity = $1 WHERE id = $2', 
      [inventory.quantity, inventory.id], 
      fn);
  });
};

/**
 * Deletes player's item from inventory.
 *
 * @method     delete
 * @param      {Function}  fn         Callback.
 */
Inventory.prototype.delete = function (fn) {
  var inventory = this;
  connect(function (err, db) {
    if (err) return fn(err);
    db.query(
      'DELETE FROM inventory WHERE id = $1', 
      [inventory.id], 
      fn);
  });
};

/**
 * Gets inventory item by id.
 *
 * @method     get
 * @param      {Number}    id      Inventory item id.
 * @param      {Function}  fn      Callback.
 */
Inventory.get = function (id, fn) {
  connect(function (err, db) {
    if (err) return fn(err);
    db.query(
      'SELECT id, player_id, item, quantity FROM inventory WHERE id = $1', 
      [id], 
      function (err, result) {
        if (err) return fn(err);
        if (!result.rows.length) return fn();
        fn(null, new Inventory(result.rows[0]));
      });
  });
};

/**
 * Inserts multiple inventory items into the db.
 *
 * @method     batchInsert
 * @param      {Function}  fn      Callback.
 */
Inventory.batchInsert = function (items, fn) {
  var inventory = this;
  var sql = 'INSERT INTO inventory (player_id, item, quantity) VALUES ';
  var sqlValues = [];
  items.forEach(function (i, index) {
    if (index > 0) {
      sql += ',';
    }
    sql += ' ($' + (index * 3 + 1) + ', $' + (index * 3 + 2) + ', $' + (index * 3 + 3) + ')';

    sqlValues.push(i.player_id);
    sqlValues.push(i.item);
    sqlValues.push(i.quantity);
  });

  connect(function (err, db) {
    if (err) return fn(err);
    db.query(sql, sqlValues, fn);
  });
};

/**
 * Retrieves inventory items for player.
 *
 * @method     getPlayerItems
 * @param      {string}    player_id  Player id.
 * @param      {Function}  fn         Callback.
 */
Inventory.getPlayerItems = function (player_id, fn) {
  var inventory = this;
  connect(function (err, db) {
    if (err) return fn(err);
    db.query(
      'SELECT id, player_id, item, quantity FROM inventory WHERE player_id = $1 ORDER BY item', 
      [player_id], 
      function (err, result) {
        if (err) return fn(err);
        if (!result.rows.length) return fn();

        var items = result.rows.map(function (i) {
          return new Inventory(i);
        });

        fn(null, items);
      });
  });
};

/**
 * Adds/removes inventory item to/from player's balance.
 *
 * @method     updatePlayerItem
 * @param      {string}    player_id  Player id.
 * @param      {string}    item       Item name.
 * @param      {Number}    quantity   Item quantity, can be positive or negative.
 * @param      {Function}  fn         Callback.
 */
Inventory.updatePlayerItem = function (player_id, item, quantity, fn) {
  var inventory = this;
  if (quantity === 0) {
    // nothing to update
    fn();
  }

  // get existing items
  Inventory.getPlayerItems(player_id, function (err, items) {
    if (err) return fn(err);

    var invItem = items.filter(function (i) {
      return i.item === item;
    })[0];

    if (invItem) {
      // item already exists
      if (invItem && (invItem.quantity + quantity) <= 0) {
        // completely remove item
        invItem.delete(fn);
      } else {
        // updating quantity
        invItem.quantity += quantity;
        invItem.save(fn);
      }
    } else {
      // item does not exist
      if (quantity <= 0) {
        // nothing to remove
        fn();
      } else {
        // adding new item
        invItem = new Inventory({
          player_id: player_id, 
          item: item, 
          quantity: quantity
        });
        invItem.save(fn);
      }
    }
  });
};

module.exports = Inventory;