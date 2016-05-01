/**
 * @fileOverview Auth endpoints.
 */

var express = require('express');
var router = express.Router();

var auth = require('../../../lib/middleware/auth');
var login = require('./login');
var logout = require('./logout');

/**
 * Log in endpoint.
 */
router.post('/login',
  auth.register('name'), // registers player by name
  auth.login(), // logs in user
  login // send token
  );

/**
 * Logout endpoint.
 */
router.delete('/logout',
  auth.private(),
  auth.logout(),
  logout
  );

module.exports = router;