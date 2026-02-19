import React from 'react';
import './App.css';

function StudentWelcome({ name, onStart, onBack }) {
  return (
    <div className="container student-welcome" style={{ position: 'relative' }}>
      <button className="back-btn" onClick={onBack} style={{ position: 'absolute', top: 18, left: 18, zIndex: 2 }}>
        <span className="material-icons" style={{ fontSize: 22, verticalAlign: 'middle', color: '#667eea' }}>arrow_back</span>
      </button>
      <div className="student-icon">
        {/* Google Material Icons assignment icon */}
        <span className="material-icons" style={{ fontSize: 64, color: '#667eea' }}>
          assignment
        </span>
      </div>
      <div className="student-welcome-content">
        <h1 className="student-heading">Welcome {name} to the Questionnaire System</h1>
        <p className="caption student-caption">
          Test your knowledge with our quizzes and test papers
        </p>
        <button className="cta-button" onClick={onStart}>
          Start Now
        </button>
      </div>
    </div>
  );
}

export default StudentWelcome;
