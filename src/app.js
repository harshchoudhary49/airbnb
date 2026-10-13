// Load environment variables early
require('dotenv').config();

// Core Module
const path = require('path');

// External Module
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Local Module
const storeRouter = require('./routes/storeRouter');
const hostRouter = require('./routes/hostRouter');
const authRouter = require('./routes/authRouter');
const rootDir = require('./utils/pathUtil');
const prisma = require('./db/prisma');
const csrfProtection = require('./middleware/csrf');

const app = express();

// Security Headers with Helmet (Protection against Clickjacking, MIME-sniffing, XSS, etc.)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://cdn.tailwindcss.com",
          "https://cdnjs.cloudflare.com"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdnjs.cloudflare.com",
          "https://fonts.googleapis.com"
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
  })
);

// Global Rate Limiter to prevent DoS & automated abuse
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(globalLimiter);

// Trust reverse proxy (essential for production deployments like Render, Heroku, AWS, Nginx)
app.set('trust proxy', 1);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Request body size limits (prevents payload exhaustion / buffer overflow DoS)
app.use(express.urlencoded({ extended: true, limit: '500kb' }));
app.use(express.json({ limit: '500kb' }));

// Session configuration with persistent PostgreSQL store
let sessionStore;
if (process.env.DATABASE_URL) {
  try {
    sessionStore = new PgSession({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      tableName: 'session'
    });
  } catch (err) {
    console.error('Failed to initialize PostgreSQL session store, falling back to memory store:', err);
  }
}

if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ WARNING: SESSION_SECRET is not set in environment variables! Please provide a strong secret in production.');
}

app.use(
  session({
    name: process.env.NODE_ENV === 'production' ? '__Host-airbnb_session' : 'airbnb_sid',
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'airbnb_production_key_random_long_secret_hash',
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

// CSRF Protection Middleware
app.use(csrfProtection);

// Global view variables for authentication state & route tracking
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

// Health check endpoint for deployment monitoring
app.get('/health', async (req, res) => {
  try {
    // Quick probe to PostgreSQL
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', uptime: process.uptime(), db: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'degraded', error: error.message });
  }
});

// Static assets
app.use(express.static(path.join(rootDir, 'public')));

// Mount routers
app.use(authRouter);
app.use(storeRouter);
app.use('/host', hostRouter);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).render('404', { pageTitle: 'Page Not Found' });
});

// Global 500 Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  res.status(500).render('404', {
    pageTitle: 'Server Error'
  });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Gracefully shutting down...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    await prisma.$disconnect();
    console.log('PostgreSQL connection closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));