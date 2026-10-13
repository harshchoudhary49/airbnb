const { getSafeRedirectUrl } = require('../utils/urlUtil');

module.exports = (req, res, next) => {
  if (!req.session || !req.session.isLoggedIn) {
    // Remember where the user was headed (GET requests only)
    if (req.method === 'GET') {
      req.session.returnTo = getSafeRedirectUrl(req.originalUrl, req, '/');
    } else {
      req.session.returnTo = getSafeRedirectUrl(req.get('Referrer'), req, '/');
    }
    return res.redirect('/login');
  }
  next();
};
