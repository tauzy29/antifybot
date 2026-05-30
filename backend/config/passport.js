const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const { User } = require('../models');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const CALLBACK_URL = process.env.CALLBACK_URL || 'http://localhost:3000/auth/discord/callback';

passport.use(new DiscordStrategy({
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    callbackURL: CALLBACK_URL,
    scope: ['identify', 'guilds']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ discordId: profile.id });
      if (!user) {
        user = new User({ discordId: profile.id });
      }
      user.username = profile.username;
      user.discriminator = profile.discriminator;
      user.avatar = profile.avatar;
      user.accessToken = accessToken;
      user.refreshToken = refreshToken;
      
      // Store all user guilds on session user to check permissions later
      // Each guild has id, name, icon, owner, permissions, features
      user.guildsCache = profile.guilds || [];
      
      await user.save();
      return done(null, user);
    } catch (err) {
      console.error('Passport strategy error:', err);
      return done(err, null);
    }
  }
));
