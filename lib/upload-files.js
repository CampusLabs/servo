var _ = require('underscore');
var async = require('async');
var crypto = require('crypto');
var fs = require('fs');
var gm = require('gm');
var mime = require('mime');
var path = require('path');
var knox = require('knox');

var s3;

module.exports = function (req, res, next) {
  var config = req.app.config;
  if (!s3) {
    s3 = knox.createClient({
      key: config.accessKeyId,
      secret: config.secretAccessKey,
      bucket: config.bucket
    });
  }
  if (req.headers['x-upload-key'] !== config.uploadKey) return next(403);
  var results = {};
  async.each(_.pairs(req.files), function (pair, cb) {
    var key = pair[0];
    var info = pair[1];
    var ext;
    var file;
    async.parallel([
      function (cb) {
        fs.readFile(info.path, function (er, _file) {
          if (er) return cb(er);
          file = _file;
          cb();
        });
      },
      function (cb) {
        gm(info.path).format(function (er, _ext) {
          ext = (er ? path.extname(info.name) : '.' + _ext).toLowerCase();
          cb();
        });
      }
    ], function (er) {
      if (er) return cb(er);
      var hash = crypto.createHash('md5').update(file).digest('hex');
      var name = hash + ext;
      s3.put('/' + name, _.extend({
        'Content-Length': info.size,
        'Content-Type': mime.lookup(ext)
      }, config.headers))
      .on('response', function () {
        results[key] = name;
        cb();
      })
      .on('error', cb)
      .end(file);
    });
  }, function (er) {
    if (er) return next(er);
    res.send(results);
  });
};
