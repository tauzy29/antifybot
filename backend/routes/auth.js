const express = require('express');

const passport = require('passport');

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ====================================
// LOGIN ROUTE
// ====================================

router.get('/login',
  passport.authenticate('discord', {
    session: false,
    scope: ['identify', 'guilds']
  })
);

// ====================================
// CALLBACK ROUTE
// ====================================

router.get('/callback',
  passport.authenticate('discord', {
    failureRedirect: `${FRONTEND_URL}/login`,
    session: false
  }),
  (req, res) => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET || 'antify_jwt_secret',
      { expiresIn: '7d' }
    );
    res.redirect(`${FRONTEND_URL}/login/success?token=${token}`);
  }
);

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