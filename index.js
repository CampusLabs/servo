var _ = require('underscore');
var config = require(process.argv[2] || './crop');
var crypto = require('crypto');
var express = require('express');
var fs = require('fs');
var gm = require('gm');
var http = require('http');
var knox = require('knox');
var mime = require('mime');
var request = require('request');

var app = express();

app.listen(config.port);

// Don't waste bytes on an extra header.
app.disable('x-powered-by');

// Parse the request body for POSTing files.
app.use(express.bodyParser());

var s3 = knox.createClient({
  key: config.accessKeyId,
  secret: config.secretAccessKey,
  bucket: config.bucket
});

app.post('/', function (req, res, next) {
  if (req.headers['x-upload-key'] !== config.uploadKey) return next(403);
  _.each(req.files, function (fileInfo) {
    gm(fileInfo.path).format(function (er, ext) {
      if (er || !ext) return next(er || 500);
      fs.readFile(fileInfo.path, function (er, file) {
        if (er) return next(er);
        var hash = crypto.createHash('md5').update(file).digest('hex');
        var name = hash + '.' + ext.toLowerCase();
        s3.put('/' + name, _.extend({
          'Content-Length': fileInfo.size,
          'Content-Type': mime.lookup(ext)
        }, config.headers))
        .on('response', function () { res.send({file: name}); })
        .on('error', function (er) { next(er); })
        .end(file);
      });
    });
  });
});

// Redirect to hosts specified in config if the UA is bad.
app.use(function (req, res, next) {
  var ua = req.headers['user-agent'];
  if (!ua || ua === 'Amazon CloudFront') return next();
  var host = config.hosts[Math.floor(Math.random() * config.hosts.length)];
  res.redirect(req.protocol + '://' + host + req.url, 301);
});

// Requests should be in the form /path/to/image(-job-name).extension
app.get(new RegExp(config.pattern), function (req, res, next) {
  var base = req.params[0];
  var key = req.params[1];
  var size = config.sizes[key];
  var ext = req.params[2];
  if (key != null && !size) return next(404);
  request({
    url: config.origin + base + ext,

    // `null` encoding is important, tells `request` to return the body as a
    // `Buffer` instance.
    encoding: null
  }, function (er, imgRes, body) {
    if (er) return next(er);
    if (imgRes.statusCode !== 200) return next(imgRes.statusCode);
    _.reduce(size, function (image, command) {
      return _.reduce(command, function (image, args, key) {
        return image[key].apply(image, args);
      }, image);
    }, gm(body)).toBuffer(function (er, buffer) {
      if (er) return next(er);
      if (config.headers) res.set(config.headers);
      res.contentType(ext);
      res.send(buffer);
    });
  });
});

// Ensure bad responses aren't cached.
app.use(function (er, req, res, next) {
  res.set('Cache-Control', 'no-cache');

  // Log interesting errors.
  if (!_.isNumber(er)) console.error(er.stack || er);

  // Send an empty response body.
  res.send(http.STATUS_CODES[er] ? er : 500, '');
});

