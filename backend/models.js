const mongoose = require('mongoose');

// ==============================
// USER SCHEMA
// ==============================
const UserSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  discriminator: { type: String },
  avatar: { type: String },
  accessToken: { type: String },
  refreshToken: { type: String },
  expiresAt: { type: Date },
  guildsCache: { type: Array, default: [] }
}, { timestamps: true });

// ==============================
// GUILD SCHEMA
// ==============================
const GuildSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  icon: { type: String },
  ownerId: { type: String },
  premiumStatus: { type: String, enum: ['Basic', 'Pro', 'Enterprise'], default: 'Basic' }
}, { timestamps: true });

// ==============================
// SETTINGS SCHEMA
// ==============================
const SettingsSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  ocrEnabled: { type: Boolean, default: true },
  autoBan: { type: Boolean, default: false },
  autoKick: { type: Boolean, default: false },
  autoTimeout: { type: Boolean, default: true },
  deleteMessages: { type: Boolean, default: true },
  strictMode: { type: Boolean, default: false },
  punishmentThreshold: { type: Number, default: 3 }, // Warnings before ban
  whitelistChannels: [{ type: String }],
  blacklistKeywords: [{ type: String }],
  scanSensitivity: { type: Number, default: 50 }, // 1-100 threshold scale
  trustedRoles: [{ type: String }],
  trustedUsers: [{ type: String }],
  announcementChannels: [{ type: String }],
  whitelistedPatterns: [{ type: String }],
}, { timestamps: true });

// ==============================
// LOG SCHEMA (Moderation Logs)
// ==============================
const LogSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  username: { type: String, required: true },
  moderatorId: { type: String },
  actionType: { type: String }, // Warned, Muted, Banned, Kicked
  punishmentType: { type: String }, // Timeout, Kick, Ban, Warning
  reason: { type: String },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium', index: true },
  evidence: { type: String }, // Original content or details as evidence
  createdAt: { type: Date, default: Date.now, index: true },
  
  // Multi-channel attributes
  channelType: { type: String, default: 'GuildText' },
  parentChannelId: { type: String },
  parentChannelName: { type: String },
  threadId: { type: String },
  voiceChannelId: { type: String },
  forumPostId: { type: String },
  
  // Backward compatibility fields
  guildName: { type: String },
  messageContent: { type: String },
  channelId: { type: String },
  channelName: { type: String },
  attachments: [{ type: String }],
  detectionType: { type: String },
  type: { type: String, required: true },
  actionTaken: { type: String, required: true },
  details: { type: String },
  timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

LogSchema.index({ guildId: 1, userId: 1 });
LogSchema.index({ guildId: 1, createdAt: -1 });

// ==============================
// DELETED MESSAGE ARCHIVE
// ==============================
const DeletedMessageSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  guildName: { type: String },
  channelId: { type: String, required: true },
  channelName: { type: String },
  userId: { type: String, required: true, index: true },
  username: { type: String, required: true },
  displayName: { type: String },
  avatar: { type: String },
  messageId: { type: String, required: true, unique: true, index: true },
  originalContent: { type: String },
  attachments: [{ type: String }],
  embeds: { type: Array, default: [] },
  detectionType: { type: String },
  scamScore: { type: Number, default: 0 },
  matchedKeywords: [{ type: String }],
  aiConfidence: { type: Number, default: 0 },
  deletionReason: { type: String },
  deletedBy: { type: String },
  createdAt: { type: Date, required: true, index: true },
  deletedAt: { type: Date, default: Date.now, index: true },
  falsePositive: { type: Boolean, default: false },
  restored: { type: Boolean, default: false },
  restoredBy: { type: String },
  restoredAt: { type: Date },
  
  // Multi-channel attributes
  channelType: { type: String, default: 'GuildText' },
  parentChannelId: { type: String },
  parentChannelName: { type: String },
  threadId: { type: String },
  voiceChannelId: { type: String },
  forumPostId: { type: String }
}, { timestamps: true });

DeletedMessageSchema.index({ guildId: 1, deletedAt: -1 });

// ==============================
// DETECTION LOG SCHEMA
// ==============================
const DetectionLogSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  messageId: { type: String },
  content: { type: String }, // Message content
  detectionCategory: { type: String }, // Phishing, Spam, OCR, AI
  aiScore: { type: Number, default: 0 }, // Confidence score
  phishingDetected: { type: Boolean, default: false },
  scamDetected: { type: Boolean, default: false },
  suspiciousLinks: [{ type: String }],
  OCRText: { type: String },
  actionTaken: { type: String },
  createdAt: { type: Date, default: Date.now, index: true },
  
  // Multi-channel attributes
  channelType: { type: String, default: 'GuildText' },
  parentChannelId: { type: String },
  parentChannelName: { type: String },
  threadId: { type: String },
  voiceChannelId: { type: String },
  forumPostId: { type: String },
  
  // Backward compatibility fields
  messageContent: { type: String },
  scamScore: { type: Number, default: 0 },
  matchedKeywords: [{ type: String }],
  imageDetected: { type: Boolean, default: false },
  AIConfidence: { type: Number, default: 0 }
}, { timestamps: true });

