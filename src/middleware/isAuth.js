const { getSafeRedirectUrl } = require('../utils/urlUtil');

module.exports = (req, res, next) => {
  if (!req.session || !req.session.isLoggedIn) {
    // Only remember return url for GET requests to prevent 404s on redirected POST requests
    if (req.method === 'GET') {
      req.session.returnTo = getSafeRedirectUrl(req.originalUrl, req, '/');
    } else {
      req.session.returnTo = getSafeRedirectUrl(req.get('Referrer'), req, '/');
    }
    return res.redirect('/login');
  }
  next();
};
