'use strict';

var config = require('../config');

module.exports = function (req, res, next) {
  req.authorized = req.param('servoKey') === config.servoKey;
  next();
};
