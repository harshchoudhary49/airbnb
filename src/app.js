// Load environment variables early
require('dotenv').config();

// Core Module
const path = require('path');

// External Module
const express = require('express');
const session = require('express-session');

// Local Module
const storeRouter = require('./routes/storeRouter');
const hostRouter = require('./routes/hostRouter');
const authRouter = require('./routes/authRouter');
const rootDir = require('./utils/pathUtil');
const prisma = require('./db/prisma');

const app = express();

// Trust reverse proxy (essential for production deployments like Render, Heroku, AWS, Nginx)
app.set('trust proxy', 1);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration
app.use(
  session({
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