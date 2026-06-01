const ensureAuthenticated = (req, res, next) => {
  if (req.user) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized. Please login first.' });
};

module.exports = { ensureAuthenticated };
