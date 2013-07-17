'use strict';

var express = require('express');
var knox = require('knox');

module.exports = function (config) {
  var app = express();

  // Store config on the app instance for global use.
  app.config = config;

  // Configure knox.
  app.s3 = knox.createClient({
    key: config.accessKeyId,
    secret: config.secretAccessKey,
    bucket: config.bucket
  });

  // Don't waste bytes on an extra header.
  app.disable('x-powered-by');

  // Helpful vendor middleware.
  app.use(express.compress());
  app.use(express.bodyParser());
  app.use(express.methodOverride());

  // Enable CORS on demand.
  if (config.cors) app.use(require('./lib/cors'));

  // Set req.authorized based on servo key.
  app.use(require('./lib/authorize'));

  // Upload files to the S3 bucket.
  app.put('*', require('./lib/update-files'));

  // Delete a file from the S3 bucket.
  app.del('*', require('./lib/delete-file'));

  // Requests should be in the form /path/to/image(-job-name)(.extension)
  app.get(
    /^(\/.*?)(?:-(.*?))?(?:\.(.*))?$/,
    require('./lib/check-user-agent'),
    require('./lib/read-file')
  );

  // Ensure bad responses aren't cached.
  app.use(require('./lib/handle-error'));

  // Start listening for requests.
  app.listen(config.port);
};
