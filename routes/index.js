/**
 * @fileOverview HTTP endpoints.
 */

var express = require('express');
var router = express.Router();

var api = require('./api');
router.use('/api', api);

/**
 * Healthcheck endpoint.
 */
router.get('/heartbeat', function (req, res) {
  res.send();
});

module.exports = router;
