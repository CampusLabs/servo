'use strict';

var _ = require('underscore');
var config = require('../config');
var executeGmRoutine = require('./execute-gm-routine');
var readS3File = require('./read-s3-file');
var mime = require('mime');

module.exports = function (req, res, next) {
  var s3 = req.app.s3;
  if (req.authorized) {
    var ttl = (+req.headers['x-servo-ttl'] || 60) * 1000;
    var expiration = new Date(+ new Date() + ttl);
    var options = {};
    var disposition = req.headers['x-servo-disposition'];
    if (disposition) options.qs = {'response-content-disposition': disposition};
    return res.redirect(302, s3.signedUrl(req.path, expiration, options));
  }
  var base = req.params[0];
  var key = req.params[1];
  var ext = req.params[2];
  var routine = config.routines[key];
  var badKey = key != null && !routine;
  var badExt = ext && !_.contains(config.extensions, ext);
  if (badKey || badExt) return next(404);
  if (ext) routine = _.compact([routine, 'setFormat:' + ext]).join(';');
  readS3File(s3, base, function (er, s3Res, file) {
    if (er) return next(er);
    if (s3Res.headers['x-amz-meta-acl'] !== 'public-read') return next(403);
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
