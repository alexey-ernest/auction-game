/**
 * @fileOverview Auth endpoints.
 */

var express = require('express');
var router = express.Router();

var auth = require('../../../lib/middleware/auth');

/**
 * Log in endpoint.
 */
router.post('/login',
  auth.register('name'), // registers player by name
  auth.login(), // logs in user
  function (req, res, next) {
    var json = {
      token: req.token
    };
    return res.json(json);
  });

/**
 * Logout endpoint.
 */
router.delete('/logout',
  auth.private(),
  auth.logout(),
  function (req, res, next) {
    res.end();
  });

module.exports = router;