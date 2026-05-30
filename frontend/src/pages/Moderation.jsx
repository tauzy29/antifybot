import React, { useState, useEffect } from 'react';
import { 
  Shield, Hourglass, Ban, AlertTriangle, ShieldAlert, CheckCircle, 
  XCircle, Undo, Trash2, Edit2, Save, Send, Eye, BookOpen, Clock, 
  RotateCcw, ShieldCheck, UserCheck, RefreshCw, FileText
} from 'lucide-react';
import { useStore } from '../store/useStore';
import Card from '../components/Card';
import Button from '../components/Button';
import './Moderation.css';

// Dynamic Countdown Timer Component for timeouts
const TimeoutTimer = ({ createdAt, duration }) => {
  const targetTime = new Date(createdAt).getTime() + duration;
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, targetTime - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.max(0, targetTime - Date.now());
      setTimeLeft(diff);
      if (diff <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  if (timeLeft <= 0) return <span className="text-muted">Expired</span>;
  
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  return <strong className="text-purple" style={{ color: '#a78bfa' }}>{minutes}m {seconds}s</strong>;
};

const Moderation = () => {
  const getChannelBadgeLabel = (type) => {
    const labels = {
      'GuildText': 'Text Chat',
      'GuildVoice': 'VC Chat',
      'PublicThread': 'Public Thread',
      'PrivateThread': 'Private Thread',
      'AnnouncementThread': 'Announce Thread',
      'GuildForum': 'Forum Post',
      'GuildAnnouncement': 'Announcement',
      'GuildMedia': 'Media Post',
      'GuildStageVoice': 'Stage Chat'
    };
    return labels[type] || 'Text Chat';
  };

  const {
    activeGuild,
    moderationData,
    moderationLoading,
    auditLogs,
    deletedMessages,
    logs,
    fetchModerationData,
    fetchAuditLogs,
    fetchDeletedMessages,
    removeTimeout,
    editTimeoutDuration,
    unbanUser,
    deleteWarning,
    revertAction,
    submitAppeal,
    handleAppeal,
    editPunishment,
    revokePunishment,
    markFalsePositive,
    addAlert
  } = useStore();

  const [activeSubTab, setActiveSubTab] = useState('punishments');
  
  // Inline editing states
  const [editingPunId, setEditingPunId] = useState(null);
  const [editDurationVal, setEditDurationVal] = useState('');
  const [localNotes, setLocalNotes] = useState({});

  // Appeal Sandbox states
  const [simPunId, setSimPunId] = useState('');
  const [simReason, setSimReason] = useState('');

  // Selected evidence ID for the inspector tab
  const [selectedEvidenceId, setSelectedEvidenceId] = useState('');

  // Appeal moderator notes
  const [appealNotes, setAppealNotes] = useState({});

  useEffect(() => {
    if (activeGuild?.id && activeGuild?.botActive) {
      fetchModerationData(activeGuild.id);
      fetchAuditLogs(activeGuild.id);
      fetchDeletedMessages(activeGuild.id);
    }
  }, [activeGuild, fetchModerationData, fetchAuditLogs, fetchDeletedMessages]);

  if (!activeGuild) {
    return (
      <div className="empty-dashboard-state">
        <Shield size={48} className="empty-icon animate-pulse" />
        <h2>No Guild Selected</h2>
        <p>Please select a Discord server from the header selector to monitor status.</p>
      </div>
    );
  }

  if (!activeGuild.botActive) {
    return (
      <div className="empty-dashboard-state">
        <Shield size={48} className="empty-icon text-warning" />
        <h2>ANTIFY Bot Not Active</h2>
        <p>Invite the bot to this server to unlock the Moderation Center.</p>
      </div>
    );
  }

  const punishments = moderationData?.punishments || [];
  const warnings = moderationData?.warnings || [];

  // Groupings
  const activePunishments = punishments.filter(p => p.active && !p.expired && !p.revoked);
  const timeoutQueue = punishments.filter(p => p.type === 'Timeout' && p.active && !p.expired && !p.revoked);
  const banManagement = punishments.filter(p => p.type === 'Ban');
  const warningList = warnings.filter(w => w.active);
  const kickHistory = punishments.filter(p => p.type === 'Kick');
  const appeals = punishments.filter(p => p.appealStatus && p.appealStatus !== 'None');
  
  // Find selected evidence details for the Evidence Viewer
  const selectedEvidence = deletedMessages.find(m => m._id === selectedEvidenceId) || deletedMessages[0];

  const handleNotesSave = (punishmentId) => {
    const text = localNotes[punishmentId];
    if (text !== undefined) {
      editPunishment(activeGuild.id, punishmentId, { moderatorNotes: text });
      addAlert('Moderator notes saved successfully', 'success');
    }
  };

  const handleDurationEditSave = (userId, punishmentId) => {
    if (editDurationVal && !isNaN(editDurationVal)) {
      editTimeoutDuration(activeGuild.id, userId, punishmentId, Number(editDurationVal));
      setEditingPunId(null);
      setEditDurationVal('');
    }
  };

  const handleQuickDuration = (userId, punishmentId, currentDur, changeMin) => {
    const newDurMin = Math.max(1, ((currentDur || 0) / 60000) + changeMin);
    editTimeoutDuration(activeGuild.id, userId, punishmentId, newDurMin);
  };

  const handleSimAppeal = (e) => {
    e.preventDefault();
    if (simPunId && simReason.trim()) {
      submitAppeal(activeGuild.id, simPunId, simReason.trim());
      setSimPunId('');
      setSimReason('');
    }
  };

  // Navigations left-panel lists
  const navItems = [
    { id: 'punishments', label: 'Active Punishments', icon: ShieldAlert, count: activePunishments.length },
    { id: 'timeouts', label: 'Timeout Queue', icon: Hourglass, count: timeoutQueue.length },
    { id: 'bans', label: 'Ban Management', icon: Ban, count: banManagement.filter(b => b.active).length },
    { id: 'warnings', label: 'Warning System', icon: AlertTriangle, count: warningList.length },
    { id: 'kicks', label: 'Kick History', icon: Shield, count: kickHistory.length },
    { id: 'appeals', label: 'Appeals Panel', icon: CheckCircle, count: appeals.filter(a => a.appealStatus === 'Pending').length },
    { id: 'falsepositives', label: 'False Positive Review', icon: RotateCcw, count: deletedMessages.filter(m => m.falsePositive).length },
    { id: 'evidence', label: 'Evidence Viewer', icon: Eye },
    { id: 'auditlogs', label: 'Audit Logs', icon: FileText },
    { id: 'feed', label: 'Mod Actions Feed', icon: Clock }
  ];

  return (
    <div className="moderation-page">
      <header className="page-header">
        <h1 className="page-title">Moderation Center</h1>
        <p className="page-subtitle">Enterprise cybersecurity security operations center (SOC) panel for <strong>{activeGuild.name}</strong>.</p>
      </header>

      <div className="moderation-layout">
        {/* Left Submenu Navigation */}
        <div className="moderation-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`mod-nav-btn ${activeSubTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveSubTab(item.id)}
              >
                <Icon size={16} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className="badge badge-active" style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(139,92,246,0.2)' }}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Content Panel */}
        <div className="moderation-content">
          {moderationLoading ? (
            <div className="dashboard-loader">Reading security incident state...</div>
          ) : (
            <Card>
              {/* ========================================================
                  1. ACTIVE PUNISHMENTS
                 ======================================================== */}
              {activeSubTab === 'punishments' && (
                <div>
                  <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                    <ShieldAlert className="header-icon" />
                    <h2>Active Punishments</h2>
                  </div>
                  {activePunishments.length === 0 ? (
                    <div className="empty-state">
                      <ShieldCheck size={36} className="text-muted" style={{ color: '#10b981' }} />
                      <h3>No Active Punishments</h3>
                      <p>All bans, mutes, and kick timers are clean. Server protected.</p>
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="moderation-table">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Action Type</th>
                            <th>Duration</th>
                            <th>Moderator</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activePunishments.map(pun => {
                            const punEvidence = deletedMessages.find(m => m._id === pun.evidenceId);
                            const channelType = punEvidence?.channelType || 'GuildText';
                            const channelName = punEvidence?.channelName || '';
                            const parentName = punEvidence?.parentChannelName || '';
                            
                            return (
                              <tr key={pun._id}>
                                <td>
                                  <strong>{pun.username}</strong>
                                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>ID: {pun.userId}</div>
                                  {channelName && (
                                    <div className="text-muted-channel" style={{ fontSize: '0.75rem', marginTop: '2px', opacity: 0.8 }}>
                                      #{channelName} {parentName && `(under #${parentName})`}
                                    </div>
                                  )}
                                  <span className={`badge channel-badge-${channelType}`} style={{ fontSize: '0.65rem', marginTop: '4px', display: 'inline-block', padding: '2px 6px', borderRadius: '4px', background: 'rgba(167,139,250,0.1)', color: '#c084fc', border: '1px solid rgba(167,139,250,0.2)' }}>
                                    {getChannelBadgeLabel(channelType)}
                                  </span>
                                </td>
                              <td>
                                <span className={`badge ${pun.type === 'Ban' ? 'badge-rejected' : 'badge-pending'}`}>
                                  {pun.type}
                                </span>
                              </td>
                              <td>{pun.duration ? `${pun.duration / 60000}m` : 'Permanent'}</td>
                              <td>{pun.moderatorId === 'system' || pun.moderatorId?.length > 15 ? 'ANTIFY Bot' : pun.moderatorId}</td>
                              <td>{pun.reason}</td>
                              <td>
                                <span className="badge badge-active">Active</span>
                              </td>
                              <td>
                                <div className="action-cell">
                                  {pun.type === 'Timeout' && (
                                    <Button variant="danger" onClick={() => removeTimeout(activeGuild.id, pun.userId, pun._id)}>
                                      Remove Timeout
                                    </Button>
                                  )}
                                  {pun.type === 'Ban' && (
                                    <Button variant="danger" onClick={() => unbanUser(activeGuild.id, pun.userId, pun._id)}>
                                      Unban
                                    </Button>
                                  )}
                                  <Button variant="outline" onClick={() => {
                                    if (pun.evidenceId) {
                                      setSelectedEvidenceId(pun.evidenceId);
                                      setActiveSubTab('evidence');
                                    } else {
                                      addAlert('No matching evidence linked to this punishment', 'info');
                                    }
                                  }}>
                                    Evidence
                                  </Button>
                                  <Button variant="outline" onClick={() => revokePunishment(activeGuild.id, pun._id)}>
                                    Revoke
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================
                  2. TIMEOUT QUEUE
                 ======================================================== */}
              {activeSubTab === 'timeouts' && (
                <div>
                  <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                    <Hourglass className="header-icon" />
                    <h2>Timeout Queue</h2>
                  </div>
                  {timeoutQueue.length === 0 ? (
                    <div className="empty-state">
                      <Hourglass size={36} className="text-muted" />
                      <h3>No Active Timeouts</h3>
                      <p>No members are currently muted inside the server queue.</p>
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="moderation-table">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Issued At</th>
                            <th>Time Remaining</th>
                            <th>Mod Notes</th>
                            <th>Quick Duration Adjust</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {timeoutQueue.map(timeout => {
                            const isEditing = editingPunId === timeout._id;
                            const notesText = localNotes[timeout._id] !== undefined ? localNotes[timeout._id] : (timeout.moderatorNotes || '');
                            
                            return (
                              <tr key={timeout._id}>
                                <td>
                                  <strong>{timeout.username}</strong>
                                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>ID: {timeout.userId}</div>
                                </td>
                                <td>{new Date(timeout.createdAt).toLocaleString()}</td>
                                <td>
                                  <TimeoutTimer createdAt={timeout.createdAt} duration={timeout.duration} />
                                </td>
                                <td>
                                  <div className="notes-input-area">
                                    <input
                                      type="text"
                                      value={notesText}
                                      placeholder="Add note..."
                                      className="notes-text-input"
                                      onChange={(e) => setLocalNotes({...localNotes, [timeout._id]: e.target.value})}
                                    />
                                    <Button variant="outline" style={{ padding: '2px 6px' }} onClick={() => handleNotesSave(timeout._id)}>
                                      Save
                                    </Button>
                                  </div>
                                </td>
                                <td>
                                  <div className="quick-durations">
                                    <button className="duration-quick-btn" onClick={() => handleQuickDuration(timeout.userId, timeout._id, timeout.duration, 5)}>+5m</button>
                                    <button className="duration-quick-btn" onClick={() => handleQuickDuration(timeout.userId, timeout._id, timeout.duration, 30)}>+30m</button>
                                    <button className="duration-quick-btn" onClick={() => handleQuickDuration(timeout.userId, timeout._id, timeout.duration, -5)}>-5m</button>
                                    <button className="duration-quick-btn" onClick={() => handleQuickDuration(timeout.userId, timeout._id, timeout.duration, -30)}>-30m</button>
                                  </div>
                                </td>
                                <td>
                                  <div className="action-cell">
                                    {isEditing ? (
                                      <>
                                        <input
                                          type="number"
                                          className="duration-input"
                                          placeholder="Min"
                                          value={editDurationVal}
                                          onChange={(e) => setEditDurationVal(e.target.value)}
                                        />
                                        <Button variant="outline" style={{ padding: '4px 6px' }} onClick={() => handleDurationEditSave(timeout.userId, timeout._id)}>
                                          Save
                                        </Button>
                                      </>
                                    ) : (
                                      <Button variant="outline" onClick={() => {
                                        setEditingPunId(timeout._id);
                                        setEditDurationVal(String(timeout.duration / 60000));
                                      }}>
                                        Edit
                                      </Button>
                                    )}
                                    <Button variant="danger" onClick={() => removeTimeout(activeGuild.id, timeout.userId, timeout._id)}>
                                      Lift
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================
                  3. BAN MANAGEMENT
                 ======================================================== */}
              {activeSubTab === 'bans' && (
                <div>
                  <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                    <Ban className="header-icon" />
                    <h2>Ban Management</h2>
                  </div>
                  {banManagement.length === 0 ? (
                    <div className="empty-state">
                      <Ban size={36} className="text-muted" />
                      <h3>No Bans Logged</h3>
                      <p>No historical or active ban records are available.</p>
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="moderation-table">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Issued At</th>
                            <th>Reason</th>
                            <th>Notes</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {banManagement.map(ban => {
                            const notesText = localNotes[ban._id] !== undefined ? localNotes[ban._id] : (ban.moderatorNotes || '');
                            return (
                              <tr key={ban._id}>
                                <td>
                                  <strong>{ban.username}</strong>
                                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>ID: {ban.userId}</div>
                                </td>
                                <td>{new Date(ban.createdAt).toLocaleString()}</td>
                                <td>{ban.reason}</td>
                                <td>
                                  <div className="notes-input-area">
                                    <input
                                      type="text"
                                      value={notesText}
                                      placeholder="Add note..."
                                      className="notes-text-input"
                                      onChange={(e) => setLocalNotes({...localNotes, [ban._id]: e.target.value})}
                                    />
                                    <Button variant="outline" style={{ padding: '2px 6px' }} onClick={() => handleNotesSave(ban._id)}>
                                      Save
                                    </Button>
                                  </div>
                                </td>
                                <td>
                                  <span className={`badge ${ban.active && !ban.revoked ? 'badge-active' : 'badge-expired'}`}>
                                    {ban.active && !ban.revoked ? 'Banned' : 'Revoked/Expired'}
                                  </span>
                                </td>
                                <td>
                                  <div className="action-cell">
                                    {ban.active && !ban.revoked && (
                                      <Button variant="danger" onClick={() => unbanUser(activeGuild.id, ban.userId, ban._id)}>
                                        Unban User
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================
                  4. WARNING SYSTEM
                 ======================================================== */}
              {activeSubTab === 'warnings' && (
                <div>
                  <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                    <AlertTriangle className="header-icon" />
                    <h2>Warning System</h2>
                  </div>
                  {warningList.length === 0 ? (
                    <div className="empty-state">
                      <AlertTriangle size={36} className="text-muted" />
                      <h3>No Warnings</h3>
                      <p>The warning database is currently empty.</p>
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="moderation-table">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Reason</th>
                            <th>Issued At</th>
                            <th>Mod Notes</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {warningList.map(warn => {
                            const warnEvidence = deletedMessages.find(m => m._id === warn.evidenceId);
                            const channelType = warnEvidence?.channelType || 'GuildText';
                            const channelName = warnEvidence?.channelName || '';
                            const parentName = warnEvidence?.parentChannelName || '';
                            
                            return (
                              <tr key={warn._id}>
                                <td>
                                  <strong>{warn.username || 'Unknown'}</strong>
                                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>ID: {warn.userId}</div>
                                  {channelName && (
                                    <div className="text-muted-channel" style={{ fontSize: '0.75rem', marginTop: '2px', opacity: 0.8 }}>
                                      #{channelName} {parentName && `(under #${parentName})`}
                                    </div>
                                  )}
                                  <span className={`badge channel-badge-${channelType}`} style={{ fontSize: '0.65rem', marginTop: '4px', display: 'inline-block', padding: '2px 6px', borderRadius: '4px', background: 'rgba(167,139,250,0.1)', color: '#c084fc', border: '1px solid rgba(167,139,250,0.2)' }}>
                                    {getChannelBadgeLabel(channelType)}
                                  </span>
                                </td>
                              <td>{warn.reason}</td>
                              <td>{new Date(warn.createdAt).toLocaleString()}</td>
                              <td>{warn.notes || 'No notes.'}</td>
                              <td>
                                <div className="action-cell">
                                  <Button variant="danger" style={{ padding: '4px 8px' }} onClick={() => deleteWarning(activeGuild.id, warn._id)}>
                                    <Trash2 size={12} className="mr-1" />
                                    <span>Delete Warning</span>
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================
                  5. KICK HISTORY
                 ======================================================== */}
              {activeSubTab === 'kicks' && (
                <div>
                  <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                    <ShieldAlert className="header-icon" />
                    <h2>Kick History</h2>
                  </div>
                  {kickHistory.length === 0 ? (
                    <div className="empty-state">
                      <Shield size={36} className="text-muted" />
                      <h3>No Historic Kicks</h3>
                      <p>No historic kick operations have been executed by ANTIFY.</p>
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="moderation-table">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Kick Reason</th>
                            <th>Date</th>
                            <th>Moderator</th>
                          </tr>
                        </thead>
                        <tbody>
                          {kickHistory.map(kick => (
                            <tr key={kick._id}>
                              <td>
                                <strong>{kick.username}</strong>
                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>ID: {kick.userId}</div>
                              </td>
                              <td>{kick.reason}</td>
                              <td>{new Date(kick.createdAt).toLocaleString()}</td>
                              <td>{kick.moderatorId}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================
                  6. APPEALS PANEL
                 ======================================================== */}
              {activeSubTab === 'appeals' && (
                <div>
                  <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                    <CheckCircle className="header-icon" />
                    <h2>Appeals Panel</h2>
                  </div>
                  {appeals.length === 0 ? (
                    <div className="empty-state">
                      <CheckCircle size={36} className="text-muted" />
                      <h3>No Appeals Submitted</h3>
                      <p>No active appeals are currently registered for this guild.</p>
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="moderation-table">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Punishment Type</th>
                            <th>Original Reason</th>
                            <th>User Explanation</th>
                            <th>Status</th>
                            <th>Moderator Decision Notes</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {appeals.map(appeal => {
                            const isPending = appeal.appealStatus === 'Pending';
                            const notesVal = appealNotes[appeal._id] || '';
                            
                            return (
                              <tr key={appeal._id}>
                                <td>
                                  <strong>{appeal.username}</strong>
                                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>ID: {appeal.userId}</div>
                                </td>
                                <td>{appeal.type}</td>
                                <td>{appeal.reason}</td>
                                <td>"{appeal.appealReason || 'No justification text provided.'}"</td>
                                <td>
                                  <span className={`badge badge-${appeal.appealStatus.toLowerCase()}`}>
                                    {appeal.appealStatus}
                                  </span>
                                </td>
                                <td>
                                  {isPending ? (
                                    <input
                                      type="text"
                                      value={notesVal}
                                      placeholder="Decision reasons..."
                                      className="appeal-notes-input"
                                      onChange={(e) => setAppealNotes({...appealNotes, [appeal._id]: e.target.value})}
                                    />
                                  ) : (
                                    <span>{appeal.notes || 'No review notes.'}</span>
                                  )}
                                </td>
                                <td>
                                  <div className="action-cell">
                                    {isPending ? (
                                      <>
                                        <Button className="btn-primary" onClick={() => handleAppeal(activeGuild.id, appeal._id, 'Approve', notesVal)}>
                                          Approve
                                        </Button>
                                        <Button variant="danger" onClick={() => handleAppeal(activeGuild.id, appeal._id, 'Reject', notesVal)}>
                                          Reject
                                        </Button>
                                      </>
                                    ) : (
                                      <span className="text-muted">Reviewed</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Sandbox Simulated Appeal Submission */}
                  <div className="sim-appeal-section" style={{ marginTop: '2rem' }}>
                    <span className="sim-title">🚨 Simulated User Appeal Sandbox (Testing Only)</span>
                    <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                      Submit a mock appeal reason for any active punishment to review the approval workflow.
                    </p>
                    <form onSubmit={handleSimAppeal} className="sim-form" style={{ marginTop: '1rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
                        <select
                          className="sim-select"
                          value={simPunId}
                          onChange={(e) => setSimPunId(e.target.value)}
                          required
                        >
                          <option value="">-- Select Active Punishment --</option>
                          {punishments.filter(p => p.active && p.appealStatus === 'None').map(p => (
                            <option key={p._id} value={p._id}>
                              {p.username} - {p.type} ({p.reason})
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          className="sim-textarea"
                          placeholder="Why this false threat trigger should be revoked..."
                          value={simReason}
                          onChange={(e) => setSimReason(e.target.value)}
                          required
                        />
                      </div>
                      <Button variant="outline" type="submit" style={{ marginTop: '8px', alignSelf: 'flex-start' }}>
                        Submit Simulated Appeal
                      </Button>
                    </form>
                  </div>
                </div>
              )}

              {/* ========================================================
                  7. FALSE POSITIVE REVIEW
                 ======================================================== */}
              {activeSubTab === 'falsepositives' && (
                <div>
                  <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                    <RotateCcw className="header-icon" />
                    <h2>False Positive Review Locker</h2>
                  </div>
                  <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                    Review deleted messages and threat matches. Restoring a message sends a copy back to Discord and lifts any associated timeouts or bans automatically.
                  </p>
                  {deletedMessages.length === 0 ? (
                    <div className="empty-state">
                      <ShieldCheck size={36} className="text-muted" />
                      <h3>No Deleted Messages</h3>
                      <p>The evidence locker is empty. Server has not logged threat message deletions.</p>
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="moderation-table">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Original Message</th>
                            <th>Reason</th>
                            <th>Confidence</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deletedMessages.map(msg => (
                            <tr key={msg._id}>
                              <td>
                                <strong>{msg.username}</strong>
                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                  #{msg.channelName} {msg.parentChannelName && `(under #${msg.parentChannelName})`}
                                </div>
                                <span className={`badge channel-badge-${msg.channelType}`} style={{ fontSize: '0.65rem', marginTop: '4px', display: 'inline-block', padding: '2px 6px', borderRadius: '4px', background: 'rgba(167,139,250,0.1)', color: '#c084fc', border: '1px solid rgba(167,139,250,0.2)' }}>
                                  {getChannelBadgeLabel(msg.channelType)}
                                </span>
                              </td>
                              <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                "{msg.originalContent || '[Attachments]'}"
                              </td>
                              <td>{msg.deletionReason}</td>
                              <td>
                                <strong className={msg.scamScore >= 80 ? 'text-red' : 'text-purple'}>
                                  {msg.scamScore}%
                                </strong>
                              </td>
                              <td>
                                {msg.restored ? (
                                  <span className="badge badge-active">Restored</span>
                                ) : msg.falsePositive ? (
                                  <span className="badge badge-pending">False Positive</span>
                                ) : (
                                  <span className="badge badge-rejected">Deleted</span>
                                )}
                              </td>
                              <td>
                                <div className="action-cell">
                                  <Button variant="outline" onClick={() => {
                                    setSelectedEvidenceId(msg._id);
                                    setActiveSubTab('evidence');
                                  }}>
                                    Inspect
                                  </Button>
                                  {!msg.restored && (
                                    <>
                                      <Button className="btn-primary" onClick={() => markFalsePositive(activeGuild.id, msg._id, 'restore')}>
                                        Restore Message
                                      </Button>
                                      <Button variant="outline" onClick={() => markFalsePositive(activeGuild.id, msg._id, 'whitelist_pattern')}>
                                        Whitelist Pattern
                                      </Button>
                                      <Button variant="outline" onClick={() => markFalsePositive(activeGuild.id, msg._id, 'whitelist_user')}>
                                        Whitelist User
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================
                  8. EVIDENCE VIEWER
                 ======================================================== */}
              {activeSubTab === 'evidence' && (
                <div>
                  <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                    <Eye className="header-icon" />
                    <h2>Evidence Viewer</h2>
                  </div>
                  
                  {/* Dropdown selectors */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', width: '100%', maxWidth: '400px' }}>
                    <select
                      className="sim-select"
                      style={{ width: '100%' }}
                      value={selectedEvidenceId}
                      onChange={(e) => setSelectedEvidenceId(e.target.value)}
                    >
                      <option value="">-- Select Incident File --</option>
                      {deletedMessages.map(m => (
                        <option key={m._id} value={m._id}>
                          {m.username} - {m.detectionType} ({new Date(m.deletedAt).toLocaleTimeString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  {!selectedEvidence ? (
                    <div className="empty-state">
                      <Eye size={36} className="text-muted" />
                      <h3>No Evidence File Selected</h3>
                      <p>Select a deleted threat message from the list above to run security analysis.</p>
                    </div>
                  ) : (
                    <div className="evidence-inspector">
                      {/* Left Part: Message info */}
                      <Card className="evidence-detail-card">
                        <div className="evidence-header-info">
                          <div className="evidence-avatar">
                            <Shield size={20} className="text-purple" />
                          </div>
                          <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{selectedEvidence.displayName}</h3>
                            <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                              User: {selectedEvidence.username} | ID: {selectedEvidence.userId}
                            </span>
                            <span className="text-muted" style={{ fontSize: '0.8rem', display: 'block', marginTop: '4px' }}>
                              Location: #{selectedEvidence.channelName} 
                              {selectedEvidence.parentChannelName && ` (under #${selectedEvidence.parentChannelName})`} 
                              &nbsp;|&nbsp; Channel Type: <span className={`badge channel-badge-${selectedEvidence.channelType}`} style={{ fontSize: '0.65rem', display: 'inline-block', padding: '2px 6px', borderRadius: '4px', background: 'rgba(167,139,250,0.1)', color: '#c084fc', border: '1px solid rgba(167,139,250,0.2)' }}>{getChannelBadgeLabel(selectedEvidence.channelType)}</span>
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-muted" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Original Deleted Content</span>
                          <div className="evidence-body">
                            {selectedEvidence.originalContent || '[Attachments Only]'}
                          </div>
                        </div>

                        {selectedEvidence.attachments && selectedEvidence.attachments.length > 0 && (
                          <div>
                            <span className="text-muted" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Attachments Locker</span>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {selectedEvidence.attachments.map((url, idx) => (
                                <a 
                                  href={url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  key={idx} 
                                  className="keyword-tag"
                                  style={{ color: '#60a5fa', textDecoration: 'underline' }}
                                >
                                  File Attachment {idx + 1}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedEvidence.OCRText && (
                          <div>
                            <span className="text-muted" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>OCR Text Extraction</span>
                            <div className="evidence-body" style={{ fontStyle: 'italic', background: 'rgba(255, 255, 255, 0.01)' }}>
                              {selectedEvidence.OCRText}
                            </div>
                          </div>
                        )}

                        {selectedEvidence.matchedKeywords && selectedEvidence.matchedKeywords.length > 0 && (
                          <div>
                            <span className="text-muted" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Matched Threat Triggers</span>
                            <div className="keyword-tags">
                              {selectedEvidence.matchedKeywords.map((kw, i) => (
                                <span className="keyword-tag" key={i} style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}>
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="evidence-stats-grid">
                          <div className="stat-item-box">
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>AI Confidence</span>
                            <div className="stat-item-val">{selectedEvidence.aiConfidence || selectedEvidence.scamScore}%</div>
                          </div>
                          <div className="stat-item-box">
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>Scam Score</span>
                            <div className="stat-item-val">{selectedEvidence.scamScore}%</div>
                          </div>
                        </div>

                        {!selectedEvidence.restored && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
                            <Button className="btn-primary" onClick={() => markFalsePositive(activeGuild.id, selectedEvidence._id, 'restore')}>
                              Restore Message
                            </Button>
                            <Button variant="outline" onClick={() => markFalsePositive(activeGuild.id, selectedEvidence._id, 'whitelist_pattern')}>
                              Whitelist Pattern
                            </Button>
                          </div>
                        )}
                      </Card>

                      {/* Right Part: Incident Timeline */}
                      <Card>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Clock size={16} className="text-purple" />
                          <span>Incident Timeline</span>
                        </h3>
                        <div className="timeline">
                          <div className="timeline-item">
                            <div className="timeline-point" />
                            <div className="timeline-content">
                              <div className="timeline-header">
                                <span>Message Sent</span>
                                <span>{new Date(selectedEvidence.createdAt).toLocaleTimeString()}</span>
                              </div>
                              <div className="timeline-body">
                                Member sent threat indicators in channel <strong>#{selectedEvidence.channelName}</strong>
                                {selectedEvidence.parentChannelName && ` (under #${selectedEvidence.parentChannelName})`}
                                &nbsp;[{getChannelBadgeLabel(selectedEvidence.channelType)}].
                              </div>
                            </div>
                          </div>

                          <div className="timeline-item">
                            <div className="timeline-point" style={{ background: '#ef4444' }} />
                            <div className="timeline-content">
                              <div className="timeline-header">
                                <span>Scanner Match Event</span>
                                <span>{new Date(selectedEvidence.deletedAt).toLocaleTimeString()}</span>
                              </div>
                              <div className="timeline-body">
                                Shield scan matched category <strong>{selectedEvidence.detectionType}</strong> (Score: {selectedEvidence.scamScore}%).
                              </div>
                            </div>
                          </div>

                          <div className="timeline-item">
                            <div className="timeline-point" style={{ background: '#f59e0b' }} />
                            <div className="timeline-content">
                              <div className="timeline-header">
                                <span>Message Cleared</span>
                                <span>{new Date(selectedEvidence.deletedAt).toLocaleTimeString()}</span>
                              </div>
                              <div className="timeline-body">
                                Message was deleted and stored into the evidence lockers.
                              </div>
                            </div>
                          </div>

                          {selectedEvidence.falsePositive && (
                            <div className="timeline-item">
                              <div className="timeline-point" style={{ background: '#10b981' }} />
                              <div className="timeline-content">
                                <div className="timeline-header">
                                  <span>False Positive Marked</span>
                                  <span>{selectedEvidence.restoredAt ? new Date(selectedEvidence.restoredAt).toLocaleTimeString() : 'N/A'}</span>
                                </div>
                                <div className="timeline-body">
                                  Marked as false positive by moderator. {selectedEvidence.restored && 'Message restored back to channel.'}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================
                  9. AUDIT LOGS
                 ======================================================== */}
              {activeSubTab === 'auditlogs' && (
                <div>
                  <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                    <FileText className="header-icon" />
                    <h2>Audit Logs</h2>
                  </div>
                  {auditLogs.length === 0 ? (
                    <div className="empty-state">
                      <FileText size={36} className="text-muted" />
                      <h3>No Dashboard Operations</h3>
                      <p>No administrative settings edits or punishments adjustments have been logged.</p>
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="moderation-table">
                        <thead>
                          <tr>
                            <th>Administrator</th>
                            <th>Operation</th>
                            <th>Details</th>
                            <th>Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditLogs.map(log => (
                            <tr key={log._id}>
                              <td><strong>{log.adminName}</strong></td>
                              <td>
                                <span className="badge badge-active" style={{ background: 'rgba(139,92,246,0.1)' }}>
                                  {log.action}
                                </span>
                              </td>
                              <td style={{ fontSize: '0.85rem' }}>{log.details}</td>
                              <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {new Date(log.createdAt).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================
                  10. MODERATOR ACTIONS FEED
                 ======================================================== */}
              {activeSubTab === 'feed' && (
                <div>
                  <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                    <Clock className="header-icon" />
                    <h2>Moderator Actions Feed</h2>
                  </div>
                  {logs.length === 0 ? (
                    <div className="empty-state">
                      <Clock size={36} className="text-muted" />
                      <h3>No Actions Logged</h3>
                      <p>No recent bot detections have occurred in this server feed.</p>
                    </div>
                  ) : (
                    <div className="timeline" style={{ paddingLeft: 'var(--spacing-8)' }}>
                      {logs.slice(0, 30).map(item => (
                        <div className="timeline-item" key={item._id}>
                          <div className="timeline-point" />
                          <div className="timeline-content">
                            <div className="timeline-header">
                              <strong>{item.actionTaken}</strong>
                              <span>{new Date(item.timestamp || item.createdAt).toLocaleTimeString()}</span>
                            </div>
                            <div className="timeline-body">
                              Blocked threat type <strong>{item.type}</strong> from user <strong>{item.username}</strong>.
                              <div style={{ marginTop: '4px', fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                                Details: {item.details}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Moderation;
