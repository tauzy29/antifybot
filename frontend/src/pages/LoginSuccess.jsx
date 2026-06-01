import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';

const LoginSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchUser } = useStore();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('antify_token', token);
      // Trigger user fetch to load session state with the new token
      fetchUser();
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate, fetchUser]);

  return (
    <div className="layout-loading-screen">
      <div className="loader-spinner"></div>
      <span>Finalizing secure login...</span>
    </div>
  );
};

export default LoginSuccess;
