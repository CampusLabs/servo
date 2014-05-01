'use strict';

try {
  module.exports = require(require('path').resolve(process.argv[2]));
} catch (er) {
  throw new Error('Please specify a config file as the first argument');
}