DetectionLogSchema.index({ guildId: 1, userId: 1 });
DetectionLogSchema.index({ guildId: 1, createdAt: -1 });

// ==============================
// USER INFRACTION SCHEMA
// ==============================
const UserInfractionSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  warnings: { type: Number, default: 0 },
  kicks: { type: Number, default: 0 },
  bans: { type: Number, default: 0 },
  phishingAttempts: { type: Number, default: 0 },
  scamAttempts: { type: Number, default: 0 },
  riskLevel: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Low' },
  lastViolation: { type: Date },
  
  // Backward compatibility
  mutes: { type: Number, default: 0 },
  lastInfraction: { type: Date }
}, { timestamps: true });

UserInfractionSchema.index({ guildId: 1, userId: 1 }, { unique: true });

// ==============================
// GUILD ANALYTICS SCHEMA
// ==============================
const GuildAnalyticsSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true, index: true },
  totalScans: { type: Number, default: 0 }, // total messages scanned
  totalDetections: { type: Number, default: 0 },
  totalDeletedMessages: { type: Number, default: 0 },
  totalWarnings: { type: Number, default: 0 },
  totalBans: { type: Number, default: 0 },
  totalKicks: { type: Number, default: 0 },
  phishingBlocked: { type: Number, default: 0 },
  scamsBlocked: { type: Number, default: 0 },
  
  // Multi-channel analytics
  voiceScamAttempts: { type: Number, default: 0 },
  threadPhishingAttempts: { type: Number, default: 0 },
  forumModerationStats: { type: Number, default: 0 },
  detectionsByChannelType: {
    type: Map,
    of: Number,
    default: {
      'GuildText': 0,
      'GuildVoice': 0,
      'PublicThread': 0,
      'PrivateThread': 0,
      'GuildForum': 0,
      'GuildAnnouncement': 0,
      'GuildMedia': 0,
      'GuildStageVoice': 0,
      'AnnouncementThread': 0
    }
  },
  
  // Backward compatibility totals
  totalMessagesScanned: { type: Number, default: 0 },
  totalPunishments: { type: Number, default: 0 },
  totalPhishingBlocked: { type: Number, default: 0 },
  totalScamLinksBlocked: { type: Number, default: 0 },
  
  dailyStats: [{
    date: { type: String, required: true }, // Format: "YYYY-MM-DD"
    messagesScanned: { type: Number, default: 0 },
    scans: { type: Number, default: 0 },
    detections: { type: Number, default: 0 },
    deletedMessages: { type: Number, default: 0 },
    punishments: { type: Number, default: 0 },
    warnings: { type: Number, default: 0 },
    bans: { type: Number, default: 0 },
    kicks: { type: Number, default: 0 },
    phishingBlocked: { type: Number, default: 0 },
    scamsBlocked: { type: Number, default: 0 },
    voiceScamAttempts: { type: Number, default: 0 },
    threadPhishingAttempts: { type: Number, default: 0 },
    forumModerationStats: { type: Number, default: 0 },
    detectionsByChannelType: {
      type: Map,
      of: Number,
      default: {
        'GuildText': 0,
        'GuildVoice': 0,
        'PublicThread': 0,
        'PrivateThread': 0,
        'GuildForum': 0,
        'GuildAnnouncement': 0,
        'GuildMedia': 0,
        'GuildStageVoice': 0,
        'AnnouncementThread': 0
      }
    }
  }],
  weeklyStats: [{
    week: { type: String, required: true }, // Format: "YYYY-WW"
    messagesScanned: { type: Number, default: 0 },
    scans: { type: Number, default: 0 },
    detections: { type: Number, default: 0 },
    deletedMessages: { type: Number, default: 0 },
    punishments: { type: Number, default: 0 },
    warnings: { type: Number, default: 0 },
    bans: { type: Number, default: 0 },
    kicks: { type: Number, default: 0 },
    phishingBlocked: { type: Number, default: 0 },
    scamsBlocked: { type: Number, default: 0 },
    voiceScamAttempts: { type: Number, default: 0 },
    threadPhishingAttempts: { type: Number, default: 0 },
    forumModerationStats: { type: Number, default: 0 },
    detectionsByChannelType: {
      type: Map,
      of: Number,
      default: {
        'GuildText': 0,
        'GuildVoice': 0,
        'PublicThread': 0,
        'PrivateThread': 0,
        'GuildForum': 0,
        'GuildAnnouncement': 0,
        'GuildMedia': 0,
        'GuildStageVoice': 0,
        'AnnouncementThread': 0
      }
    }
  }],
  monthlyStats: [{
    month: { type: String, required: true }, // Format: "YYYY-MM"
    messagesScanned: { type: Number, default: 0 },
    scans: { type: Number, default: 0 },
    detections: { type: Number, default: 0 },
    deletedMessages: { type: Number, default: 0 },
    punishments: { type: Number, default: 0 },
    warnings: { type: Number, default: 0 },
    bans: { type: Number, default: 0 },
    kicks: { type: Number, default: 0 },
    phishingBlocked: { type: Number, default: 0 },
    scamsBlocked: { type: Number, default: 0 },
    voiceScamAttempts: { type: Number, default: 0 },
    threadPhishingAttempts: { type: Number, default: 0 },
    forumModerationStats: { type: Number, default: 0 },
    detectionsByChannelType: {
      type: Map,
      of: Number,
      default: {
        'GuildText': 0,
        'GuildVoice': 0,
        'PublicThread': 0,
        'PrivateThread': 0,
        'GuildForum': 0,
        'GuildAnnouncement': 0,
        'GuildMedia': 0,
        'GuildStageVoice': 0,
        'AnnouncementThread': 0
      }
    }
  }]
}, { timestamps: true });

