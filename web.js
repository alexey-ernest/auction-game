// env
if (!process.env.POSTGRES_CONNECTION) {
  console.log("POSTGRES_CONNECTION environment variable required.");
  process.exit(1);
}

if (!process.env.SESSION_SECRET) {
  console.log("SESSION_SECRET environment variable required.");
  process.exit(1);
}

var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var logger = require('morgan');
var session = require('express-session');
var pg = require('pg');
var pgSession = require('connect-pg-simple')(session);

var routes = require('./routes');
var api = require('./routes/api');

var app = express();

// session
app.use(session({
  store: new pgSession({
    pg : pg,
    conString : process.env.POSTGRES_CONNECTION,
    tableName : 'session'
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days 
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// logger
if (app.get('env') === 'development') {
  app.use(logger('dev'));
} else {
  app.use(logger());
}

// body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// api
app.use('/api', api);

// static
app.use('/', express.static(path.join(__dirname, 'public')));

// error handlers
app.use(routes.notfound);
app.use(routes.error);

module.exports = app;
