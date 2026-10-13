const { getSafeRedirectUrl } = require('../utils/urlUtil');

module.exports = (req, res, next) => {
  if (!req.session || !req.session.isLoggedIn) {
    if (req.method === 'GET') {
      req.session.returnTo = getSafeRedirectUrl(req.originalUrl, req, '/');
    } else {
      req.session.returnTo = getSafeRedirectUrl(req.get('Referrer'), req, '/');
    }
    return res.redirect('/login');
  }

  if (req.session.user && req.session.user.userType === 'host') {
    return next();
  }

  // Guests don't have host access
  res.status(403).render('403', {
    pageTitle: 'Host Access Required',
    message: 'You need a Host account to access property management features.'
  });
};
