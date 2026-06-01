import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';
import './Toasts.css';

const Toast = ({ alert }) => {
  const removeAlert = useStore((state) => state.removeAlert);

  const icons = {
    success: <CheckCircle className="toast-icon text-success" size={18} />,
    error: <AlertCircle className="toast-icon text-danger" size={18} />,
    warning: <AlertTriangle className="toast-icon text-warning" size={18} />,
    info: <Info className="toast-icon text-info" size={18} />,
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`toast-notification glass toast-${alert.type}`}
    >
      <div className="toast-content">
        {icons[alert.type] || icons.info}
        <span className="toast-message">{alert.message}</span>
      </div>
      <button className="toast-close" onClick={() => removeAlert(alert.id)}>
        <X size={16} />
      </button>
    </motion.div>
  );
};

const Toasts = () => {
  const alerts = useStore((state) => state.alerts);

  return (
    <div className="toasts-container">
      <AnimatePresence>
        {(alerts || []).map((alert) => (
          <Toast key={alert.id} alert={alert} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Toasts;
