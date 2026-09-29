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

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: 'airbnb_production_key_random_long_secret_hash',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
  })
);

// Global view variables for authentication state
app.use((req, res, next) => {
  res.locals.isLoggedIn = req.session.isLoggedIn || false;
  res.locals.user = req.session.user || null;
  res.locals.isHost =
    req.session.user && req.session.user.userType === 'host';
  next();
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

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on address http://localhost:${PORT}`);
});