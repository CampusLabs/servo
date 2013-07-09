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
  routine = routine ? routine.slice() : [];
  if (ext) routine.push({setFormat: [ext]});
  readS3File(req.app.s3, base, function (er, s3Res, body) {
    if (er) return next(er);
    var contentType = s3Res.headers['content-type'];
    if (!ext) ext = mime.extension(contentType);
    res.set(config.headers).contentType(ext);
    if (contentType.indexOf('image') !== 0) {
      if (key != null) return next(404);
      return res.send(body);
    }
    executeGmRoutine(body, routine, function (er, image) {
      if (er) return next(er);
      res.send(image);
    });
  });
};
