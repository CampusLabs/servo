'use strict';

var _ = require('underscore');
var gm = require('gm');

module.exports = function (image, routine, cb) {
  _.reduce(routine.split(';'), function (image, command) {
    var split = command.split(':');
    var method = split[0];
    var args = split[1] ? split[1].split(',') : [];
    return image[method].apply(image, args);
  }, gm(image)).toBuffer(cb);
};
