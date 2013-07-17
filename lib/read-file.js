'use strict';

var _ = require('underscore');
var executeGmRoutine = require('./execute-gm-routine');
var readS3File = require('./read-s3-file');
var mime = require('mime');

module.exports = function (req, res, next) {
  var config = req.app.config;
  var base = req.params[0];
  var key = req.params[1];
  var ext = req.params[2];
  var routine = config.routines[key];
  var badKey = key != null && !routine;
  var badExt = ext && !_.contains(config.extensions, ext);
  if (badKey || badExt) return next(404);
  if (ext) routine = _.compact([routine, 'setFormat:' + ext]).join(';');
  readS3File(req.app.s3, base, function (er, s3Res, file) {
    if (er) return next(er);
    if (s3Res.headers['x-amz-meta-acl'] !== 'public-read') {
      if (!req.authorized) return next(403);
      var ttl = (req.headers['x-url-ttl'] || 60) * 1000;
      var expiration = new Date(+ new Date() + ttl);
      return res.redirect(302, req.app.s3.signedUrl(req.path, expiration));
    }
    var type = s3Res.headers['content-type'];
    if (!ext) ext = mime.extension(type);
    res.set(config.headers).contentType(ext);
    if (type.indexOf('image') !== 0 || !routine) return res.send(file);
    executeGmRoutine(file, routine, function (er, image) {
      if (er) return next(er);
      res.send(image);
    });
  });
};
