import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import DashboardLayout from './layouts/DashboardLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Logs from './pages/Logs';
import Moderation from './pages/Moderation';
import Settings from './pages/Settings';
import Premium from './pages/Premium';

import './index.css';

function App() {

  return (

    <Router>

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
              MODERATION CONTROL
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

        </Route>

        {/* =========================
            FALLBACK ROUTE
        ========================== */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>

    </Router>
  );
}

export default App;