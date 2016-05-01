/**
 * @fileOverview Auction endpoint.
 */

var express = require('express');
var router = express.Router();
var moment = require('moment');

var db = require('../../../lib/db');
var Auction = db.Auction;
var auctionService = require('../../../lib/auction-service')(db);
var auth = require('../../../lib/middleware/auth');


/**
 * Helper method for mapping db auction items.
 *
 * @method     mapAuction
 * @param      {Object}  i       Auction object.
 * @return     {Object}  Mapped Object.
 */
function mapAuction(i) {
  var json = {
    id: i.id,
    created: i.created,
    start_time: i.start_time,
    end_time: i.end_time,
    seller: i.seller,
    seller_name: i.seller_name,
    item: i.item,
    quantity: i.quantity,
    min_bid: i.min_bid,
    bid: i.bid,
    winner: i.winner,
    winner_name: i.winner_name
  };

  if (i.timeLeft) {
    json.timeLeft = i.timeLeft;
  }

  return json;
}

/**
 * Helper function for processing common errors.
 *
 * @method     handleErrorResult
 * @param      {Object}  result  Result object: {ok, type, error}
 * @param      {Object}  res     Response object.
 */
function handleErrorResult(result, res) {
  if (result.type === 'badRequest') {
    res.statusCode = 400;
  } else if (result.type === 'notFound') {
    res.statusCode = 404;
  } else {
    res.statusCode = 403;
  }
  
  return res.json({message: result.error});
}

/**
 * Get current auction.
 */
router.get('/',
  auth.private(),
  function (req, res, next) {
    Auction.getCurrent(function (err, auction) {
      if (err) return next(err);
      if (!auction) {
        return res.end();
      }

      // calculating time left
      var endMoment = moment(auction.end_time);
      var nowMoment = moment();
      var timeLeft = endMoment.diff(nowMoment, 's');
      auction.timeLeft = timeLeft;

      res.json(mapAuction(auction));
    });
  });

/**
 * Get latest auction.
 */
router.get('/latest',
  auth.private(),
  function (req, res, next) {
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

      res.json(mapAuction(auction));
    });
  });

/**
 * Get auction by id.
 */
router.get('/:id',
  auth.private(),
  function (req, res, next) {
    Auction.get(req.params.id, function (err, auction) {
      if (err) return next(err);
      if (!auction) {
        return res.status(404).end();
      }
      res.json(mapAuction(auction));
    });
  });

/**
 * Add new auction to the queue.
 */
router.post('/',
  auth.private(),
  function (req, res, next) {
    auctionService.queueAuction(req.player, req.body, 
      function (err, result) {
        if (err) return next(err);
        if (!result.ok) {
          // auction cannot be accepted
          return handleErrorResult(result, res);
        }

        var json = mapAuction(result.auction);
        if (!result.current_auction) {
          // there is no other auction currently in process
          res.statusCode = 201; // CREATED
        } else {
          // auction added to the queue
          res.statusCode = 202; // ACCEPTED for further processing (queued)
        }

        res.json(json);
      });
  });

/**
 * Makes a bet on current auction.
 */
router.post('/bet',
  auth.private(),
  function (req, res, next) {
    auctionService.bet(req.player, req.body.bid, function (err, result) {
      if (err) return next(err);
      if (!result.ok) {
        // the bet could not be accepted
        return handleErrorResult(result, res);
      }

      var json = mapAuction(result.auction);
      res.status(200).json(json);
    });
  });

/**
 * Cancel queued auction.
 */
router.delete('/:id',
  auth.private(),
  function (req, res, next) {
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
  });

module.exports = router;
