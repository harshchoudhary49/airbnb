const crypto = require('crypto');

// Validates CSRF tokens on state-changing requests
module.exports = (req, res, next) => {
  if (!req.session) {
    return next();
  }

  // Create token if one doesn't exist yet
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }

  // Make token available to templates
  res.locals.csrfToken = req.session.csrfToken;

  // Read-only requests are safe to pass through
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Check incoming token against the session token
  const incomingToken =
    (req.body && req.body._csrf) ||
    req.headers['x-csrf-token'] ||
    req.headers['csrf-token'];

  if (!incomingToken || incomingToken !== req.session.csrfToken) {
    console.warn(`[Security Alert] CSRF token mismatch from IP: ${req.ip} on ${req.originalUrl}`);
    return res.status(403).render('403', {
      pageTitle: 'Forbidden - Invalid Token',
      message: 'Invalid or missing CSRF token. The request was blocked to protect your account against cross-site request forgery.'
    });
  }

  next();
};
