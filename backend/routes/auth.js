const express = require('express');

const passport = require('passport');

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

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
      `${FRONTEND_URL}/login`
  }),

(req, res) => {

  res.redirect(
    `${FRONTEND_URL}/dashboard`
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
      FRONTEND_URL
    );
  });
});

module.exports = router;