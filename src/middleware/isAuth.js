module.exports = (req, res, next) => {
  if (!req.session || !req.session.isLoggedIn) {
    // Only remember return url for GET requests to prevent 404s on redirected POST requests
    if (req.method === 'GET') {
      req.session.returnTo = req.originalUrl;
    } else {
      req.session.returnTo = req.get('Referrer') || '/';
    }
    return res.redirect('/login');
  }
  next();
};
