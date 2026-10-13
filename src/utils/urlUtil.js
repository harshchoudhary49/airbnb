/**
 * Safe Redirect URL Validator
 * Prevents Open Redirect vulnerabilities by ensuring target URLs
 * are local relative paths and not external or malformed URLs.
 */
exports.getSafeRedirectUrl = (targetUrl, req, fallback = '/') => {
  if (!targetUrl || typeof targetUrl !== 'string') {
    return fallback;
  }

  const trimmed = targetUrl.trim();

  // Strictly allow relative paths that start with '/' and not '//' or '/\'
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
    return trimmed;
  }

  // If absolute URL, ensure it strictly matches the current application host
  try {
    const parsed = new URL(trimmed);
    const host = req ? req.get('host') : null;
    if (host && parsed.host === host) {
      return parsed.pathname + parsed.search + parsed.hash;
    }
  } catch (e) {
    // Malformed URL, fallback
  }

  return fallback;
};
