var _ = require('underscore');
var async = require('async');
var crypto = require('crypto');
var fs = require('fs');
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
  var hashes = {};
  async.each(_.pairs(req.files), function (pair, cb) {
    var key = pair[0];
    var info = pair[1];
    fs.readFile(info.path, function (er, file) {
      if (er) return cb(er);
      var hash = crypto.createHash('md5').update(file).digest('hex');
      s3.put('/' + hash, _.extend({
        'Content-Length': info.size,
        'Content-Type': mime.lookup(path.extname(info.name))
      }, config.headers))
      .on('response', function () {
        hashes[key] = hash;
        cb();
      })
      .on('error', cb)
      .end(file);
    });
  }, function (er) {
    if (er) return next(er);
    res.send(hashes);
  });
};
