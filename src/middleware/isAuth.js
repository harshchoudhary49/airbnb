module.exports = (req, res, next) => {
  if (!req.session || !req.session.isLoggedIn) {
    // Remember return url
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
  }
  next();
};
