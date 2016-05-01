/**
 * @fileOverview GET /api/player endpoint.
 */

var PlayerModel = require('../../../lib/player-model');

module.exports = function (req, res, next) {
  var model = PlayerModel.create();
  model.update(req.player, '*');
  res.json(model.toJSON(['default', 'private']));
};