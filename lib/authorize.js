'use strict';

module.exports = function (req, res, next) {
  req.authorized = req.headers['x-servo-key'] === req.app.config.servoKey;
  next();
};
