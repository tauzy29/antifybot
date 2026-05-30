const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth');
const { Settings, AuditLog } = require('../models');

// Helper to check guild permission
const checkGuildPermission = (req, res, next) => {
  const { guildId } = req.params;
  const userGuilds = req.user.guilds || [];
  if (!userGuilds.some(g => g.id === guildId)) {
    return res.status(403).json({ error: 'Unauthorized to manage this server' });
  }
  next();
};

// Get settings for a guild
router.get('/:guildId', authenticateToken, checkGuildPermission, async (req, res) => {
  try {
    let settings = await Settings.findOne({ guildId: req.params.guildId });
    if (!settings) {
      settings = new Settings({ guildId: req.params.guildId });
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update settings for a guild
router.post('/:guildId', authenticateToken, checkGuildPermission, async (req, res) => {
  try {
    const { guildId } = req.params;
    const updates = req.body;
    
    let settings = await Settings.findOne({ guildId });
    if (!settings) {
      settings = new Settings({ guildId });
    }

    // Determine what changed for the audit log
    const changedFields = [];
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && String(settings[key]) !== String(updates[key])) {
        changedFields.push(`${key}: ${settings[key]} -> ${updates[key]}`);
        settings[key] = updates[key];
      }
    });

    if (changedFields.length > 0) {
      await settings.save();

      // Log action in AuditLog
      const audit = new AuditLog({
        guildId,
        adminId: req.user.id,
        adminName: req.user.username,
        action: 'Updated Settings',
        details: changedFields.join(', ')
      });
      await audit.save();
    }

    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Add keyword to blacklist
router.post('/:guildId/keywords', authenticateToken, checkGuildPermission, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { keyword } = req.body;

    if (!keyword) {
      return res.status(400).json({ error: 'Keyword is required' });
    }

    let settings = await Settings.findOne({ guildId });
    if (!settings) {
      settings = new Settings({ guildId });
    }

    if (settings.blacklistKeywords.includes(keyword)) {
      return res.status(400).json({ error: 'Keyword already exists' });
    }

    settings.blacklistKeywords.push(keyword);
    await settings.save();

    const audit = new AuditLog({
      guildId,
      adminId: req.user.id,
      adminName: req.user.username,
      action: 'Added Blacklist Keyword',
      details: `Added: "${keyword}"`
    });
    await audit.save();

    res.json({ success: true, keywords: settings.blacklistKeywords });
  } catch (error) {
    console.error('Error adding keyword:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Remove keyword from blacklist
router.delete('/:guildId/keywords/:keyword', authenticateToken, checkGuildPermission, async (req, res) => {
  try {
    const { guildId, keyword } = req.params;

    let settings = await Settings.findOne({ guildId });
    if (!settings || !settings.blacklistKeywords.includes(keyword)) {
      return res.status(404).json({ error: 'Keyword not found' });
    }

    settings.blacklistKeywords = settings.blacklistKeywords.filter(k => k !== keyword);
    await settings.save();

    const audit = new AuditLog({
      guildId,
      adminId: req.user.id,
      adminName: req.user.username,
      action: 'Removed Blacklist Keyword',
      details: `Removed: "${keyword}"`
    });
    await audit.save();

    res.json({ success: true, keywords: settings.blacklistKeywords });
  } catch (error) {
    console.error('Error removing keyword:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
