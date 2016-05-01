/**
 * @fileOverview POST /api/login endpoint.
 */

module.exports = function (req, res, next) {
  var json = {
    token: req.token
  };
  return res.json(json);
};