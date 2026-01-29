import React from 'react';
import './StatCard.css';

const StatCard = ({ title, value, icon, color, subtitle }) => {
  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-icon">
        <i className={`fas ${icon}`}></i>
      </div>
      <div className="stat-content">
        <h3 className="stat-title">{title}</h3>
        <h2 className="stat-value">{value}</h2>
        {subtitle && <p className="stat-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatCard;