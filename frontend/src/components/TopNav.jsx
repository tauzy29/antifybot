import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, ChevronDown, PlusCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import './TopNav.css';

const TopNav = () => {
  const { user, guilds, activeGuild, setActiveGuild } = useStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredGuilds = guilds.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectGuild = (guild) => {
    setActiveGuild(guild);
    setDropdownOpen(false);
  };

  const handleInviteBot = (guildId) => {
    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=1501936383160225852&permissions=8&scope=bot%20applications.commands&guild_id=${guildId}&disable_guild_select=true`;
    window.open(inviteUrl, '_blank');
  };

  const userAvatar = user?.avatar 
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    : 'https://cdn.discordapp.com/embed/avatars/0.png';

  return (
    <header className="topnav glass">
      <div className="topnav-left">
        {/* Guild Selector Dropdown in Topbar */}
        {user && (
          <div className="guild-selector-container" ref={dropdownRef}>
            <button 
              className="guild-selector-btn glass"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {activeGuild ? (
                <>
                  {activeGuild.icon ? (
                    <img src={activeGuild.icon} alt={activeGuild.name} className="guild-icon-avatar" />
                  ) : (
                    <div className="guild-icon-placeholder">
                      {activeGuild.name.charAt(0)}
                    </div>
                  )}
                  <span className="guild-selector-name">{activeGuild.name}</span>
                </>
              ) : (
                <span className="guild-selector-name">Select Server</span>
              )}
              <ChevronDown size={16} className={`chevron-icon ${dropdownOpen ? 'rotated' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="guild-dropdown glass glow">
                <div className="guild-dropdown-search">
                  <Search size={14} />
                  <input 
                    type="text" 
                    placeholder="Search servers..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="guild-list">
                  {filteredGuilds.length === 0 ? (
                    <div className="guild-list-empty">No servers found</div>
                  ) : (
                    filteredGuilds.map((g) => (
                      <div 
                        key={g.id} 
                        className={`guild-item ${activeGuild?.id === g.id ? 'active' : ''}`}
                        onClick={() => handleSelectGuild(g)}
                      >
                        <div className="guild-item-info">
                          {g.icon ? (
                            <img src={g.icon} alt={g.name} className="guild-icon-avatar-sm" />
                          ) : (
                            <div className="guild-icon-placeholder-sm">
                              {g.name.charAt(0)}
                            </div>
                          )}
                          <span className="guild-item-name">{g.name}</span>
                        </div>
                        
                        {!g.botActive && (
                          <button 
                            className="invite-btn-sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInviteBot(g.id);
                            }}
                          >
                            <PlusCircle size={14} />
                            <span>Invite</span>
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="topnav-actions">
        <button className="icon-btn action-btn">
          <Bell size={20} />
          {activeGuild?.botActive && <span className="badge">1</span>}
        </button>
        
        {user && (
          <div className="user-profile">
            <img 
              src={userAvatar} 
              alt={user.username} 
              className="avatar" 
            />
            <div className="user-info">
              <span className="user-name">{user.username}</span>
              <span className="user-role">Administrator</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopNav;
