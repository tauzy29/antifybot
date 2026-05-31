const { UsageStats, License, Subscription, Guild } = require('../models');

// Fallback or Configurable Developer Discord ID
const OWNER_ID = process.env.OWNER_ID || '1060801714187415552';

/**
 * Checks if a guild has premium active.
 * A guild is premium if:
 * 1. An active 'Pro' License document exists and is not expired.
 * 2. An active Subscription document ('Pro' or 'Enterprise') exists and is active.
 * 3. The guild is owned by the global bot owner.
 * @param {string} guildId 
 * @returns {Promise<boolean>}
 */
async function isPremiumGuild(guildId) {
  try {
    if (!guildId) return false;

    // 1. Check manual owner-granted License
    const license = await License.findOne({ guildId });
    if (license && license.plan === 'Pro') {
      if (!license.expiresAt || new Date(license.expiresAt) > new Date()) {
        return true;
      }
    }

    // 2. Check Stripe / legacy Subscription
    const sub = await Subscription.findOne({ guildId });
    if (sub && (sub.plan === 'Pro' || sub.plan === 'Enterprise') && sub.status === 'active') {
      if (!sub.expiresAt || new Date(sub.expiresAt) > new Date()) {
        return true;
      }
    }

    // 3. Check if owned by platform owner
    const guild = await Guild.findOne({ guildId });
    if (guild && guild.ownerId === OWNER_ID) {
      return true;
    }

    return false;
  } catch (error) {
    console.error(`[UsageHelper] Error checking premium status for guild ${guildId}:`, error);
    return false;
  }
}

/**
 * Retrieves or creates a UsageStats record for the current UTC day.
 * @param {string} guildId 
 * @returns {Promise<Document>}
 */
async function getOrCreateDailyUsage(guildId) {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  try {
    let usage = await UsageStats.findOne({ guildId, date: startOfDay });
    if (!usage) {
      usage = new UsageStats({
        guildId,
        date: startOfDay,
        imageScans: 0,
        historyScans: 0,
        virusTotalRequests: 0,
        threatReports: 0
      });
      await usage.save();
    }
    return usage;
  } catch (error) {
    // Handle concurrency/race conditions when creating the unique document
    if (error.code === 11000) {
      return await UsageStats.findOne({ guildId, date: startOfDay });
    }
    throw error;
  }
}

const LIMITS = {
  imageScans: 10,
  historyScans: 1,
  virusTotalRequests: 25,
  threatReports: 5
};

/**
 * Gets usage metrics and remaining quotas for the current day.
 * @param {string} guildId 
 * @returns {Promise<object>}
 */
async function getUsageForDay(guildId) {
  const isPremium = await isPremiumGuild(guildId);
  const usage = await getOrCreateDailyUsage(guildId);
  const now = new Date();
  
  const nextReset = new Date();
  nextReset.setUTCHours(24, 0, 0, 0);
  
  const resetsInSeconds = Math.max(0, Math.floor((nextReset.getTime() - now.getTime()) / 1000));
  const resetsInHours = Number((resetsInSeconds / 3600).toFixed(1));

  return {
    isPremium,
    imageScans: {
      used: usage.imageScans || 0,
      limit: isPremium ? 'Unlimited' : LIMITS.imageScans,
      remaining: isPremium ? 'Unlimited' : Math.max(0, LIMITS.imageScans - (usage.imageScans || 0))
    },
    historyScans: {
      used: usage.historyScans || 0,
      limit: isPremium ? 'Unlimited' : LIMITS.historyScans,
      remaining: isPremium ? 'Unlimited' : Math.max(0, LIMITS.historyScans - (usage.historyScans || 0))
    },
    virusTotalRequests: {
      used: usage.virusTotalRequests || 0,
      limit: isPremium ? 'Unlimited' : LIMITS.virusTotalRequests,
      remaining: isPremium ? 'Unlimited' : Math.max(0, LIMITS.virusTotalRequests - (usage.virusTotalRequests || 0))
    },
    threatReports: {
      used: usage.threatReports || 0,
      limit: isPremium ? 'Unlimited' : LIMITS.threatReports,
      remaining: isPremium ? 'Unlimited' : Math.max(0, LIMITS.threatReports - (usage.threatReports || 0))
    },
    resetsInSeconds,
    resetsInHours
  };
}

/**
 * Checks if a daily metric is within limits, and increments it if allowed.
 * For premium guilds, it increments the count but always allows the operation.
 * @param {string} guildId 
 * @param {string} field 
 * @param {number} amount 
 * @returns {Promise<{ allowed: boolean, current: number, limit: number|string, isPremium: boolean }>}
 */
async function checkAndIncrementUsage(guildId, field, amount = 1) {
  try {
    const isPremium = await isPremiumGuild(guildId);
    const usage = await getOrCreateDailyUsage(guildId);
    const limit = LIMITS[field];

    if (isPremium) {
      usage[field] = (usage[field] || 0) + amount;
      await usage.save();
      return { allowed: true, current: usage[field], limit: 'Unlimited', isPremium: true };
    }

    if ((usage[field] || 0) >= limit) {
      return { allowed: false, current: usage[field], limit, isPremium: false };
    }

    usage[field] = (usage[field] || 0) + amount;
    await usage.save();
    return { allowed: true, current: usage[field], limit, isPremium: false };
  } catch (error) {
    console.error(`[UsageHelper] Error checking & incrementing usage for guild ${guildId}:`, error);
    // Safe fallback: allow action, log failure
    return { allowed: true, current: 0, limit: LIMITS[field], isPremium: false };
  }
}

module.exports = {
  isPremiumGuild,
  getUsageForDay,
  checkAndIncrementUsage,
  OWNER_ID
};
