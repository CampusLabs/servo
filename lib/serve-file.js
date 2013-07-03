var _ = require('underscore');
var gm = require('gm');
var request = require('request');

module.exports = function (req, res, next) {
  var config = req.app.config;
  var base = req.params[0];
  var key = req.params[1];
  var size = config.sizes[key];
  var ext = req.params[2] || '';
  if (key != null && !size) return next(404);
  console.log(req.params);
  request({
    url: 'https://s3.amazonaws.com/' + config.bucket + base + ext,

    // `null` encoding is important, tells `request` to return the body as a
    // `Buffer` instance.
    encoding: null
  }, function (er, s3Res, body) {
    if (er) return next(er);
    //console.log(s3Res);
    if (s3Res.statusCode !== 200) return next(s3Res.statusCode);
    if (key == null) {
      res.contentType(ext);
      return res.send(body);
    }
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
};
