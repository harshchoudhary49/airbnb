const crypto = require('crypto');

/**
 * Session-based CSRF Protection Middleware
 * Generates a cryptographically strong token per session and verifies it on state-changing methods.
 */
module.exports = (req, res, next) => {
  if (!req.session) {
    return next();
  }

  // Ensure a CSRF token exists for the current user session
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }

  // Expose the CSRF token to all templates/views
  res.locals.csrfToken = req.session.csrfToken;

  // Safe HTTP methods do not mutate state
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Verify the CSRF token on mutating requests (POST, PUT, DELETE, PATCH)
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
