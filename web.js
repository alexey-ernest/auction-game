// env
if (!process.env.POSTGRES_CONNECTION) {
  console.log("POSTGRES_CONNECTION environment variable required.");
  process.exit(1);
}

var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var logger = require('morgan');
var pg = require('pg');

var defaults = require('./routes/default');
var routes = require('./routes');

var app = express();

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

// routes
app.use('/', routes);

// static
app.use('/', express.static(path.join(__dirname, 'public')));

// error handlers
app.use(defaults.notfound);
app.use(defaults.error);

module.exports = app;
