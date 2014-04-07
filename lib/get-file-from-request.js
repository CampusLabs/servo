'use strict';

var config = require('../config');
var fs = require('fs');
var mime = require('mime');

module.exports = function (req, cb) {
  if (req.files.file) {
    var info = req.files.file;
    return fs.readFile(info.path, function (er, file) {
      if (er) return cb(er);
      cb(null, file, {name: info.name, type: mime.lookup(info.name)});
    });
  }
  if (req.param('key')) {
    return req.app.s3.getObject({
      Bucket: req.param('bucket') || config.bucket,
      Key: req.param('key')
    }, function (er, data) {
      if (er) return cb(er);
      cb(null, data.body, {
        name: data.Metadata.name,
        type: data.ContentType
      });
    });
  }
  cb(400);
};
