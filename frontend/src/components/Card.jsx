import React from 'react';
import { motion } from 'framer-motion';
import './Card.css';

const Card = ({ children, className = '', hoverEffect = false, glow = false }) => {
  const baseClasses = `card glass ${glow ? 'glow' : ''} ${className}`;
  
  if (hoverEffect) {
    return (
      <motion.div 
        className={baseClasses}
        whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(139, 92, 246, 0.3)' }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={baseClasses}>
      {children}
    </div>
  );
};

export default Card;
