'use strict';

var _ = require('underscore');
var gm = require('gm');
var mime = require('mime');

module.exports = function (req, res, next) {
  var config = req.app.config;
  var base = req.params[0];
  var key = req.params[1];
  var ext = req.params[2];
  var size = config.sizes[key];
  var badKey = key != null && !size;
  var badExt = ext && !_.contains(config.extensions, ext);
  if (badKey || badExt) return next(404);
  size = size ? size.slice() : [];
  if (ext) size.push({setFormat: [ext]});
  req.app.s3.getFile(base, function (er, s3Res) {
    if (er) return next(er);
    if (s3Res.statusCode !== 200) return next(s3Res.statusCode);
    var chunks = [];
    s3Res.on('data', _.bind(chunks.push, chunks)).on('end', function () {
      var body = Buffer.concat(chunks);
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
      }, gm(body)).toBuffer(function (er, buffer) {
        if (er) return next(er);
        res.send(buffer);
      });
    });
  });
};
