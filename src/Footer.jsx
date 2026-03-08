import React from 'react';
import './App.css';

function Footer() {
  const deploymentUrl = import.meta.env.VITE_DEPLOYMENT_URL || 'https://qms-ruddy.vercel.app';
  
  return (
    <footer className="app-footer">
      <span>© 2026 Questionnaire Management System. All rights reserved.</span>
      {deploymentUrl && (
        <span style={{ marginLeft: 10 }}>
          | <a href={deploymentUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>
            Live Demo
          </a>
        </span>
      )}
    </footer>
  );
}

export default Footer;
