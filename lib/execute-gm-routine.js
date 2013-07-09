'use strict';

var _ = require('underscore');
var gm = require('gm');

module.exports = function (image, routine, cb) {
  _.reduce(routine, function (image, command) {
    return _.reduce(command, function (image, args, method) {
      return image[method].apply(image, args);
    }, image);
  }, gm(image)).toBuffer(cb);
};
