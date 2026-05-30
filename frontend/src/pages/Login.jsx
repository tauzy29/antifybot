import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/Button';
import { useStore } from '../store/useStore';
import { BACKEND_URL } from '../config';
import './Login.css';

const Login = () => {
  const { isAuthenticated, fetchUser } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user session already exists
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleDiscordLogin = () => {
    // Redirect to Discord OAuth backend endpoint
    window.location.href = `${BACKEND_URL}/api/auth/login`;
  };

  return (
    <div className="login-page">
      <div className="animated-background">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      
      <div className="login-container">
        <motion.div 
          className="login-card glass glow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="login-header">
            <img src="/logo.png" alt="ANTIFY Logo" className="logo-image-lg" />
            <h1 className="brand-name">ANTIFY</h1>
            <p className="brand-tagline">Advanced AI Anti-Scam Moderation</p>
          </div>
          
          <div className="login-body">
            <Button 
              className="discord-btn" 
              onClick={handleDiscordLogin}
            >
              Login with Discord
            </Button>
            <p className="login-terms">
              By logging in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
