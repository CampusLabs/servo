var _ = require('underscore');
var http = require('http');

module.exports = function (er, req, res, next) {
  res.set('Cache-Control', 'no-cache');

  // Log interesting errors.
  if (!_.isNumber(er)) console.error(er.stack || er);

  // Send an empty response body.
  res.send(_.has(http.STATUS_CODES, er) ? er : 500, '');
};
