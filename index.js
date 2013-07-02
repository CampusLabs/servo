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

// Requests should be in the form /path/to/image(-job-name).extension
app.get(/(\/.*?)(?:-(.*?))?(\..*)/, function (req, res, next) {
  var base = req.params[0];
  var type = req.params[1];
  var ext = req.params[2];
  if (type != null && !config.types[type]) return next();
  request({
    url: config.origin + base + ext,

    // `null` encoding is important, tells `request` to return the body as a
    // `Buffer` instance.
    encoding: null
  }, function (er, imgRes, body) {
    if (imgRes.statusCode !== 200) return res.send(imgRes.statusCode);
    _.reduce(config.types[type], function (image, command) {
      return _.reduce(command, function (image, args, key) {
        return image[key].apply(image, args);
      }, image);
    }, gm(body)).toBuffer(function (er, buffer) {
      if (er) return res.send(500);
      if (config.headers) res.set(config.headers);
      res.contentType(ext);
      res.send(buffer);
    });
  });
});
