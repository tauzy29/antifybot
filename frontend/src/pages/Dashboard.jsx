import React from 'react';
import { Users, ShieldAlert, Zap, Server, PlusCircle, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '../store/useStore';
import Card from '../components/Card';
import Button from '../components/Button';
import './Dashboard.css';

const StatCard = ({ title, value, icon: Icon, subtext }) => (
  <Card hoverEffect className="stat-card">
    <div className="stat-header">
      <span className="stat-title">{title}</span>
      <div className="stat-icon-wrapper">
        <Icon size={20} className="stat-icon" />
      </div>
    </div>
    <div className="stat-body">
      <h3 className="stat-value">{value}</h3>
      <span className="stat-trend positive">{subtext}</span>
    </div>
  </Card>
);

const Dashboard = () => {
  const { activeGuild, stats, logs, statsLoading, logsLoading, scanProgress, triggerScan, cancelHistoricalScan, resumeHistoricalScan, deletedMessages, deletedMessagesLoading } = useStore();
  const [scanDepth, setScanDepth] = React.useState(100);

  const handleInviteBot = () => {
    if (!activeGuild) return;
    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=1501936383160225852&permissions=8&scope=bot%20applications.commands&guild_id=${activeGuild.id}&disable_guild_select=true`;
    window.open(inviteUrl, '_blank');
  };

  // If no guild is selected
  if (!activeGuild) {
    return (
      <div className="empty-dashboard-state">
        <Server size={48} className="empty-icon animate-pulse" />
        <h2>No Guild Selected</h2>
        <p>Please select a Discord server from the header selector to monitor status.</p>
      </div>
    );
  }

  // If bot is not in the selected guild
  if (!activeGuild.botActive) {
    return (
      <div className="empty-dashboard-state">
        <Server size={48} className="empty-icon text-warning" />
        <h2>ANTIFY Bot Not Active</h2>
        <p>To start protecting <strong>{activeGuild.name}</strong>, invite the moderation bot using the link below.</p>
        <Button className="btn-primary invite-action-btn" onClick={handleInviteBot}>
          <PlusCircle size={18} />
          <span>Invite ANTIFY Bot</span>
        </Button>
      </div>
    );
  }

  const totals = stats.totals || { detections: 0, punishments: 0, bans: 0, warnings: 0, protectedUsers: 0 };
  const trendData = stats.detectionTrends || [];
  const recentLogs = logs.slice(0, 4);

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <h1 className="page-title">Dashboard Overview</h1>
        <p className="page-subtitle">Real-time anti-scam shield statistics for <strong>{activeGuild.name}</strong>.</p>
      </header>

      {/* Historical Sync Control Panel */}
      <Card className="historical-sync-card glass-panel" glow={scanProgress?.active}>
        <div className="sync-card-header">
          <div className="sync-title-area">
            <h2 className="sync-title">Historical Synchronization Panel</h2>
            <p className="sync-subtitle">
              Recover previous message history, search for past threat logs, and sync historical analytics.
            </p>
          </div>
          {(!scanProgress || !scanProgress.active) && (
            <div className="sync-controls">
              <label htmlFor="scan-depth" className="depth-label">Scan Depth:</label>
              <select 
                id="scan-depth"
                value={scanDepth} 
                onChange={(e) => setScanDepth(Number(e.target.value))}
                className="depth-select glass"
              >
                <option value={50}>50 messages</option>
                <option value={100}>100 messages (Default)</option>
                <option value={500}>500 messages</option>
                <option value={1000}>1000 messages (Enterprise)</option>
              </select>
              <Button className="btn-primary sync-btn" onClick={() => triggerScan(activeGuild.id, scanDepth)}>
                <Activity size={16} className="sync-btn-icon" />
                <span>Start New Scan</span>
              </Button>
              {scanProgress && ['cancelled', 'paused', 'failed'].includes(scanProgress.status) && (
                <Button className="btn-secondary resume-btn" onClick={() => resumeHistoricalScan(activeGuild.id)}>
                  <Activity size={16} />
                  <span>Resume Previous Scan</span>
                </Button>
              )}
            </div>
          )}
        </div>

        {scanProgress && scanProgress.status !== 'inactive' && (
          <div className="sync-progress-area">
            <div className="sync-progress-metrics">
              <span className="metric-item">
                Status: <strong className="text-purple uppercase">{scanProgress.status}</strong>
              </span>
              <span className="metric-item">
                Channel: <strong>#{scanProgress.currentChannelName || 'fetching...'}</strong>
              </span>
              <span className="metric-item">
                Channels: <strong>{scanProgress.processedChannels} / {scanProgress.totalChannels}</strong>
              </span>
              <span className="metric-item">
                Scanned: <strong>{scanProgress.messagesScanned} messages</strong>
              </span>
              <span className="metric-item text-red-glow">
                Threats Recovered: <strong className="text-red">{scanProgress.detectionsFound}</strong>
              </span>
            </div>
            
            <div className="progress-bar-container glass">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${Math.round((scanProgress.processedChannels / (scanProgress.totalChannels || 1)) * 100)}%` }}
              ></div>
            </div>
            <div className="progress-actions-row">
              <span className="progress-percentage-text">
                {Math.round((scanProgress.processedChannels / (scanProgress.totalChannels || 1)) * 100)}% Synchronized
              </span>
              {scanProgress.active && (
                <Button className="btn-danger cancel-scan-btn" onClick={() => cancelHistoricalScan(activeGuild.id)}>
                  <span>Cancel Scan</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      {statsLoading ? (
        <div className="dashboard-loader">Syncing telemetry logs...</div>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard title="Total Detections" value={totals.detections} icon={ShieldAlert} subtext="Live threat shield active" />
            <StatCard title="Punishments Issued" value={totals.punishments} icon={Zap} subtext="Bans and timeouts logged" />
            <StatCard title="Protected Users" value={totals.protectedUsers} icon={Users} subtext="Active server members" />
            <StatCard title="Warnings Logged" value={totals.warnings} icon={Server} subtext="Scam triggers flagged" />
          </div>

          <div className="dashboard-content-grid">
            <div className="dashboard-left-col">
              <Card className="chart-section" glow>
                <div className="section-header">
                  <h2 className="section-title">Detection Trends (Last 7 Days)</h2>
                </div>
                <div className="chart-container">
                  {trendData.length === 0 ? (
                    <div className="empty-chart-text">No threat trends logged yet.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#121422', border: '1px solid rgba(255,255,255,0.05)' }}
                          itemStyle={{ color: '#8b5cf6' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="detections" 
                          stroke="#8b5cf6" 
                          strokeWidth={3}
                          dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
                          activeDot={{ r: 8, fill: '#3b82f6' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>

              {/* Archived Deleted Messages Section */}
              <Card className="deleted-messages-section glass-panel">
                <div className="section-header">
                  <h2 className="section-title">Archived Deleted Messages (Evidence Locker)</h2>
                </div>
                <div className="deleted-messages-list">
                  {deletedMessagesLoading ? (
                    <div className="loading-locker-text">Loading evidence files...</div>
                  ) : !deletedMessages || deletedMessages.length === 0 ? (
                    <div className="empty-feed-text">No deleted messages archived yet. Server is clean!</div>
                  ) : (
                    deletedMessages.slice(0, 5).map((msg) => (
                      <div key={msg._id} className="deleted-msg-item glass">
                        <div className="deleted-msg-header">
                          <span className="deleted-msg-author">{msg.username}</span>
                          <span className="deleted-msg-channel">in #{msg.channelName || 'unknown'}</span>
                          <span className="deleted-msg-reason">{msg.detectionType}</span>
                        </div>
                        <div className="deleted-msg-content">
                          "{msg.originalContent || '[Attachments Only]'}"
                        </div>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="deleted-msg-attachments">
                            {msg.attachments.map((url, idx) => (
                              <a href={url} target="_blank" rel="noreferrer" key={idx} className="attachment-link">
                                Attachment {idx + 1}
                              </a>
                            ))}
                          </div>
                        )}
                        <div className="deleted-msg-time">
                          {new Date(msg.deletedAt || msg.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            <Card className="activity-section">
              <div className="section-header">
                <h2 className="section-title">Recent Detections</h2>
              </div>
              <div className="activity-list">
                {logsLoading ? (
                  <div>Updating feed...</div>
                ) : recentLogs.length === 0 ? (
                  <div className="empty-feed-text">No threats detected. Server is safe!</div>
                ) : (
                  recentLogs.map((log) => (
                    <div key={log._id} className="activity-item">
                      <div className="activity-icon malicious">
                        <ShieldAlert size={16} />
                      </div>
                      <div className="activity-details">
                        <p className="activity-text">
                          Blocked <strong>{log.type}</strong> from <strong>{log.username}</strong>
                        </p>
                        <span className="activity-action-text">Action: {log.actionTaken}</span>
                        <span className="activity-time">{new Date(log.timestamp || log.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;