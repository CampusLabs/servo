module.exports = function (req, res, next) {
  var config = req.app.config;
  var ua = req.headers['user-agent'];
  if (!ua || ua === 'Amazon CloudFront') return next();
  var host = config.hosts[Math.floor(Math.random() * config.hosts.length)];
  res.redirect(req.protocol + '://' + host + req.url, 301);
};
