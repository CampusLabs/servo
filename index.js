'use strict';

var _ = require('underscore');
var config = require('./config');
var express = require('express');
var AWS = require('aws-sdk');
var formidable = require('formidable');

var app = express();

// Configure AWS.
AWS.config.update({
  accessKeyId: config.accessKeyId,
  secretAccessKey: config.secretAccessKey,
});
app.s3 = new AWS.S3({apiVersion: config.apiVersion});

// Don't waste bytes on an extra header.
app.disable('x-powered-by');

// Helpful vendor middleware.
app.use(express.compress());
app.use(express.urlencoded());
app.use(express.json());
app.use(express.methodOverride());

// Replacement for connect.multipart()
app.use(function (req, res, next) {
  var form = new formidable.IncomingForm();
  form.parse(req, function (er, fields, files) {
    if (er) return next(er);
    _.extend(req.body, fields);
    req.files = files;
    next();
  });
});

// Store the s3Key for the request path in req.s3Key. This is essentially the
// path sans the leading slash.
app.use(function (req, res, next) {
  req.s3Key = req.path.slice(1);
  next();
});

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
var server = app.listen(config.port);

process.on('SIGTERM', _.bind(server.close, server));
