var _ = require('underscore');
var config = require(process.argv[2] || './crop');
var express = require('express');
var gm = require('gm');
var request = require('request');

var app = express();
app.listen(config.port);

// Express will be running behind nginx, so let it know.
app.enable('trust proxy');

// All lower case and no trailing slashes allowed.
app.enable('case sensitive routing');
app.enable('strict routing');

// Don't waste bytes on an extra header.
app.disable('x-powered-by');

// Redirect to hosts specified in config.
app.use(function (req, res, next) {
  var proto = req.protocol;
  var path = req.path.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
  var query = req.url.replace(/^[^?]*/, '');
  var current = proto + '://' + req.host + req.url;
  var host =
    ~_.indexOf(config.hosts, req.host) ?
    req.host :
    config.hosts[Math.floor(Math.random() * config.hosts.length)];
  var correct = (proto + '://' + host + path).toLowerCase() + query;
  if (current === correct) return next();
  res.redirect(correct, 301);
});

// Requests should be in the form /path/to/image(-job-name).extension
app.get(new RegExp(config.pattern), function (req, res, next) {
  var base = req.params[0];
  var key = req.params[1];
  var size = config.sizes[key];
  var ext = req.params[2];
  if (key != null && !size) return next(404);
  request({
    url: config.origin + base + ext,

    // `null` encoding is important, tells `request` to return the body as a
    // `Buffer` instance.
    encoding: null
  }, function (er, imgRes, body) {
    if (er) return next(er);
    if (imgRes.statusCode !== 200) return next(imgRes.statusCode);
    _.reduce(size, function (image, command) {
      return _.reduce(command, function (image, args, key) {
        return image[key].apply(image, args);
      }, image);
    }, gm(body)).toBuffer(function (er, buffer) {
      if (er) return next(er);
      if (config.headers) res.set(config.headers);
      res.contentType(ext);
      res.send(buffer);
    });
  });
});

// Ensure bad responses aren't cached.
app.use(function (er, req, res, next) {
  res.set('Cache-Control', 'no-cache');
  res.send(404, '');
});
