import React from 'react';
import './App.css';

function StudentDashboard({ name, onProjectTitleClick, onLogout }) {
  return (
    <div className="dashboard-fullpage">
      <nav className="navbar">
        <div className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="material-icons" style={{ fontSize: 36, color: '#fff' }}>assignment</span>
        </div>
        <div
          className="navbar-title"
          style={{ fontWeight: 700, fontSize: '1.25em', marginLeft: 18, color: '#fff', cursor: 'pointer', userSelect: 'none' }}
          onClick={onProjectTitleClick}
          title="Go to landing page"
        >
          Questionnaire System
        </div>
        <ul className="navbar-menu" style={{ display: 'flex', listStyle: 'none', marginLeft: 'auto', gap: 28, alignItems: 'center' }}>
          <li className="navbar-menu-item" style={{ cursor: 'pointer' }}>Home</li>
          <li className="navbar-menu-item" style={{ cursor: 'pointer' }}>My Test</li>
          <li className="navbar-menu-item" style={{ cursor: 'pointer' }}>Results</li>
          <li className="navbar-menu-item" style={{ cursor: 'pointer' }}>Profile</li>
          <li className="navbar-menu-item" style={{ cursor: 'pointer', color: '#ffd6d6' }} onClick={onLogout}>Logout</li>
        </ul>
      </nav>
      <div className="dashboard-content" >
        <div className="dashboard-welcome-content"><br />
          <h1>Welcome, {name}! Ready to start your quiz?</h1>
          <p>This is your dashboard. Here you can access quizzes, test papers, and your results.</p>
          <button className="cta-button">Start Quiz</button>
        </div>
        {/* Add more dashboard features here */}
          <div className="dashboard-row">
            <div className="dashboard-main-panel">
              {/* Main (wider) left container content goes here */}
              <h3>Main Panel</h3>
              <p>This is the main (wider) panel.</p>
            </div>
            <div className="dashboard-side-panel">
              {/* Right (narrower) side container content goes here */}
              <h3>Side Panel</h3>
              <p>This is the side (narrower) panel.</p>
            </div>
          </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
