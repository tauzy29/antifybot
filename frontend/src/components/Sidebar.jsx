import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, ShieldAlert, Settings, Crown, LogOut, Gavel, BarChart3, ShieldCheck } from 'lucide-react';
import { useStore } from '../store/useStore';
import './Sidebar.css';

const Sidebar = () => {
  const { activeGuild, logoutUser, user, premium } = useStore();

  const getNavItems = () => {
    const items = [
      { name: 'Overview', path: '/', icon: LayoutDashboard },
      { name: 'Analytics', path: '/analytics', icon: Activity },
      { name: 'Moderation Center', path: '/moderation', icon: Gavel },
      { name: 'Logs', path: '/logs', icon: ShieldAlert },
      { name: 'Settings', path: '/settings', icon: Settings },
      { name: 'Usage & Limits', path: '/usage-limits', icon: BarChart3 },
    ];

    items.push({ name: 'Premium Status', path: '/premium', icon: Crown });

    // Global Bot Owner Panel
    if (user && user.id === '1060801714187415552') {
      items.push({ name: 'Owner Panel', path: '/owner-panel', icon: ShieldCheck });
    }

    return items;
  };

  const navItems = getNavItems();

  const isOwner = user && user.id === '1060801714187415552';
  const tierLabel = isOwner ? 'PRO+' : (premium?.plan === 'Pro' ? 'PRO' : 'FREE');
  const tierClass = isOwner ? 'tier-pro-plus' : (premium?.plan === 'Pro' ? 'tier-pro' : 'tier-free');

  return (
    <aside className="sidebar glass">
      <div className="sidebar-header">
        <div className="logo-container">
          <img src="/logo.png" alt="ANTIFY Logo" className="logo-image" />
          <div className="logo-text-group">
            <span className="logo-text">ANTIFY</span>
            {activeGuild && activeGuild.botActive && (
              <span className={`guild-tier-badge ${tierClass}`}>{tierLabel}</span>
            )}
          </div>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isLinkDisabled = activeGuild && !activeGuild.botActive && item.path !== '/premium';
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `nav-item ${isActive ? 'active' : ''} ${isLinkDisabled ? 'disabled-nav' : ''}`
              }
              onClick={(e) => {
                if (isLinkDisabled) {
                  e.preventDefault();
                  useStore.getState().addAlert('Please invite the bot to this server to unlock this feature.', 'warning');
                }
              }}
            >
              <Icon className="nav-icon" size={20} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={logoutUser}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
