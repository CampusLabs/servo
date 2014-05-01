'use strict';

try {
  var path = process.env.SERVO_CONFIG || process.argv[2];
  module.exports = require(require('path').resolve(path));
} catch (er) {
  throw new Error('Please specify a config file as the first argument');
}
