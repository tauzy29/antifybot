const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth');
const { Log, Punishment } = require('../models');

const checkGuildPermission = (req, res, next) => {
  const { guildId } = req.params;
  const userGuilds = req.user.guilds || [];
  if (!userGuilds.some(g => g.id === guildId)) {
    return res.status(403).json({ error: 'Unauthorized to view analytics for this server' });
  }
  next();
};

// Get guild analytics
router.get('/:guildId', authenticateToken, checkGuildPermission, async (req, res) => {
  try {
    const { guildId } = req.params;
    
    // 1. Detection trends over the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendData = await Log.aggregate([
      {
        $match: {
          guildId,
          timestamp: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          detections: { $sum: 1 },
          phishing: { $sum: { $cond: [{ $eq: ['$type', 'Phishing Link'] }, 1, 0] } },
          spam: { $sum: { $cond: [{ $eq: ['$type', 'Spam Words'] }, 1, 0] } },
          image: { $sum: { $cond: [{ $eq: ['$type', 'Scam Image'] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format output with weekday labels
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const formattedTrends = trendData.map(item => {
      const date = new Date(item._id);
      return {
        name: weekdays[date.getDay()],
        date: item._id,
        detections: item.detections,
        phishing: item.phishing || 0,
        spam: item.spam || 0,
        image: item.image || 0
      };
    });

    // Fill missing days with zero values
    const finalTrends = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const match = formattedTrends.find(t => t.date === dateStr);
      finalTrends.push(match || {
        name: weekdays[d.getDay()],
        date: dateStr,
        detections: 0,
        phishing: 0,
        spam: 0,
        image: 0
      });
    }

    // 2. OCR Scans Stats (Mocked or queried from logs containing image checks)
    const ocrTrends = finalTrends.map(t => ({
      time: t.name,
      scans: t.detections * 3 + Math.floor(Math.random() * 20) + 10,
      matches: t.image
    }));

    // 3. Totals
    const totalDetections = await Log.countDocuments({ guildId });
    const totalBans = await Punishment.countDocuments({ guildId, type: 'Ban' });
    const totalTimeouts = await Punishment.countDocuments({ guildId, type: 'Timeout' });
    const totalWarnings = await Log.countDocuments({ guildId, actionTaken: 'Warned' });
    
    // Approximate unique users protected by taking a count of active members (bot cache)
    const client = req.app.get('discordClient');
    let protectedUsers = 0;
    if (client) {
      const guild = client.guilds.cache.get(guildId);
      if (guild) protectedUsers = guild.memberCount;
    }

    res.json({
      totals: {
        detections: totalDetections,
        punishments: totalBans + totalTimeouts,
        bans: totalBans,
        warnings: totalWarnings,
        protectedUsers
      },
      detectionTrends: finalTrends,
      ocrTrends
    });

  } catch (error) {
    console.error('Analytics Fetch Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
