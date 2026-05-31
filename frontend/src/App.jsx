import React, { Suspense, lazy } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import DashboardLayout from './layouts/DashboardLayout';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Lazy load page components for bundle optimization & code splitting
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Logs = lazy(() => import('./pages/Logs'));
const Moderation = lazy(() => import('./pages/Moderation'));
const Settings = lazy(() => import('./pages/Settings'));
const Premium = lazy(() => import('./pages/Premium'));
const UsageLimits = lazy(() => import('./pages/UsageLimits'));
const OwnerPanel = lazy(() => import('./pages/OwnerPanel'));

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={
          <div className="layout-loading-screen">
            <div className="loader-spinner"></div>
            <span>Loading Antify Dashboard components...</span>
          </div>
        }>
          <Routes>
            {/* =========================
                LOGIN
            ========================== */}
            <Route
              path="/login"
              element={<Login />}
            />

            {/* =========================
                DASHBOARD LAYOUT
            ========================== */}
            <Route
              path="/"
              element={<DashboardLayout />}
            >
              {/* =====================
                  DEFAULT DASHBOARD
              ====================== */}
              <Route
                index
                element={<Dashboard />}
              />

              {/* =====================
                  /dashboard ROUTE
              ====================== */}
              <Route
                path="dashboard"
                element={<Dashboard />}
              />

              {/* =====================
                  ANALYTICS
              ====================== */}
              <Route
                path="analytics"
                element={<Analytics />}
              />

              {/* =====================
                  /moderation ROUTE
              ====================== */}
              <Route
                path="moderation"
                element={<Moderation />}
              />

              {/* =====================
                  LOGS
              ====================== */}
              <Route
                path="logs"
                element={<Logs />}
              />

              {/* =====================
                  SETTINGS
              ====================== */}
              <Route
                path="settings"
                element={<Settings />}
              />

              {/* =====================
                  PREMIUM
              ====================== */}
              <Route
                path="premium"
                element={<Premium />}
              />

              {/* =====================
                  USAGE & LIMITS
              ====================== */}
              <Route
                path="usage-limits"
                element={<UsageLimits />}
              />

              {/* =====================
                  OWNER PANEL
              ====================== */}
              <Route
                path="owner-panel"
                element={<OwnerPanel />}
              />
            </Route>

            {/* =========================
                FALLBACK ROUTE
            ========================== */}
            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;