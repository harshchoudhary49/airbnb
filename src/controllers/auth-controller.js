const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { getSafeRedirectUrl } = require('../utils/urlUtil');

exports.getLogin = (req, res, next) => {
  if (req.session && req.session.isLoggedIn) {
    return res.redirect('/');
  }
  res.render('auth/login', {
    pageTitle: 'Log In - Airbnb',
    errorMessage: null,
    infoMessage: req.query.info || null,
    oldInput: {}
  });
};

exports.postLogin = (req, res, next) => {
  const { email, password } = req.body;

  const cleanedEmail = (email || '').toLowerCase().trim();
  const cleanedPassword = (password || '').trim();

  if (!cleanedEmail || !cleanedPassword) {
    return res.status(422).render('auth/login', {
      pageTitle: 'Log In - Airbnb',
      errorMessage: 'Please provide both email address and password.',
      infoMessage: null,
      oldInput: { email: cleanedEmail }
    });
  }

  // Check field lengths
  if (cleanedEmail.length > 255 || cleanedPassword.length > 128) {
    return res.status(422).render('auth/login', {
      pageTitle: 'Log In - Airbnb',
      errorMessage: 'Invalid email or password length.',
      infoMessage: null,
      oldInput: { email: cleanedEmail }
    });
  }

  User.findByEmail(cleanedEmail, async (user) => {
    if (!user) {
      return res.status(422).render('auth/login', {
        pageTitle: 'Log In - Airbnb',
        errorMessage: 'Invalid email or password.',
        infoMessage: null,
        oldInput: { email: cleanedEmail }
      });
    }

    try {
      const doMatch = await bcrypt.compare(cleanedPassword, user.password);
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
          const rawTarget =
            req.session.returnTo ||
            (user.userType === 'host' ? '/host/host-home-list' : '/');
          delete req.session.returnTo;
          // Ensure safe internal redirect
          const safeTarget = getSafeRedirectUrl(
            rawTarget,
            req,
            user.userType === 'host' ? '/host/host-home-list' : '/'
          );
          res.redirect(safeTarget);
        });
      }

      return res.status(422).render('auth/login', {
        pageTitle: 'Log In - Airbnb',
        errorMessage: 'Invalid email or password.',
        infoMessage: null,
        oldInput: { email: cleanedEmail }
      });
    } catch (err) {
      console.error('Error during password comparison:', err);
      res.status(500).render('auth/login', {
        pageTitle: 'Log In - Airbnb',
        errorMessage: 'An unexpected authentication error occurred. Please try again.',
        infoMessage: null,
        oldInput: { email: cleanedEmail }
      });
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

  const cleanedName = (name || '').trim();
  const cleanedEmail = (email || '').toLowerCase().trim();
  const cleanedPassword = (password || '').trim();
  const validUserType = userType === 'host' ? 'host' : 'guest';

  if (!cleanedName || !cleanedEmail || !cleanedPassword) {
    return res.status(422).render('auth/signup', {
      pageTitle: 'Sign Up - Airbnb',
      errorMessage: 'Please fill in all required fields.',
      oldInput: { name: cleanedName, email: cleanedEmail, userType: validUserType }
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanedEmail)) {
    return res.status(422).render('auth/signup', {
      pageTitle: 'Sign Up - Airbnb',
      errorMessage: 'Please enter a valid email address.',
      oldInput: { name: cleanedName, email: cleanedEmail, userType: validUserType }
    });
  }

  // Check field lengths
  if (cleanedName.length > 100) {
    return res.status(422).render('auth/signup', {
      pageTitle: 'Sign Up - Airbnb',
      errorMessage: 'Full name cannot exceed 100 characters.',
      oldInput: { name: cleanedName, email: cleanedEmail, userType: validUserType }
    });
  }

  if (cleanedEmail.length > 255) {
    return res.status(422).render('auth/signup', {
      pageTitle: 'Sign Up - Airbnb',
      errorMessage: 'Email address cannot exceed 255 characters.',
      oldInput: { name: cleanedName, email: cleanedEmail, userType: validUserType }
    });
  }

  if (cleanedPassword.length > 128) {
    return res.status(422).render('auth/signup', {
      pageTitle: 'Sign Up - Airbnb',
      errorMessage: 'Password cannot exceed 128 characters.',
      oldInput: { name: cleanedName, email: cleanedEmail, userType: validUserType }
    });
  }

  // Enforce password requirements (min 8 chars, mixed case, number)
  const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordComplexityRegex.test(cleanedPassword)) {
    return res.status(422).render('auth/signup', {
      pageTitle: 'Sign Up - Airbnb',
      errorMessage: 'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, and one number.',
      oldInput: { name: cleanedName, email: cleanedEmail, userType: validUserType }
    });
  }

  User.findByEmail(cleanedEmail, async (existingUser) => {
    if (existingUser) {
      return res.status(422).render('auth/signup', {
        pageTitle: 'Sign Up - Airbnb',
        errorMessage: 'An account with this email address already exists.',
        oldInput: { name: cleanedName, email: cleanedEmail, userType: validUserType }
      });
    }

    try {
      const hashedPassword = await bcrypt.hash(cleanedPassword, 12);
      const user = new User(cleanedName, cleanedEmail, hashedPassword, validUserType);
      user.save((err, savedUser) => {
        if (err) {
          console.error('Error saving user:', err);
          return res.status(500).render('auth/signup', {
            pageTitle: 'Sign Up - Airbnb',
            errorMessage: 'Could not create account due to server error. Please try again.',
            oldInput: { name: cleanedName, email: cleanedEmail, userType: validUserType }
          });
        }

        // Log in automatically after registration
        req.session.isLoggedIn = true;
        req.session.user = {
          id: savedUser.id,
          name: savedUser.name,
          email: savedUser.email,
          userType: savedUser.userType
        };
        req.session.save((saveErr) => {
          if (saveErr) console.error(saveErr);
          res.redirect(validUserType === 'host' ? '/host/host-home-list' : '/');
        });
      });
    } catch (err) {
      console.error('Signup error:', err);
      res.status(500).render('auth/signup', {
        pageTitle: 'Sign Up - Airbnb',
        errorMessage: 'An unexpected error occurred during signup.',
        oldInput: { name: cleanedName, email: cleanedEmail, userType: validUserType }
      });
    }
  });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) console.error('Logout error:', err);
    res.redirect('/');
  });
};
