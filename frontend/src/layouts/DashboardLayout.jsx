import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import Toasts from '../components/Toasts';
import { useStore } from '../store/useStore';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const { isAuthenticated, authLoading, fetchUser } = useStore();
  const navigate = useNavigate();

  // Validate session on load
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // If loading authentication state, show a clean loader
  if (authLoading) {
    return (
      <div className="layout-loading-screen">
        <div className="loader-spinner"></div>
        <span>Authenticating with ANTIFY Cloud...</span>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <TopNav />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
      {/* Real-time Notification System */}
      <Toasts />
    </div>
  );
};

export default DashboardLayout;
