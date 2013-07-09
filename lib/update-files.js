'use strict';

var _ = require('underscore');
var async = require('async');
var crypto = require('crypto');
var gm = require('gm');
var mime = require('mime');
var getFileFromRequest = require('./get-file-from-request');
var executeGmRoutine = require('./execute-gm-routine');

module.exports = function (req, res, next) {
  var config = req.app.config;
  var s3 = req.app.s3;
  var routine = req.body.routine;
  var file;
  var isImage;
  var info = {path: req.path};
  async.waterfall([
    async.apply(getFileFromRequest, req),
    function (file, type, cb) {
      info.type = type;
      isImage = type.indexOf('image') === 0;
      if (!isImage || !routine) return cb(null, file);
      executeGmRoutine(file, routine, cb);
    },
    function (_file, cb) {
      file = _file;
      if (info.path === '/') {
        info.path += crypto.createHash('md5').update(file).digest('hex');
      }
      info.size = file.length;
      if (!isImage) return cb();
      var gmFile = gm(file);
      async.parallel({
        size: async.apply(_.bind(gmFile.size, gmFile)),
        type: async.apply(_.bind(gmFile.format, gmFile))
      }, function (er, results) {
        if (er) return cb(er);
        _.extend(info, results.size);
        if (results.type) info.type = mime.lookup(results.type);
        cb();
      });
    },
    function (cb) {
      s3.put(info.path, _.extend({
        'Content-Length': info.size,
        'Content-Type': info.type
      }, config.headers))
      .on('response', _.bind(cb, null, null))
      .on('error', cb)
      .end(file);
    }
  ], function (er) {
    if (er) return next(er);
    res.send(_.pick(info, 'path', 'size', 'type', 'width', 'height'));
  });
};
