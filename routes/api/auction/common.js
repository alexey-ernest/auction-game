/**
 * @fileOverview Auction common functionality.
 */

/**
 * Helper method for mapping db auction items.
 *
 * @method     mapAuction
 * @param      {Object}  i       Auction object.
 * @return     {Object}  Mapped Object.
 */
 exports.mapAuction = function (i) {
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
 };


 /**
 * Helper function for processing common errors.
 *
 * @method     handleErrorResult
 * @param      {Object}  result  Result object: {ok, type, error}
 * @param      {Object}  res     Response object.
 */
exports.handleErrorResult = function (result, res) {
  if (result.type === 'badRequest') {
    res.statusCode = 400;
  } else if (result.type === 'notFound') {
    res.statusCode = 404;
  } else {
    res.statusCode = 403;
  }
  
  return res.json({message: result.error});
};