// ==============================
// WARNING SCHEMA
// ==============================
const WarningSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  username: { type: String },
  reason: { type: String },
  moderatorId: { type: String },
  active: { type: Boolean, default: true },
  removedBy: { type: String },
  removedAt: { type: Date },
  notes: { type: String, default: '' },
  evidenceId: { type: String },
  falsePositive: { type: Boolean, default: false }
}, { timestamps: true });

// ==============================
// PUNISHMENT SCHEMA (Timeouts, Kicks, Bans)
// ==============================
const PunishmentSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  username: { type: String, required: true },
  type: { type: String, enum: ['Timeout', 'Kick', 'Ban'], required: true },
  reason: { type: String },
  duration: { type: Number }, // In milliseconds (for Timeouts)
  moderatorId: { type: String },
  active: { type: Boolean, default: true },
  expired: { type: Boolean, default: false },
  removedBy: { type: String },
  removedAt: { type: Date },
  reversible: { type: Boolean, default: true },
  notes: { type: String, default: '' },
  appealStatus: { type: String, enum: ['None', 'Pending', 'Approved', 'Rejected'], default: 'None' },
  appealReason: { type: String, default: '' },
  appealSubmittedAt: { type: Date },
  revoked: { type: Boolean, default: false },
  revokedBy: { type: String },
  revokedAt: { type: Date },
  moderatorNotes: { type: String, default: '' },
  evidenceId: { type: String },
  falsePositive: { type: Boolean, default: false },
  restored: { type: Boolean, default: false }
}, { timestamps: true });

// ==============================
// AUDIT LOG SCHEMA
// ==============================
const AuditLogSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  adminId: { type: String, required: true },
  adminName: { type: String, required: true },
  action: { type: String, required: true }, // e.g. "Updated Settings", "Deleted Keyword"
  details: { type: String }
}, { timestamps: true });

// ==============================
// SUBSCRIPTION SCHEMA
// ==============================
const SubscriptionSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  stripeSubscriptionId: { type: String },
  customerId: { type: String },
  plan: { type: String, enum: ['Basic', 'Pro', 'Enterprise'], default: 'Basic' },
  status: { type: String }, // active, trialing, canceled
  expiresAt: { type: Date }
}, { timestamps: true });

// ==============================
// HISTORICAL SCAN JOB SCHEMA
// ==============================
const HistoricalScanJobSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true, index: true },
  status: { type: String, enum: ['pending', 'scanning', 'paused', 'completed', 'failed', 'cancelled'], default: 'pending', index: true },
  scanDepth: { type: Number, default: 100 },
  channels: [{
    channelId: { type: String, required: true },
    channelName: { type: String },
    status: { type: String, enum: ['pending', 'scanning', 'completed', 'failed'], default: 'pending' },
    messagesScanned: { type: Number, default: 0 },
    detectionsFound: { type: Number, default: 0 },
    lastProcessedMessageId: { type: String }
  }],
  totalChannels: { type: Number, default: 0 },
  processedChannels: { type: Number, default: 0 },
  messagesScanned: { type: Number, default: 0 },
  detectionsFound: { type: Number, default: 0 },
  currentChannelId: { type: String },
  currentChannelName: { type: String },
  moderatorId: { type: String },
  startedAt: { type: Date },
  completedAt: { type: Date }
}, { timestamps: true });

module.exports = {
  User: mongoose.model('User', UserSchema),
  Guild: mongoose.model('Guild', GuildSchema),
  Settings: mongoose.model('Settings', SettingsSchema),
  Log: mongoose.model('Log', LogSchema),
  DeletedMessage: mongoose.model('DeletedMessage', DeletedMessageSchema),
  DetectionLog: mongoose.model('DetectionLog', DetectionLogSchema),
  UserInfraction: mongoose.model('UserInfraction', UserInfractionSchema),
  GuildAnalytics: mongoose.model('GuildAnalytics', GuildAnalyticsSchema),
  HistoricalScanJob: mongoose.model('HistoricalScanJob', HistoricalScanJobSchema),
  Warning: mongoose.model('Warning', WarningSchema),
  Punishment: mongoose.model('Punishment', PunishmentSchema),
  AuditLog: mongoose.model('AuditLog', AuditLogSchema),
  Subscription: mongoose.model('Subscription', SubscriptionSchema)
};
