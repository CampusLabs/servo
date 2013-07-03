var express = require('express');

module.exports = function (config) {
  var app = express();

  // Store config on the app instance for global use.
  app.config = config;

  app.listen(config.port);

  // Don't waste bytes on an extra header.
  app.disable('x-powered-by');

  // Helpful vendor middleware.
  app.use(express.compress());
  app.use(express.bodyParser());
  app.use(express.methodOverride());

  // Upload posted files to the S3 bucket.
  app.post('/', require('./lib/upload-files'));

  // Requests should be in the form /path/to/image(-job-name).extension
  app.get(
    /^(\/.*?)(?:-(.*?))?(?:\.(.*))?$/,
    require('./lib/check-user-agent'),
    require('./lib/serve-file')
  );

  // Ensure bad responses aren't cached.
  app.use(require('./lib/error-handler'));
};
