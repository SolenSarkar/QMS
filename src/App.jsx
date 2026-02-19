import React from 'react';
import './App.css';

function App({ onGetStarted }) {
  return (
    <div className="container">
      <h1>Questionnaire Management System</h1>
      <p className="caption">
        WHERE STUDENTS CAN PREPARE FOR THE BEST <br />
        AND ACHIEVE EXCELLENT GRADES IN EXAMS<br /><br />
        Gather valuable insights with our comprehensive questionnaire management platform.
      </p>
      <button className="cta-button" onClick={onGetStarted}>
        Get Started
        <span className="arrow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>
    </div>
  );
}

export default App;
