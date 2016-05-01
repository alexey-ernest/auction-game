/**
 * @fileOverview Worker executes auction processing.
 */

var debug = require('debug')('auction-game:worker');
var Auction = require('./lib/auction');
var auctionService = require('./lib/auction-service');
var moment = require('moment');

var timeoutId;

/**
 * Socket.io instance.
 *
 * @type       {socket.io}
 */
var io;

/**
 * Updates auction data.
 *
 * @method     tick
 */
function tick() {
  debug('Auction tick');

  Auction.getCurrent(function (err, current) {
    if (err) return console.error(err);

    if (current) {

      // calculating time left
      var endMoment = moment(current.end_time);
      var nowMoment = moment();
      var timeLeft = endMoment.diff(nowMoment, 's');
      current.timeLeft = timeLeft;

      // notify clients
      io.emit('auction-updated', current);

      debug('Current auction (' + current.id  + ') is still active. Going sleep for 1s...');
      
      timeoutId = setTimeout(tick, 1000);
      return;
    }

    // getting latest auction and processing if required
    Auction.getLatest(function (err, latest) {
      if (err) return console.error(err);

      if (latest && !latest.done) {
        debug('Processing auction ' + latest.id + ': ' + latest.item + ' x ' + latest.quantity + ' = ' + latest.bid);

        return auctionService.processAuction(latest, function (err) {
          if (err) return console.error(err);

          debug('Auction ' + latest.id + ' successfully processed. Going sleep for 10s...');

          // notify clients that auction has been processed
          io.emit('auction-completed');

          timeoutId = setTimeout(tick, 10 * 1000); // 10 seconds delay before next auction
        });
      }

      // starting new auction
      debug('Checking queue for new auctions...');
      auctionService.startAuction(function (err, result) {
        if (err) return console.error(err);

        var auction = result.auction;
        if (auction) {
          if (result.ok) {
            debug('New auction ' + auction.id + ' has been started.');

            // notify clients
            io.emit('auction-started');
          } else {
            // could not start auction (not enough items)
            debug('Auction ' + auction.id + ' could not be started: ' + result.error);

            // checking queue again
            timeoutId = setTimeout(tick, 0);
            return;
          }
        } else {
          // notify clients
            io.emit('no-auctions');
        }
        
        timeoutId = setTimeout(tick, 1000);
      });
    });

  });
}

/**
 * Auction worker process.
 *
 * @method     exports
 * @param      {Object}  server  Server object.
 * @return     {Object}  Worker interface.
 */
module.exports = function (server) {
  io = require('socket.io')(server);

  var socketPlayers = {};
  var playerSockets = {};
  io.on('connection', function(socket){
    // player logged in
    socket.on('login', function(player_id) {
      debug('Player ' + player_id + ' just logged in.');

      var anotherSocket = playerSockets[player_id];
      if (anotherSocket && anotherSocket.id !== socket.id) {
        // somebody else logged in with the same name, logging out him
        debug('Logging out other user logged in as player ' + player_id + '.');

        socketPlayers[anotherSocket.id] = null;
        playerSockets[player_id].emit('logout');
      }
      
      var previousPlayerId = socketPlayers[socket.id];
      if (previousPlayerId) {
        // this socket was logged in as another player
        playerSockets[previousPlayerId] = null;
      }

      // saving player connection
      socketPlayers[socket.id] = player_id;
      playerSockets[player_id] = socket;
    });

    // player disconnected
    socket.on('disconnect', function() {
      var playerId = socketPlayers[socket.id];
      debug('Player ' + playerId + ' disconnected.');

      delete playerSockets[playerId];
      delete socketPlayers[socket.id];
    });
  });

  return {
    start: function () {
      timeoutId = setTimeout(tick, 1000);
    },
    stop: function () {
      if (timeoutId) {
        clearTimeout(timeoutId);  
      }
      
      timeoutId = null;
    }
  };
};
