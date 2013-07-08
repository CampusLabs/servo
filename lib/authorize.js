'use strict';

module.exports = function (req, res, next) {
  var config = req.app.config;
  if (req.headers['x-upload-key'] !== config.uploadKey) return next(403);
  next();
};
