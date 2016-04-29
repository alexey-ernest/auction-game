/**
 * @fileOverview Worker executes auction processing.
 */

var debug = require('debug')('auction-game:worker');
var Auction = require('./lib/auction');
var auctionService = require('./lib/auction-service');

var timeoutId;

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
      debug('Current auction (' + current.id  + ') is still active. Going sleep for 1s...');
      // auction is going, nothing to do
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
          timeoutId = setTimeout(tick, 10 * 1000); // 10 seconds delay before next auction
        });
      }

      // starting new auction
      debug('Checking queue for new auctions...');
      auctionService.startAuction(function (err, auction) {
        if (err) return console.error(err);

        if (auction) {
          debug('New auction ' + auction.id + ' started.');          
        }
        
        timeoutId = setTimeout(tick, 1000);
      });
    });

  });
}

exports.start = function () {
  timeoutId = setTimeout(tick, 1000);
};

exports.stop = function () {
  if (timeoutId) {
    clearTimeout(timeoutId);  
  }
  
  timeoutId = null;
};