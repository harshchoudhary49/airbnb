const bcrypt = require('bcryptjs');
const User = require('../models/user');

exports.getLogin = (req, res, next) => {
  if (req.session && req.session.isLoggedIn) {
    return res.redirect('/');
  }
  res.render('auth/login', {
    pageTitle: 'Log In - Airbnb',
    errorMessage: null,
    oldInput: {}
  });
};

exports.postLogin = (req, res, next) => {
  const { email, password } = req.body;

  User.findByEmail(email, async (user) => {
    if (!user) {
      return res.status(422).render('auth/login', {
        pageTitle: 'Log In - Airbnb',
        errorMessage: 'Invalid email or password.',
        oldInput: { email }
      });
    }

    try {
      const doMatch = await bcrypt.compare(password, user.password);
      if (doMatch) {
        req.session.isLoggedIn = true;
        req.session.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          userType: user.userType
        };
        return req.session.save((err) => {
          if (err) console.error('Session save error:', err);
          const redirectUrl =
            req.session.returnTo ||
            (user.userType === 'host' ? '/host/host-home-list' : '/');
          delete req.session.returnTo;
          res.redirect(redirectUrl);
        });
      }

      return res.status(422).render('auth/login', {
        pageTitle: 'Log In - Airbnb',
        errorMessage: 'Invalid email or password.',
        oldInput: { email }
      });
    } catch (err) {
      console.error(err);
      res.redirect('/login');
    }
  });
};

exports.getSignup = (req, res, next) => {
  if (req.session && req.session.isLoggedIn) {
    return res.redirect('/');
  }
  res.render('auth/signup', {
    pageTitle: 'Sign Up - Airbnb',
    errorMessage: null,
    oldInput: {}
  });
};

exports.postSignup = (req, res, next) => {
  const { name, email, password, userType } = req.body;

  User.findByEmail(email, async (existingUser) => {
    if (existingUser) {
      return res.status(422).render('auth/signup', {
        pageTitle: 'Sign Up - Airbnb',
        errorMessage: 'An account with this email address already exists.',
        oldInput: { name, email }
      });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 12);
      const user = new User(name, email, hashedPassword, userType || 'guest');
      user.save((err, savedUser) => {
        if (err) {
          console.error('Error saving user:', err);
          return res.redirect('/signup');
        }

        // Auto login after signup
        req.session.isLoggedIn = true;
        req.session.user = {
          id: savedUser.id,
          name: savedUser.name,
          email: savedUser.email,
          userType: savedUser.userType
        };
        req.session.save((saveErr) => {
          if (saveErr) console.error(saveErr);
          res.redirect(user.userType === 'host' ? '/host/host-home-list' : '/');
        });
      });
    } catch (err) {
      console.error(err);
      res.redirect('/signup');
    }
  });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) console.error('Logout error:', err);
    res.redirect('/');
  });
};
