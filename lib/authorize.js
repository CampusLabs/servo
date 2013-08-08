'use strict';

var config = require('../conig');

module.exports = function (req, res, next) {
  req.authorized = req.headers['x-servo-key'] === config.servoKey;
  next();
};
