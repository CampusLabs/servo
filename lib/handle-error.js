'use strict';

var _ = require('underscore');
var http = require('http');

module.exports = function (er, req, res, next) {
  res.set('Cache-Control', 'no-cache');

  // Log interesting errors.
  if (!_.isNumber(er)) console.error(er.stack || er);

  // Get the status code associated with the error.
  var message = http.STATUS_CODES[er] || http.STATUS_CODES[er = 500];
  var status = er;

  // Return an error message, taking the accepts header into account.
  if (!req.accepts('json')) return res.send(status);
  res.send(status, {error: message});
};
