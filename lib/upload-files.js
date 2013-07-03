var _ = require('underscore');
var crypto = require('crypto');
var fs = require('fs');
var gm = require('gm');
var mime = require('mime');
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
  _.each(req.files, function (fileInfo) {
    gm(fileInfo.path).format(function (er, ext) {
      if (er || !ext) return next(er || 500);
      fs.readFile(fileInfo.path, function (er, file) {
        if (er) return next(er);
        var hash = crypto.createHash('md5').update(file).digest('hex');
        var name = hash + '.' + ext.toLowerCase();
        s3.put('/' + name, _.extend({
          'Content-Length': fileInfo.size,
          'Content-Type': mime.lookup(ext)
        }, config.headers))
        .on('response', function () { res.send({file: name}); })
        .on('error', function (er) { next(er); })
        .end(file);
      });
    });
  });
};
