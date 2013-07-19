module.exports = function (req, res, next) {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'X-Servo-Key, X-Servo-Ttl, X-Servo-Disposition',
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE'
  });
  if (req.method === 'OPTIONS') return res.send(204);
  next();
};
