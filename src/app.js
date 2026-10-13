require('dotenv').config();

const path = require('path');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const storeRouter = require('./routes/storeRouter');
const hostRouter = require('./routes/hostRouter');
const authRouter = require('./routes/authRouter');
const rootDir = require('./utils/pathUtil');
const prisma = require('./db/prisma');
const csrfProtection = require('./middleware/csrf');

// Ensure SESSION_SECRET is set before booting
if (!process.env.SESSION_SECRET || !process.env.SESSION_SECRET.trim()) {
  console.error('Missing SESSION_SECRET environment variable. Server cannot start.');
  process.exit(1);
}

const app = express();

// Per-request nonce for secure inline scripts
app.use((req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  next();
});

// Helmet security headers & CSP policy
app.use((req, res, next) => {
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          `'nonce-${res.locals.cspNonce}'`,
          "https://cdn.tailwindcss.com",
          "https://cdnjs.cloudflare.com",
          "https://cdn.jsdelivr.net"
        ],
        styleSrc: [
          "'self'",
          `'nonce-${res.locals.cspNonce}'`,
          "https://cdnjs.cloudflare.com",
          "https://fonts.googleapis.com",
          "https://cdn.jsdelivr.net"
        ],
        fontSrc: [
          "'self'",
          "https://cdnjs.cloudflare.com",
          "https://fonts.gstatic.com",
          "data:"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https:"
        ],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
  })(req, res, next);
});

// General rate limiter (300 requests per 15 mins)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(globalLimiter);

// Trust proxy headers for Render, Railway, AWS, Nginx
app.set('trust proxy', 1);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body parsers with payload limits
app.use(express.urlencoded({ extended: true, limit: '500kb' }));
app.use(express.json({ limit: '500kb' }));

// Session storage backed by PostgreSQL
let sessionStore;
if (process.env.DATABASE_URL) {
  try {
    sessionStore = new PgSession({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      tableName: 'session'
    });
  } catch (err) {
    console.error('Could not connect to PG session store, using memory store instead:', err);
  }
}

app.use(
  session({
    name: process.env.NODE_ENV === 'production' ? '__Host-airbnb_session' : 'airbnb_sid',
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
  })
);

// CSRF protection for mutating requests
app.use(csrfProtection);

// Global template variables
app.use((req, res, next) => {
  res.locals.isLoggedIn = Boolean(req.session && req.session.isLoggedIn);
  res.locals.user = (req.session && req.session.user) || null;
  res.locals.isHost = Boolean(
    req.session && req.session.user && req.session.user.userType === 'host'
  );
  res.locals.currentPath = req.path;
  res.locals.pageTitle = 'Airbnb';
  next();
});

// Health check endpoint for uptime monitors
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', uptime: process.uptime(), db: 'connected' });
  } catch (error) {
    console.error('Health check DB probe failed:', error);
    res.status(503).json({ status: 'degraded', db: 'disconnected' });
  }
});

// Static assets
app.use(express.static(path.join(rootDir, 'public')));

// Application routes
app.use(authRouter);
app.use(storeRouter);
app.use('/host', hostRouter);

// 404 handler
app.use((req, res, next) => {
  res.status(404).render('404', { pageTitle: 'Page Not Found' });
});

// Global 500 error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).render('404', {
    pageTitle: 'Server Error'
  });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down cleanly...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    await prisma.$disconnect();
    console.log('Database disconnected.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));