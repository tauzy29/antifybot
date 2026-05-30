import React, { useState } from 'react';
import { Shield, Eye, Settings as SettingsIcon, Save, Plus } from 'lucide-react';
import { useStore } from '../store/useStore';
import Card from '../components/Card';
import Button from '../components/Button';
import './Settings.css';

const Toggle = ({ enabled, onChange, disabled }) => (
  <button 
    className={`toggle-switch ${enabled ? 'active' : ''}`}
    onClick={onChange}
    disabled={disabled}
  >
    <div className="toggle-thumb" />
  </button>
);

const Settings = () => {
  const { activeGuild, settings, settingsLoading, updateSettings, addKeyword, removeKeyword } = useStore();
  const [newKeyword, setNewKeyword] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newUser, setNewUser] = useState('');
  const [newChannel, setNewChannel] = useState('');
  const [newAnnChannel, setNewAnnChannel] = useState('');

  if (!activeGuild) {
    return (
      <div className="empty-dashboard-state">
        <h2>No Guild Selected</h2>
        <p>Please select a Discord server to adjust moderation parameters.</p>
      </div>
    );
  }

  if (!activeGuild.botActive) {
    return (
      <div className="empty-dashboard-state">
        <h2>ANTIFY Bot Not Active</h2>
        <p>Invite the bot to this server to adjust moderation parameters.</p>
      </div>
    );
  }

  const handleToggle = (key) => {
    if (!settings) return;
    updateSettings({ [key]: !settings[key] });
  };

  const handleKeywordAdd = (e) => {
    e.preventDefault();
    if (newKeyword.trim()) {
      addKeyword(newKeyword.trim());
      setNewKeyword('');
    }
  };

  const currentSettings = settings || {
    ocrEnabled: true,
    autoBan: false,
    autoKick: false,
    autoTimeout: true,
    deleteMessages: true,
    strictMode: false,
    blacklistKeywords: [],
    scanSensitivity: 50,
    whitelistChannels: [],
    trustedRoles: [],
    trustedUsers: [],
    announcementChannels: []
  };

  return (
    <div className="settings-page">
      <header className="page-header flex-between">
        <div>
          <h1 className="page-title">Server Settings</h1>
          <p className="page-subtitle">Configure ANTIFY shield thresholds for <strong>{activeGuild.name}</strong>.</p>
        </div>
      </header>

      {settingsLoading ? (
        <div className="dashboard-loader">Reading server rules database...</div>
      ) : (
        <div className="settings-grid">
          <div className="settings-main">
            <Card className="settings-card">
              <div className="card-header">
                <Shield className="header-icon" />
                <h2>Automated Punishments</h2>
              </div>
              
              <div className="settings-list">
                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Auto-Timeout Members</h3>
                    <p>Mute users for 5 minutes when a threat is detected.</p>
                  </div>
                  <Toggle 
                    enabled={currentSettings.autoTimeout} 
                    onChange={() => handleToggle('autoTimeout')} 
                  />
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Auto-Kick Violators</h3>
                    <p>Kick users immediately on matching threat triggers.</p>
                  </div>
                  <Toggle 
                    enabled={currentSettings.autoKick} 
                    onChange={() => handleToggle('autoKick')} 
                  />
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Auto-Ban Scammers</h3>
                    <p>Ban accounts instantly when phishing or bad links are matched.</p>
                  </div>
                  <Toggle 
                    enabled={currentSettings.autoBan} 
                    onChange={() => handleToggle('autoBan')} 
                  />
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Delete Malicious Messages</h3>
                    <p>Instantly remove messages containing flagged content.</p>
                  </div>
                  <Toggle 
                    enabled={currentSettings.deleteMessages} 
                    onChange={() => handleToggle('deleteMessages')} 
                  />
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Strict Mode</h3>
                    <p>Increase detection sensitivity. (May flag false positives).</p>
                  </div>
                  <Toggle 
                    enabled={currentSettings.strictMode} 
                    onChange={() => handleToggle('strictMode')} 
                  />
                </div>
              </div>
            </Card>

            <Card className="settings-card">
              <div className="card-header">
                <Eye className="header-icon" />
                <h2>OCR Image Scanning</h2>
              </div>
              
              <div className="settings-list">
                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Enable OCR Scan</h3>
                    <p>Extract and parse text from images to catch stealth scams.</p>
                  </div>
                  <Toggle 
                    enabled={currentSettings.ocrEnabled} 
                    onChange={() => handleToggle('ocrEnabled')} 
                  />
                </div>
              </div>
            </Card>

            <Card className="settings-card">
              <div className="card-header">
                <Shield className="header-icon" />
                <h2>Trust & Context Intel System</h2>
              </div>
              
              <div className="settings-list">
                <div className="setting-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                  <div className="setting-info flex-between">
                    <div>
                      <h3>Scan Sensitivity Threshold</h3>
                      <p>Adjust AI block confidence limit. Lower threshold = more aggressive scanning.</p>
                    </div>
                    <span className="text-purple font-semibold" style={{ fontSize: '1.2rem', color: 'var(--accent-purple-light)' }}>
                      {currentSettings.scanSensitivity || 50}%
                    </span>
                  </div>
                  <div className="flex-between" style={{ gap: '1rem' }}>
                    <input 
                      type="range" 
                      min="1" 
                      max="100" 
                      value={currentSettings.scanSensitivity || 50} 
                      className="sensitivity-slider" 
                      style={{ flex: 1, accentColor: 'var(--accent-purple)', cursor: 'pointer', height: '6px', borderRadius: '3px' }}
                      onChange={(e) => updateSettings({ scanSensitivity: Number(e.target.value) })}
                    />
                  </div>
                </div>

                {/* Whitelisted Channels */}
                <div className="setting-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                  <div className="setting-info">
                    <h3>Whitelisted Channels</h3>
                    <p>Bypass threat detection scanning completely on these channels.</p>
                  </div>
                  <div className="tag-manager-group" style={{ display: 'flex', gap: '8px', margin: '4px 0' }}>
                    <input 
                      type="text" 
                      placeholder="e.g. 150247658931200254" 
                      className="keyword-input"
                      value={newChannel}
                      onChange={(e) => setNewChannel(e.target.value)}
                    />
                    <Button variant="outline" type="button" onClick={() => {
                      if (newChannel.trim()) {
                        const oldList = currentSettings.whitelistChannels || [];
                        if (!oldList.includes(newChannel.trim())) {
                          updateSettings({ whitelistChannels: [...oldList, newChannel.trim()] });
                        }
                        setNewChannel('');
                      }
                    }}>Add ID</Button>
                  </div>
                  <div className="keyword-tags">
                    {(currentSettings.whitelistChannels || []).map(chId => (
                      <span key={chId} className="keyword-tag">
                        #{chId}
                        <button type="button" className="tag-remove" onClick={() => {
                          updateSettings({ whitelistChannels: currentSettings.whitelistChannels.filter(c => c !== chId) });
                        }}>×</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Trusted Roles */}
                <div className="setting-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                  <div className="setting-info">
                    <h3>Trusted Roles (Bypass Scans)</h3>
                    <p>Users with these roles will bypass all anti-scam checks.</p>
                  </div>
                  <div className="tag-manager-group" style={{ display: 'flex', gap: '8px', margin: '4px 0' }}>
                    <input 
                      type="text" 
                      placeholder="e.g. 150247658931200255" 
                      className="keyword-input"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                    />
                    <Button variant="outline" type="button" onClick={() => {
                      if (newRole.trim()) {
                        const oldList = currentSettings.trustedRoles || [];
                        if (!oldList.includes(newRole.trim())) {
                          updateSettings({ trustedRoles: [...oldList, newRole.trim()] });
                        }
                        setNewRole('');
                      }
                    }}>Add ID</Button>
                  </div>
                  <div className="keyword-tags">
                    {(currentSettings.trustedRoles || []).map(roleId => (
                      <span key={roleId} className="keyword-tag">
                        Role: {roleId}
                        <button type="button" className="tag-remove" onClick={() => {
                          updateSettings({ trustedRoles: currentSettings.trustedRoles.filter(r => r !== roleId) });
                        }}>×</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Whitelisted Users */}
                <div className="setting-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                  <div className="setting-info">
                    <h3>Whitelisted Users (Global Bypass)</h3>
                    <p>Trusted users who bypass cybersecurity checks.</p>
                  </div>
                  <div className="tag-manager-group" style={{ display: 'flex', gap: '8px', margin: '4px 0' }}>
                    <input 
                      type="text" 
                      placeholder="e.g. 1234567890123456" 
                      className="keyword-input"
                      value={newUser}
                      onChange={(e) => setNewUser(e.target.value)}
                    />
                    <Button variant="outline" type="button" onClick={() => {
                      if (newUser.trim()) {
                        const oldList = currentSettings.trustedUsers || [];
                        if (!oldList.includes(newUser.trim())) {
                          updateSettings({ trustedUsers: [...oldList, newUser.trim()] });
                        }
                        setNewUser('');
                      }
                    }}>Add ID</Button>
                  </div>
                  <div className="keyword-tags">
                    {(currentSettings.trustedUsers || []).map(uId => (
                      <span key={uId} className="keyword-tag">
                        User: {uId}
                        <button type="button" className="tag-remove" onClick={() => {
                          updateSettings({ trustedUsers: currentSettings.trustedUsers.filter(u => u !== uId) });
                        }}>×</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Announcement Channels */}
                <div className="setting-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                  <div className="setting-info">
                    <h3>Announcement Channels</h3>
                    <p>Bypass moderation completely on server announcement channels.</p>
                  </div>
                  <div className="tag-manager-group" style={{ display: 'flex', gap: '8px', margin: '4px 0' }}>
                    <input 
                      type="text" 
                      placeholder="e.g. 150247658931200256" 
                      className="keyword-input"
                      value={newAnnChannel}
                      onChange={(e) => setNewAnnChannel(e.target.value)}
                    />
                    <Button variant="outline" type="button" onClick={() => {
                      if (newAnnChannel.trim()) {
                        const oldList = currentSettings.announcementChannels || [];
                        if (!oldList.includes(newAnnChannel.trim())) {
                          updateSettings({ announcementChannels: [...oldList, newAnnChannel.trim()] });
                        }
                        setNewAnnChannel('');
                      }
                    }}>Add ID</Button>
                  </div>
                  <div className="keyword-tags">
                    {(currentSettings.announcementChannels || []).map(chId => (
                      <span key={chId} className="keyword-tag">
                        Announce: {chId}
                        <button type="button" className="tag-remove" onClick={() => {
                          updateSettings({ announcementChannels: currentSettings.announcementChannels.filter(c => c !== chId) });
                        }}>×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="settings-sidebar">
            <Card className="settings-card">
              <div className="card-header">
                <SettingsIcon className="header-icon" />
                <h2>Blacklist Keywords</h2>
              </div>
              <p className="keyword-desc">Add custom words or phrases to block dynamically.</p>
              
              <form onSubmit={handleKeywordAdd} className="keyword-input-group">
                <input 
                  type="text" 
                  placeholder="e.g. steam-gift" 
                  className="keyword-input" 
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                />
                <Button type="submit" variant="outline">
                  <Plus size={16} />
                </Button>
              </form>
              
              <div className="keyword-tags">
                {currentSettings.blacklistKeywords.length === 0 ? (
                  <div className="empty-keywords-text">No custom keywords. Default global list active.</div>
                ) : (
                  currentSettings.blacklistKeywords.map(kw => (
                    <span key={kw} className="keyword-tag">
                      {kw}
                      <button 
                        type="button" 
                        className="tag-remove" 
                        onClick={() => removeKeyword(kw)}
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
