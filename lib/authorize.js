'use strict';

module.exports = function (req, res, next) {
  var config = req.app.config;
  if (req.headers['x-servo-key'] !== config.servoKey) return next(403);
  next();
};
