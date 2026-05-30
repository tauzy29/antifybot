const express = require('express');

const passport = require('passport');

const router = express.Router();

// ====================================
// LOGIN ROUTE
// ====================================

router.get('/login',

  passport.authenticate('discord', {

    scope: ['identify', 'guilds']
  })
);

// ====================================
// CALLBACK ROUTE
// ====================================

router.get('/callback',

  passport.authenticate('discord', {

    failureRedirect:
      'http://localhost:5173/login'
  }),

(req, res) => {

  res.redirect(
    'http://localhost:5173/dashboard'
  );
});

// ====================================
// CURRENT USER
// ====================================

router.get('/me', (req, res) => {

  if (!req.user) {

    return res.status(401).json({

      authenticated: false
    });
  }

  res.json({

    authenticated: true,

    user: req.user
  });
});

// ====================================
// LOGOUT
// ====================================

router.get('/logout',

(req, res) => {

  req.logout(() => {

    res.redirect(
      'http://localhost:5173'
    );
  });
});

module.exports = router;