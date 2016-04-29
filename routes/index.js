exports.notfound = function (req, res) {
  res.status(404).format({
    html: function () {
      res.render('404', { title: '404 Not Found'});
    },
    json: function () {
      res.send({ message: 'Resource not found' });
    },
    xml: function () {
      res.write('<error>\n');
      res.write('    <message>Resource not found</message>\n');
      res.end('</error>\n');
    },
    text: function () {
      res.send('Resource not found\n');
    }
  });
};

exports.error = function (err, req, res, next) {
  console.log(err.stack);
  var msg;

  switch (err.type) {
    case 'database':
      msg = 'Service Unavailable';
      res.statusCode = 503;
      break;
    default:
      msg = 'Internal Server Error';
      res.statusCode = 500;
  }

  res.format({
    html: function () {
      res.render('5xx', { title: msg, msg: msg, status: res.statusCode });
    },
    json: function () {
      res.send({ error: msg });
    },
    xml: function () {
      res.write('<error>\n');
      res.write('    <message>' + msg + '</message>\n');
      res.end('</error>\n');
    },
    text: function () {
      res.send(msg + '\n');
    }
  });
};
