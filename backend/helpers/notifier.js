const { Notification } = require('../models');

/**
 * Helper to create a notification and emit it to a guild's Socket.io room.
 * @param {String} guildId Guild ID
 * @param {Object} data { title, message, type, severity, userId, evidenceId }
 * @param {Object} io Socket.io server instance (optional)
 */
async function createNotification(guildId, { title, message, type, severity, userId, evidenceId }, io = null) {
  try {
    const notification = new Notification({
      guildId,
      title,
      message,
      type,
      severity: severity || 'medium',
      read: false,
      timestamp: new Date(),
      userId,
      evidenceId
    });
    await notification.save();

    // Broadcast using Socket.IO
    if (io) {
      io.to(`guild_${guildId}`).emit('notification_new', notification);
    } else {
      console.warn('[Notifier] Socket.IO instance was not provided for real-time notification broadcast');
    }

    return notification;
  } catch (error) {
    console.error('[Notifier] Error creating notification:', error);
    return null;
  }
}

module.exports = {
  createNotification
};
