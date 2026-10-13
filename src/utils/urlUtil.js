// Sanitizes redirect URLs so they only point to internal pages
exports.getSafeRedirectUrl = (targetUrl, req, fallback = '/') => {
  if (!targetUrl || typeof targetUrl !== 'string') {
    return fallback;
  }

  const trimmed = targetUrl.trim();

  // Allow relative paths (e.g. /homes, /bookings)
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
    return trimmed;
  }

  // If given a full URL, make sure the host matches our own
  try {
    const parsed = new URL(trimmed);
    const host = req ? req.get('host') : null;
    if (host && parsed.host === host) {
      return parsed.pathname + parsed.search + parsed.hash;
    }
  } catch (e) {
    // Malformed URL
  }

  return fallback;
};
