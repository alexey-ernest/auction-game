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

var routes = require('./routes');
var api = require('./routes/api');

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

// api
app.use('/api', api);

// static
app.use('/', express.static(path.join(__dirname, 'public')));

// error handlers
app.use(routes.notfound);
app.use(routes.error);

module.exports = app;
