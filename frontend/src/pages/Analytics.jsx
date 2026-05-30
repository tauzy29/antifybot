import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { Mic, MessageCircle, MessageSquare } from 'lucide-react';
import { useStore } from '../store/useStore';
import Card from '../components/Card';
import './Analytics.css';

const StatCard = ({ title, value, icon: Icon, subtext, color = "purple" }) => (
  <Card hoverEffect className={`stat-card stat-card-${color}`}>
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

const Analytics = () => {
  const { activeGuild, stats, statsLoading } = useStore();

  if (!activeGuild) {
    return (
      <div className="empty-dashboard-state">
        <h2>No Guild Selected</h2>
        <p>Please select a Discord server to review its analytics metrics.</p>
      </div>
    );
  }

  if (!activeGuild.botActive) {
    return (
      <div className="empty-dashboard-state">
        <h2>ANTIFY Bot Not Active</h2>
        <p>Invite the bot to this server to unlock metrics monitoring.</p>
      </div>
    );
  }

  const totals = stats.totals || {
    detections: 0,
    punishments: 0,
    bans: 0,
    warnings: 0,
    protectedUsers: 0,
    voiceScamAttempts: 0,
    threadPhishingAttempts: 0,
    forumModerationStats: 0,
    detectionsByChannelType: {}
  };

  const detectionData = stats.detectionTrends || [];
  const ocrData = stats.ocrTrends || [];

  const detectionsByChannelType = totals.detectionsByChannelType || {};
  const channelData = Object.entries(detectionsByChannelType)
    .map(([key, value]) => ({
      name: key.replace('Guild', '').replace('Announcement', 'Announce').replace('StageVoice', 'Stage'),
      value: value
    }))
    .filter(item => item.value > 0);

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e'];

  return (
    <div className="analytics-page">
      <header className="page-header">
        <h1 className="page-title">Channel Intelligence Analytics</h1>
        <p className="page-subtitle">Deep dive into threat logs, OCR metrics, and multi-channel telemetry for <strong>{activeGuild.name}</strong>.</p>
      </header>

      {statsLoading ? (
        <div className="dashboard-loader">Processing metrics database...</div>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard 
              title="Voice Scam Attempts" 
              value={totals.voiceScamAttempts || 0} 
              icon={Mic} 
              subtext="Lobbies monitored" 
              color="blue"
            />
            <StatCard 
              title="Thread Phishing Blocked" 
              value={totals.threadPhishingAttempts || 0} 
              icon={MessageCircle} 
              subtext="Nested threads scanned" 
              color="purple"
            />
            <StatCard 
              title="Forum Threads Moderated" 
              value={totals.forumModerationStats || 0} 
              icon={MessageSquare} 
              subtext="Posts & media scanned" 
              color="emerald"
            />
          </div>

          <div className="charts-grid-two-col">
            <Card className="chart-card" glow>
              <h2 className="chart-title">Detection Types Over Time</h2>
              <div className="chart-wrapper">
                {detectionData.length === 0 ? (
                  <div className="empty-chart-text">No detection logs recorded for trends.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={detectionData}>
                      <defs>
                        <linearGradient id="colorPhishing" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorSpam" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorImage" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#121422', border: '1px solid rgba(255,255,255,0.05)', color: '#fff' }} 
                      />
                      <Legend />
                      <Area type="monotone" name="Phishing Links" dataKey="phishing" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorPhishing)" />
                      <Area type="monotone" name="Spam Words" dataKey="spam" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSpam)" />
                      <Area type="monotone" name="Scam Images" dataKey="image" stroke="#ef4444" fillOpacity={1} fill="url(#colorImage)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            <Card className="chart-card">
              <h2 className="chart-title">Threat Distribution by Channel</h2>
              <div className="chart-wrapper pie-chart-wrapper">
                {channelData.length === 0 ? (
                  <div className="empty-chart-text">No threat distribution logged yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={channelData}
                        cx="50%"
                        cy="45%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {channelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#121422', border: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          <Card className="chart-card">
            <h2 className="chart-title">OCR Image Scanning Stats</h2>
            <div className="chart-wrapper">
              {ocrData.length === 0 ? (
                <div className="empty-chart-text">No OCR scanning logs recorded yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ocrData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="time" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#121422', border: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}
                      cursor={{fill: 'rgba(255,255,255,0.02)'}}
                    />
                    <Legend />
                    <Bar dataKey="scans" name="Total Images Scanned" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="matches" name="Scams Flagged" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default Analytics;
