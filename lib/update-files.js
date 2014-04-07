'use strict';

var _ = require('underscore');
var async = require('async');
var config = require('../config');
var crypto = require('crypto');
var gm = require('gm');
var mime = require('mime');
var getFileFromRequest = require('./get-file-from-request');
var executeGmRoutine = require('./execute-gm-routine');

module.exports = function (req, res, next) {
  if (!req.authorized) return next(403);
  var s3 = req.app.s3;
  var max = config.maxImageDimension;
  var routine = (req.param('routine') ? req.param('routine') + ';' : '') +
    (max ? 'scale:' + max + ',' + max + ',>' : '');
  var file;
  var isImage;
  var info = {bucket: config.bucket, key: req.s3Key};
  async.waterfall([
    async.apply(getFileFromRequest, req),
    function (file, _info, cb) {
      _.extend(info, _info);
      isImage = info.type.indexOf('image') === 0;
      if (!isImage || !routine) return cb(null, file);
      executeGmRoutine(file, routine, cb);
    },
    function (_file, cb) {
      file = _file;
      if (!info.key) {
        var hash = crypto.createHash(config.hashAlgorithm);
        hash.end(file);
        info.key = hash.read().toString('hex');
      }
      info.size = file.length;
      var max = config.maxFileSize;
      if (max && info.size > max) return cb(413);
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
      s3.putObject({
        Bucket: info.bucket,
        Key: info.key,
        Body: file,
        ContentLength: info.size,
        ContentType: info.type,
        CacheControl: config.cacheControl,
        ACL: 'private',
        Metadata: {
          acl: req.param('acl') || 'private',
          name: info.name
        }
      }, cb);
    }
  ], function (er) {
    if (er) return next(er);
    res.send(info);
  });
};
