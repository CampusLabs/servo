'use strict';

var config = require('../config');

module.exports = function (req, res, next) {
  var ua = req.headers['user-agent'];
  var validUa = !ua || ua === 'Amazon CloudFront';
  var hosts = config.hosts;
  if (req.authorized || validUa || !hosts) return next();
  var host = hosts[Math.floor(Math.random() * hosts.length)];
  res.redirect(req.protocol + '://' + host + req.url, 301);
};
