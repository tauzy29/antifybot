import { create } from 'zustand';
import axios from 'axios';
import io from 'socket.io-client';

import { API_BASE_URL, BACKEND_URL } from '../config';
let socketConnection = null;

// Configure axios defaults to pass session cookies
axios.defaults.withCredentials = true;

export const useStore = create((set, get) => ({
  // Authentication State
  user: null,
  isAuthenticated: false,
  authLoading: true,

  // Guilds State
  guilds: [],
  activeGuild: null,
  guildsLoading: false,

  // Dashboard Stats
  stats: {
    totals: {
      detections: 0,
      punishments: 0,
      bans: 0,
      warnings: 0,
      protectedUsers: 0
    },
    detectionTrends: [],
    ocrTrends: []
  },
  statsLoading: false,

  // Logs State
  logs: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  },
  logsLoading: false,

  // Deleted Messages State
  deletedMessages: [],
  deletedMessagesPagination: {
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  },
  deletedMessagesLoading: false,

  // Settings State
  settings: null,
  settingsLoading: false,
  savingSettings: false,

  // Premium State
  premium: null,
  premiumLoading: false,

  // Historical Scan State
  scanProgress: { active: false, totalChannels: 0, processedChannels: 0, messagesScanned: 0, detectionsFound: 0, currentChannelName: '', status: 'inactive' },
  scanLoading: false,

  // Moderation Control Center State
  moderationData: { punishments: [], warnings: [] },
  moderationLoading: false,
  auditLogs: [],
  moderatorFeed: [],

  // Notifications/Alerts
  alerts: [], // Toasts queue
  socketConnected: false,

  // ==============================
  // ACTIONS - AUTHENTICATION
  // ==============================
  fetchUser: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/user`);
      set({ 
        user: response.data.user, 
        isAuthenticated: true, 
        authLoading: false 
      });
      get().fetchGuilds();
    } catch (error) {
      console.log('Session check failed (User not logged in or backend offline).');
      if (socketConnection) {
        socketConnection.disconnect();
        socketConnection = null;
      }
      set({ user: null, isAuthenticated: false, authLoading: false, guilds: [], activeGuild: null, socketConnected: false });
    }
  },

  logoutUser: async () => {
    try {
      await axios.post(`${API_BASE_URL}/logout`);
    } catch (err) {
      // Fallback to GET logout if POST fails
      await axios.get(`${API_BASE_URL}/logout`).catch(() => {});
    }
    if (socketConnection) {
      socketConnection.disconnect();
      socketConnection = null;
    }
    localStorage.removeItem('antify_last_guild_id');
    set({ user: null, isAuthenticated: false, guilds: [], activeGuild: null, socketConnected: false });
  },

  // ==============================
  // ACTIONS - GUILDS
  // ==============================
  fetchGuilds: async () => {
    set({ guildsLoading: true });
    try {
      const response = await axios.get(`${API_BASE_URL}/guilds`);
      const guilds = response.data;
      set({ guilds, guildsLoading: false });
      
      // Determine guild to auto-select (persisted or bot-active or first item)
      if (guilds.length > 0) {
        const lastGuildId = localStorage.getItem('antify_last_guild_id');
        const persistedGuild = guilds.find(g => g.id === lastGuildId);
        const botActiveGuild = guilds.find(g => g.botActive);
        
        const targetGuild = persistedGuild || botActiveGuild || guilds[0];
        get().setActiveGuild(targetGuild);
      }
    } catch (error) {
      console.error('Fetch guilds failed:', error);
      set({ guildsLoading: false });
    }
  },

  setActiveGuild: (guild) => {
    const oldGuild = get().activeGuild;
    set({ activeGuild: guild });

    if (guild) {
      localStorage.setItem('antify_last_guild_id', guild.id);
      
      if (guild.botActive) {
        get().initSocket(guild.id, oldGuild?.id);
        get().fetchStats(guild.id);
        get().fetchSettings(guild.id);
        get().fetchLogs(guild.id);
        get().fetchPremium(guild.id);
        get().fetchScanStatus(guild.id);
        get().fetchDeletedMessages(guild.id);
        get().fetchModerationData(guild.id);
        get().fetchAuditLogs(guild.id);
      } else {
        if (socketConnection && oldGuild) {
          socketConnection.emit('leave_guild', oldGuild.id);
        }
        set({
          stats: {
            totals: { detections: 0, punishments: 0, bans: 0, warnings: 0, protectedUsers: 0 },
            detectionTrends: [],
            ocrTrends: []
          },
          logs: [],
          settings: null,
          premium: null,
          moderationData: { punishments: [], warnings: [] },
          auditLogs: [],
          moderatorFeed: []
        });
      }
    }
  },

  // ==============================
  // ACTIONS - STATS & ANALYTICS
  // ==============================
  fetchStats: async (guildId) => {
    if (!guildId) return;
    set({ statsLoading: true });
    try {
      const response = await axios.get(`${API_BASE_URL}/analytics/${guildId}`);
      set({ stats: response.data, statsLoading: false });
    } catch (error) {
      console.error('Fetch stats failed:', error);
      set({ statsLoading: false });
    }
  },

  // ==============================
  // ACTIONS - MODERATION LOGS
  // ==============================
  fetchLogs: async (guildId, page = 1, search = '', severity = '', type = '') => {
    if (!guildId) return;
    set({ logsLoading: true });
    try {
      const params = { page, search, severity, type };
      const response = await axios.get(`${API_BASE_URL}/logs/${guildId}`, { params });
      set({ 
        logs: response.data.logs, 
        pagination: response.data.pagination, 
        logsLoading: false 
      });
    } catch (error) {
      console.error('Fetch logs failed:', error);
      set({ logsLoading: false });
    }
  },

  fetchDeletedMessages: async (guildId, page = 1, search = '') => {
    if (!guildId) return;
    set({ deletedMessagesLoading: true });
    try {
      const params = { guildId, page, search };
      const response = await axios.get(`${API_BASE_URL}/deleted-messages`, { params });
      set({
        deletedMessages: response.data.messages,
        deletedMessagesPagination: response.data.pagination,
        deletedMessagesLoading: false
      });
    } catch (error) {
      console.error('Fetch deleted messages failed:', error);
      set({ deletedMessagesLoading: false });
    }
  },

  // ==============================
  // ACTIONS - SETTINGS
  // ==============================
  fetchSettings: async (guildId) => {
    if (!guildId) return;
    set({ settingsLoading: true });
    try {
      const response = await axios.get(`${API_BASE_URL}/settings/${guildId}`);
      set({ settings: response.data, settingsLoading: false });
    } catch (error) {
      console.error('Fetch settings failed:', error);
      set({ settingsLoading: false });
    }
  },

  updateSettings: async (updates) => {
    const { activeGuild } = get();
    if (!activeGuild) return;

    set({ savingSettings: true });
    try {
      const response = await axios.post(`${API_BASE_URL}/settings/${activeGuild.id}`, updates);
      set({ 
        settings: response.data.settings, 
        savingSettings: false 
      });
      get().addAlert('Settings saved successfully', 'success');
    } catch (error) {
      console.error('Save settings failed:', error);
      set({ savingSettings: false });
      get().addAlert('Failed to save settings', 'error');
    }
  },

  addKeyword: async (keyword) => {
    const { activeGuild } = get();
    if (!activeGuild || !keyword) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/settings/${activeGuild.id}/keywords`, { keyword });
      set(state => ({
        settings: { ...state.settings, blacklistKeywords: response.data.keywords }
      }));
      get().addAlert(`Added "${keyword}" to blacklist`, 'success');
    } catch (error) {
      console.error('Add keyword failed:', error);
      get().addAlert(error.response?.data?.error || 'Failed to add keyword', 'error');
    }
  },

  removeKeyword: async (keyword) => {
    const { activeGuild } = get();
    if (!activeGuild || !keyword) return;

    try {
      const response = await axios.delete(`${API_BASE_URL}/settings/${activeGuild.id}/keywords/${encodeURIComponent(keyword)}`);
      set(state => ({
        settings: { ...state.settings, blacklistKeywords: response.data.keywords }
      }));
      get().addAlert(`Removed "${keyword}" from blacklist`, 'success');
    } catch (error) {
      console.error('Remove keyword failed:', error);
      get().addAlert('Failed to remove keyword', 'error');
    }
  },

  // ==============================
  // ACTIONS - PREMIUM
  // ==============================
  fetchPremium: async (guildId) => {
    if (!guildId) return;
    set({ premiumLoading: true });
    try {
      const response = await axios.get(`${API_BASE_URL}/premium/${guildId}`);
      set({ premium: response.data, premiumLoading: false });
    } catch (error) {
      console.error('Fetch premium failed:', error);
      set({ premiumLoading: false });
    }
  },

  subscribeToPlan: async (plan) => {
    const { activeGuild } = get();
    if (!activeGuild) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/premium/${activeGuild.id}/subscribe`, { plan });
      get().fetchPremium(activeGuild.id);
      get().addAlert(`Upgraded server to ${plan} successfully!`, 'success');
      return response.data.checkoutUrl;
    } catch (error) {
      console.error('Upgrade subscription failed:', error);
      get().addAlert('Failed to upgrade subscription', 'error');
    }
  },

  // ==============================
  // ACTIONS - HISTORICAL SCANNING
  // ==============================
  fetchScanStatus: async (guildId) => {
    if (!guildId) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/scan/status/${guildId}`);
      if (response.data.active) {
        set({ scanProgress: response.data });
      } else {
        set({ scanProgress: { active: false, totalChannels: 0, processedChannels: 0, messagesScanned: 0, detectionsFound: 0, currentChannelName: '', status: 'inactive' } });
      }
    } catch (error) {
      console.error('Fetch scan status failed:', error);
    }
  },

  triggerScan: async (guildId, depth = 100, channelId = null) => {
    if (!guildId) return;
    set({ scanLoading: true });
    try {
      const response = await axios.post(`${API_BASE_URL}/scan/${guildId}`, { depth, channelId });
      set({ scanProgress: response.data.scanState, scanLoading: false });
      get().addAlert('Historical scan initiated successfully', 'success');
    } catch (error) {
      console.error('Trigger scan failed:', error);
      set({ scanLoading: false });
      get().addAlert(error.response?.data?.error || 'Failed to start historical scan', 'error');
    }
  },

  cancelHistoricalScan: async (guildId) => {
    if (!guildId) return;
    set({ scanLoading: true });
    try {
      const response = await axios.post(`${API_BASE_URL}/scan/${guildId}/cancel`);
      set({
        scanProgress: {
          ...get().scanProgress,
          active: false,
          status: 'cancelled'
        },
        scanLoading: false
      });
      get().addAlert('Historical scan cancelled successfully', 'info');
    } catch (error) {
      console.error('Cancel scan failed:', error);
      set({ scanLoading: false });
      get().addAlert(error.response?.data?.error || 'Failed to cancel historical scan', 'error');
    }
  },

  resumeHistoricalScan: async (guildId) => {
    if (!guildId) return;
    set({ scanLoading: true });
    try {
      const response = await axios.post(`${API_BASE_URL}/scan/${guildId}/resume`);
      set({ scanProgress: response.data.scanState, scanLoading: false });
      get().addAlert('Historical scan resumed successfully', 'success');
    } catch (error) {
      console.error('Resume scan failed:', error);
      set({ scanLoading: false });
      get().addAlert(error.response?.data?.error || 'Failed to resume historical scan', 'error');
    }
  },

  // ==============================
  // ACTIONS - MODERATION CONTROL CENTER
  // ==============================
  fetchModerationData: async (guildId) => {
    if (!guildId) return;
    set({ moderationLoading: true });
    try {
      const response = await axios.get(`${API_BASE_URL}/moderation/${guildId}`);
      set({ moderationData: response.data, moderationLoading: false });
    } catch (error) {
      console.error('Fetch moderation data failed:', error);
      set({ moderationLoading: false });
    }
  },

  removeTimeout: async (guildId, userId, punishmentId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/moderation/${guildId}/timeout/remove`, { userId, punishmentId });
      if (response.data.success) {
        get().addAlert('Timeout removed successfully', 'success');
        get().fetchModerationData(guildId);
      }
    } catch (error) {
      console.error('Remove timeout failed:', error);
      get().addAlert(error.response?.data?.error || 'Failed to remove timeout', 'error');
    }
  },

  editTimeoutDuration: async (guildId, userId, punishmentId, durationMinutes) => {
    try {
      const durationMs = durationMinutes * 60 * 1000;
      const response = await axios.post(`${API_BASE_URL}/moderation/${guildId}/timeout/edit`, { userId, punishmentId, duration: durationMs });
      if (response.data.success) {
        get().addAlert(`Timeout duration edited to ${durationMinutes}m`, 'success');
        get().fetchModerationData(guildId);
      }
    } catch (error) {
      console.error('Edit timeout duration failed:', error);
      get().addAlert(error.response?.data?.error || 'Failed to edit timeout duration', 'error');
    }
  },

  unbanUser: async (guildId, userId, punishmentId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/moderation/${guildId}/ban/remove`, { userId, punishmentId });
      if (response.data.success) {
        get().addAlert('User unbanned successfully', 'success');
        get().fetchModerationData(guildId);
      }
    } catch (error) {
      console.error('Unban user failed:', error);
      get().addAlert(error.response?.data?.error || 'Failed to unban user', 'error');
    }
  },

  deleteWarning: async (guildId, warningId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/moderation/${guildId}/warnings/${warningId}`);
      if (response.data.success) {
        get().addAlert('Warning deleted successfully', 'success');
        get().fetchModerationData(guildId);
      }
    } catch (error) {
      console.error('Delete warning failed:', error);
      get().addAlert(error.response?.data?.error || 'Failed to delete warning', 'error');
    }
  },

  revertAction: async (guildId, punishmentId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/moderation/${guildId}/revert`, { punishmentId });
      if (response.data.success) {
        get().addAlert('Moderation action reverted successfully', 'success');
        get().fetchModerationData(guildId);
      }
    } catch (error) {
      console.error('Revert action failed:', error);
      get().addAlert(error.response?.data?.error || 'Failed to revert action', 'error');
    }
  },

  submitAppeal: async (guildId, punishmentId, appealReason) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/moderation/${guildId}/appeal`, { punishmentId, appealReason });
      if (response.data.success) {
        get().addAlert('Appeal submitted successfully', 'success');
        get().fetchModerationData(guildId);
      }
    } catch (error) {
      console.error('Submit appeal failed:', error);
      get().addAlert(error.response?.data?.error || 'Failed to submit appeal', 'error');
    }
  },

  handleAppeal: async (guildId, punishmentId, action, notes) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/moderation/${guildId}/appeal/handle`, { punishmentId, action, notes });
      if (response.data.success) {
        get().addAlert(`Appeal ${action === 'Approve' ? 'approved' : 'rejected'} successfully`, 'success');
        get().fetchModerationData(guildId);
      }
    } catch (error) {
      console.error('Handle appeal failed:', error);
      get().addAlert(error.response?.data?.error || 'Failed to process appeal', 'error');
    }
  },

  fetchAuditLogs: async (guildId) => {
    if (!guildId) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/audit-logs/${guildId}`);
      set({ auditLogs: response.data });
    } catch (error) {
      console.error('Fetch audit logs failed:', error);
    }
  },

  editPunishment: async (guildId, punishmentId, updates) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/punishments/edit`, { guildId, punishmentId, ...updates });
      if (response.data.success) {
        get().addAlert('Punishment updated successfully', 'success');
        get().fetchModerationData(guildId);
        get().fetchAuditLogs(guildId);
      }
    } catch (error) {
      console.error('Edit punishment failed:', error);
      get().addAlert(error.response?.data?.error || 'Failed to edit punishment', 'error');
    }
  },

  revokePunishment: async (guildId, punishmentId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/punishments/revoke`, { guildId, punishmentId });
      if (response.data.success) {
        get().addAlert('Punishment revoked successfully', 'success');
        get().fetchModerationData(guildId);
        get().fetchAuditLogs(guildId);
      }
    } catch (error) {
      console.error('Revoke punishment failed:', error);
      get().addAlert(error.response?.data?.error || 'Failed to revoke punishment', 'error');
    }
  },

  markFalsePositive: async (guildId, evidenceId, action) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/false-positive`, { guildId, evidenceId, action });
      if (response.data.success) {
        get().addAlert(`False positive action applied: ${action}`, 'success');
        get().fetchModerationData(guildId);
        get().fetchDeletedMessages(guildId);
        get().fetchSettings(guildId);
        get().fetchAuditLogs(guildId);
      }
    } catch (error) {
      console.error('False positive action failed:', error);
      get().addAlert(error.response?.data?.error || 'Failed to apply false positive action', 'error');
    }
  },

  // ==============================
  // ACTIONS - TOAST NOTIFICATIONS
  // ==============================
  addAlert: (message, type = 'info') => {
    const id = Date.now();
    set(state => ({
      alerts: [...state.alerts, { id, message, type }]
    }));
    setTimeout(() => {
      set(state => ({
        alerts: state.alerts.filter(a => a.id !== id)
      }));
    }, 4000);
  },

  removeAlert: (id) => {
    set(state => ({
      alerts: state.alerts.filter(a => a.id !== id)
    }));
  },

  // ==============================
  // ACTIONS - SOCKET CONNECTION
  // ==============================
  initSocket: (newGuildId, oldGuildId) => {
    if (!socketConnection) {
      socketConnection = io(BACKEND_URL);
      
      socketConnection.on('connect', () => {
        set({ socketConnected: true });
        if (newGuildId) {
          socketConnection.emit('join_guild', newGuildId);
        }
      });

      socketConnection.on('disconnect', () => {
        set({ socketConnected: false });
      });

      // Handle real-time logs
      socketConnection.on('log_new', (log) => {
        set(state => {
          const currentList = state.logs || [];
          if (currentList.some(l => l._id === log._id)) {
            return {};
          }
          return {
            logs: [log, ...currentList].slice(0, 50)
          };
        });

        let toastType = 'info';
        if (log.severity === 'high') toastType = 'warning';
        if (log.severity === 'critical') toastType = 'error';

        get().addAlert(`[${log.type.toUpperCase()}] threat from ${log.username} handled (${log.actionTaken})`, toastType);
      });

      // Handle real-time deleted messages
      socketConnection.on('deleted_message_new', (msg) => {
        set(state => {
          const currentList = state.deletedMessages || [];
          if (currentList.some(m => m._id === msg._id || m.messageId === msg.messageId)) {
            return {};
          }
          return {
            deletedMessages: [msg, ...currentList].slice(0, 50)
          };
        });
        get().addAlert(`🗑️ Threat message from ${msg.username} was archived and deleted.`, 'warning');
      });

      // Handle real-time stats updates
      socketConnection.on('stats_update', (data) => {
        set(state => ({
          stats: {
            ...state.stats,
            totals: data.totals
          }
        }));
      });

      // Handle historical scanning progress
      socketConnection.on('scan_progress', (data) => {
        const isActive = data.status === 'scanning';
        set({ scanProgress: { active: isActive, ...data } });
      });

      // Handle moderation/appeals live updates
      socketConnection.on('punishment_updated', (updatedPun) => {
        const activeId = get().activeGuild?.id;
        if (activeId) {
          get().fetchModerationData(activeId);
          get().fetchAuditLogs(activeId);
        }
      });

      socketConnection.on('warning_updated', (updatedWarn) => {
        const activeId = get().activeGuild?.id;
        if (activeId) {
          get().fetchModerationData(activeId);
          get().fetchAuditLogs(activeId);
        }
      });

      socketConnection.on('appeal_new', (updatedPun) => {
        const activeId = get().activeGuild?.id;
        if (activeId) {
          get().fetchModerationData(activeId);
        }
      });

      socketConnection.on('appeal_updated', (updatedPun) => {
        const activeId = get().activeGuild?.id;
        if (activeId) {
          get().fetchModerationData(activeId);
        }
      });

      socketConnection.on('scan_completed', (data) => {
        set({ scanProgress: { active: false, ...data, status: 'completed' } });
        get().addAlert(`🎉 Historical scan completed! Synced ${data.messagesScanned} messages.`, 'success');
        // Refresh logs and stats
        const activeId = get().activeGuild?.id;
        if (activeId === data.guildId) {
          get().fetchStats(activeId);
          get().fetchLogs(activeId);
        }
      });

      socketConnection.on('scan_failed', (data) => {
        set({ scanProgress: { active: false, status: 'failed', error: data.error } });
        get().addAlert(`❌ Historical scan failed: ${data.error}`, 'error');
      });

      // Handle dynamic guild joins/leaves by the bot
      socketConnection.on('guild_added', (newGuild) => {
        set(state => {
          // Prevent duplicates
          if (state.guilds.some(g => g.id === newGuild.id)) return {};
          
          const updatedGuilds = [...state.guilds, newGuild];
          get().addAlert(`🤖 Bot added to new server: ${newGuild.name}`, 'info');
          
          return { guilds: updatedGuilds };
        });
      });

      socketConnection.on('guild_removed', (removedGuildId) => {
        set(state => {
          const updatedGuilds = state.guilds.filter(g => g.id !== removedGuildId);
          get().addAlert(`🤖 Bot removed from server.`, 'warning');
          
          let nextActive = state.activeGuild;
          if (state.activeGuild?.id === removedGuildId) {
            nextActive = updatedGuilds[0] || null;
          }
          
          // Trigger state shift
          setTimeout(() => {
            get().setActiveGuild(nextActive);
          }, 0);

          return { guilds: updatedGuilds };
        });
      });
    } else {
      if (oldGuildId) socketConnection.emit('leave_guild', oldGuildId);
      if (newGuildId) socketConnection.emit('join_guild', newGuildId);
    }
  }
}));
