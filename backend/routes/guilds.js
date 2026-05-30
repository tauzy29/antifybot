const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth');
const { Settings } = require('../models');

// Fetch manageable guilds and check if bot is in them
router.get('/', authenticateToken, async (req, res) => {
  try {
    const client = req.app.get('discordClient');
    if (!client) {
      return res.status(500).json({ error: 'Discord client not ready' });
    }

    // req.user has guilds user can manage (parsed during OAuth login/JWT signing)
    const userGuilds = req.user.guilds || [];
    
    // Check which guilds the bot is in
    const botGuilds = client.guilds.cache;

    const populatedGuilds = await Promise.all(userGuilds.map(async (ug) => {
      const isBotPresent = botGuilds.has(ug.id);
      
      let settings = null;
      if (isBotPresent) {
        // Find or create settings for this guild in database
        settings = await Settings.findOne({ guildId: ug.id });
        if (!settings) {
          settings = new Settings({ guildId: ug.id });
          await settings.save();
        }
      }

      // Construct proper icon URL
      const iconUrl = ug.icon 
        ? `https://cdn.discordapp.com/icons/${ug.id}/${ug.icon}.png`
        : null;

      return {
        id: ug.id,
        name: ug.name,
        icon: iconUrl,
        botActive: isBotPresent,
        settings: settings
      };
    }));

    res.json(populatedGuilds);
  } catch (error) {
    console.error('Error fetching guilds:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
