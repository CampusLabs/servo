var _ = require('underscore');
var gm = require('gm');
var mime = require('mime');
var request = require('request');

module.exports = function (req, res, next) {
  var config = req.app.config;
  var base = req.params[0];
  var key = req.params[1];
  var size = config.sizes[key];
  var ext = req.params[2];
  var badKey = key != null && !size;
  var badExt = ext && !_.contains(config.extensions, ext);
  if (badKey || badExt) return next(404);
  request({
    url: 'https://s3.amazonaws.com/' + config.bucket + base,
    encoding: null
  }, function (er, s3Res, body) {
    if (er) return next(er);
    if (s3Res.statusCode !== 200) return next(s3Res.statusCode);
    var contentType = s3Res.headers['content-type'];
    if (!ext) ext = mime.extension(contentType);
    res.set(config.headers).contentType(ext);
    if (contentType.indexOf('image') !== 0) {
      if (key != null) return next(404);
      return res.send(body);
    }
    _.reduce(size, function (image, command) {
      return _.reduce(command, function (image, args, key) {
        return image[key].apply(image, args);
      }, image);
    }, gm(body)).setFormat(ext).toBuffer(function (er, buffer) {
      if (er) return next(er);
      res.send(buffer);
    });
  });
};
