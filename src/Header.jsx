import React from 'react';
import './App.css';

function Header({ title = "QMS Admin", children }) {
  return (
    <nav className="navbar">
      <div className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="material-icons" style={{ fontSize: 36, color: '#fff' }}>admin_panel_settings</span>
      </div>
      <div className="navbar-title" style={{ fontWeight: 700, fontSize: '1.25em', marginLeft: 18, color: '#fff' }}>
        {title}
      </div>
      {children}
    </nav>
  );
}

export default Header;
