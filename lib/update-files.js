'use strict';

var _ = require('underscore');
var async = require('async');
var crypto = require('crypto');
var fs = require('fs');
var gm = require('gm');
var mime = require('mime');

module.exports = function (req, res, next) {
  var config = req.app.config;
  var s3 = req.app.s3;
  var results = {};
  async.each(_.pairs(req.files), function (pair, cb) {
    var key = pair[0];
    var info = pair[1];
    var val = results[key] = {
      path: req.path,
      name: info.name,
      size: info.size,
      type: mime.lookup(info.name)
    };
    var file;
    async.waterfall([
      async.apply(fs.readFile, info.path),
      function (file, cb) {
        if (val.path === '/') {
          val.path += crypto.createHash('md5').update(file).digest('hex');
        }
        gm(file).size(function (er, data) {
          _.extend(val, data);
          cb();
        });
      }
    ], function (er) {
      if (er) return cb(er);
      s3.put(val.path, _.extend({
        'Content-Length': val.length,
        'Content-Type': val.type
      }, config.headers))
      .on('response', _.bind(cb, null, null))
      .on('error', cb)
      .end(file);
    });
  }, function (er) {
    if (er) return next(er);
    res.send(results);
  });
};
