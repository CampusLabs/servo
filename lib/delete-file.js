'use strict';

module.exports = function (req, res, next) {
  req.app.s3.deleteFile(req.path, function (er) {
    if (er) return next(500);
    res.send();
  });
};
