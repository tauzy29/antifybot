import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, ShieldAlert, Settings, Crown, LogOut, Gavel } from 'lucide-react';
import { useStore } from '../store/useStore';
import './Sidebar.css';

const navItems = [
  { name: 'Overview', path: '/', icon: LayoutDashboard },
  { name: 'Analytics', path: '/analytics', icon: Activity },
  { name: 'Moderation Center', path: '/moderation', icon: Gavel },
  { name: 'Logs', path: '/logs', icon: ShieldAlert },
  { name: 'Settings', path: '/settings', icon: Settings },
  { name: 'Premium', path: '/premium', icon: Crown },
];

const Sidebar = () => {
  const { activeGuild, logoutUser } = useStore();

  return (
    <aside className="sidebar glass">
      <div className="sidebar-header">
        <div className="logo-container">
          <img src="/logo.png" alt="ANTIFY Logo" className="logo-image" />
          <span className="logo-text">ANTIFY</span>
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
