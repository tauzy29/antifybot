const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth');
const { Log, Warning, Punishment } = require('../models');

// Permission checker middleware
const checkGuildPermission = (req, res, next) => {
  const { guildId } = req.params;
  const userGuilds = req.user.guilds || [];
  if (!userGuilds.some(g => g.id === guildId)) {
    return res.status(403).json({ error: 'Unauthorized to access logs for this server' });
  }
  next();
};

// Get logs (Paginated, Searchable, Filterable)
router.get('/:guildId', authenticateToken, checkGuildPermission, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { page = 1, limit = 10, search = '', severity = '', type = '' } = req.query;

    const query = { guildId };

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { userId: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } }
      ];
    }

    if (severity) {
      query.severity = severity;
    }

    if (type) {
      query.type = type;
    }

    const totalLogs = await Log.countDocuments(query);
    const logs = await Log.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      logs,
      pagination: {
        total: totalLogs,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(totalLogs / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Offender Profile (Get specific offender risk and punishment history)
router.get('/:guildId/offender/:userId', authenticateToken, checkGuildPermission, async (req, res) => {
  try {
    const { guildId, userId } = req.params;

    const logs = await Log.find({ guildId, userId }).sort({ timestamp: -1 });
    const warnings = await Warning.find({ guildId, userId }).sort({ createdAt: -1 });
    const punishments = await Punishment.find({ guildId, userId }).sort({ createdAt: -1 });

    // Calculate Risk Score (Custom algorithm)
    // Warnings: 10pts, Low Log: 5pts, Medium: 15pts, High: 30pts, Critical: 50pts, Kick/Ban: 70pts
    let riskScore = 0;
    warnings.forEach(() => riskScore += 10);
    punishments.forEach(p => {
      if (p.type === 'Kick' || p.type === 'Ban') riskScore += 70;
      else if (p.type === 'Timeout') riskScore += 40;
    });
    logs.forEach(l => {
      if (l.severity === 'low') riskScore += 5;
      else if (l.severity === 'medium') riskScore += 15;
      else if (l.severity === 'high') riskScore += 30;
      else if (l.severity === 'critical') riskScore += 50;
    });

    // Cap risk score at 100
    riskScore = Math.min(riskScore, 100);

    res.json({
      userId,
      username: logs[0]?.username || warnings[0]?.username || punishments[0]?.username || 'Unknown Offender',
      riskScore,
      violationCount: logs.length,
      warningCount: warnings.length,
      punishmentCount: punishments.length,
      history: {
        violations: logs,
        warnings,
        punishments
      }
    });
  } catch (error) {
    console.error('Error fetching offender details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
