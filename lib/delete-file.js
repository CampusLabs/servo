'use strict';

var config = require('../config');

module.exports = function (req, res, next) {
  if (!req.authorized) return next(403);
  req.app.s3.deleteObject({
    Bucket: config.bucket,
    Key: req.s3Key
  }, function (er) {
    if (er) return next(er);
    res.send(204);
  });
};
