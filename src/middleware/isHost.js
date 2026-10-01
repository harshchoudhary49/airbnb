module.exports = (req, res, next) => {
  if (!req.session || !req.session.isLoggedIn) {
    if (req.method === 'GET') {
      req.session.returnTo = req.originalUrl;
    } else {
      req.session.returnTo = req.get('Referrer') || '/';
    }
    return res.redirect('/login');
  }

  if (req.session.user && req.session.user.userType === 'host') {
    return next();
  }

  // If user is a guest trying to access host areas
  res.status(403).render('403', {
    pageTitle: 'Host Access Required',
    message: 'You need a Host account to access property management features.'
  });
};
