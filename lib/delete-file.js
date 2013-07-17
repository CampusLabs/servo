'use strict';

module.exports = function (req, res, next) {
  if (req.authorized) return next(403);
  req.app.s3.deleteFile(req.path, function (er) {
    if (er) return next(500);
    res.send({});
  });
};
