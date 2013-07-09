'use strict';

var _ = require('underscore');

module.exports = function (s3, path, cb) {
  if (path === '/') return cb(404);
  s3.getFile(path, function (er, s3Res) {
    if (er) return cb(er);
    if (s3Res.statusCode !== 200) return cb(s3Res.statusCode);
    var chunks = [];
    s3Res
      .on('data', _.bind(chunks.push, chunks))
      .on('error', cb)
      .on('end', function () { cb(null, s3Res, Buffer.concat(chunks)); });
  });
};
