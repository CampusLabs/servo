'use strict';

var fs = require('fs');
var mime = require('mime');
var readS3File = require('./read-s3-file');

module.exports = function (req, cb) {
  if (req.files.file) {
    var info = req.files.file;
    return fs.readFile(info.path, function (er, file) {
      if (er) return cb(er);
      cb(null, file, {name: info.name, type: mime.lookup(info.name)});
    });
  }
  if (req.body.path) {
    return readS3File(req.app.s3, req.body.path, function (er, s3Res, file) {
      if (er) return cb(er);
      cb(null, file, {
        name: s3Res.headers['x-amz-meta-name'],
        type: s3Res.headers['content-type']
      });
    });
  }
  cb(400);
};
