'use strict';

var _ = require('underscore');
var config = require('../config');
var executeGmRoutine = require('./execute-gm-routine');
var mime = require('mime');

module.exports = function (req, res, next) {
  var s3 = req.app.s3;
  if (req.authorized) {
    return res.redirect(302, s3.getSignedUrl('getObject', {
      Bucket: config.bucket,
      Key: req.s3Key,
      Expires: (+req.headers['x-servo-ttl'] || 60) * 1000,
      ResponseContentDisposition: req.headers['x-servo-content-disposition']
    }));
  }
  var key = req.params[0].slice(1);
  var routineKey = req.params[1];
  var ext = req.params[2];
  var routine = config.routines[key];
  var badRoutine = routineKey != null && !routine;
  var badExt = ext && !_.contains(config.extensions, ext);
  if (badRoutine || badExt) return next(404);
  if (ext) routine = _.compact([routine, 'setFormat:' + ext]).join(';');
  s3.getObject({
    Bucket: config.bucket,
    Key: key
  }, function (er, data) {
    if (er) return next(er);
    if (data.Metadata.acl !== 'public-read') return next(403);
    var type = data.ContentType;
    if (!ext) ext = mime.extension(type);
    res.set(config.headers).contentType(ext);
    if (type.indexOf('image') !== 0 || !routine) return res.send(data.Body);
    executeGmRoutine(data.Body, routine, function (er, image) {
      if (er) return next(er);
      res.send(image);
    });
  });
};
