import React, { useState } from 'react';
import './App.css';
import { showToast } from './Toast';

function Welcome({ onSignIn, onBack, onStudentSignIn, onAdminSignIn }) {
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showChoice, setShowChoice] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [student, setStudent] = useState({ name: '', roll: '', day: '', month: '', year: '' });
  const [admin, setAdmin] = useState({ email: '', password: '' });

  // Generate options for day, month, year
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 60 }, (_, i) => currentYear - i);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (showStudentForm) {
      setStudent((prev) => ({ ...prev, [name]: value }));
    } else if (showAdminForm) {
      setAdmin((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleStudentSignIn = async (e) => {
    e.preventDefault();
    const dob = `${student.day}-${student.month}-${student.year}`;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://qms-sjuv.onrender.com'}/api/students/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: student.name,
          rollNumber: student.roll,
          dateOfBirth: dob
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful
        setShowStudentForm(false);
        setShowChoice(false);
        if (onStudentSignIn) onStudentSignIn(data.student.name, data.student);
        setStudent({ name: '', roll: '', day: '', month: '', year: '' });
      } else {
        // Login failed - show error
        showToast(data.error || 'Invalid credentials or account is inactive', 'error');
      }
    } catch (err) {
      showToast('Error connecting to server. Please try again.', 'error');
      console.error('Login error:', err);
    }
  };

  const handleAdminSignIn = (e) => {
    e.preventDefault();
    setShowAdminForm(false);
    setShowChoice(false);
    setAdmin({ email: '', password: '' });
    if (onAdminSignIn) onAdminSignIn(admin.email);
  };

  return (
    <>
      <div className="container welcome" style={{ position: 'relative',marginTop: '60px',zIndex: 1 }}>
        <button className="back-btn" onClick={onBack} style={{ position: 'absolute', top: 18, left: 18, zIndex: 2 }}>
          <span className="material-icons" style={{ fontSize: 22, verticalAlign: 'middle', color: '#667eea' }}>arrow_back</span>
        </button>
        <div className="welcome-icon">
          <span className="material-icons" style={{ fontSize: 64, color: '#667eea' }}>sentiment_satisfied_alt</span>
        </div>
        <h1 className="welcome-heading">Welcome to the Questionnaire System!</h1>
        <p className="caption welcome-caption">
          Prepare, participate, and excel in your exams.<br />
          Manage and answer questionnaires with ease and confidence.
        </p>
        <button className="cta-button" onClick={() => setShowChoice(true)}>
          Sign In
        </button>
      </div>

      {showChoice && (
        <div className="modal-overlay" onClick={() => { setShowChoice(false); setShowStudentForm(false); setShowAdminForm(false); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            {!showStudentForm && !showAdminForm ? (
              <>
                <h2>Sign in as</h2>
                <div className="modal-buttons">
                  <button className="modal-btn student" onClick={() => { setShowStudentForm(true); setShowAdminForm(false); }}>Student</button>
                  <button className="modal-btn admin" onClick={() => { setShowAdminForm(true); setShowStudentForm(false); }}>Admin</button>
                </div>
                <div style={{ margin: '18px 0 0 0' }}>
                  <button className="modal-btn student" style={{ background: 'linear-gradient(90deg, #5ec6e7 60%, #667eea 100%)', fontSize: '0.98em', padding: '10px 24px' }}
                    onClick={() => {
                      setShowChoice(false);
                      setShowStudentForm(false);
                      setShowAdminForm(false);
                      if (typeof onStudentSignIn === 'function') onStudentSignIn('Demo Student');
                    }}>
                    Demo Sign In (Student)
                  </button>
                </div>
                <button className="close-btn" onClick={() => { setShowChoice(false); setShowStudentForm(false); setShowAdminForm(false); }}>&times;</button>
              </>
            ) : showStudentForm ? (
              <>
                <h2>Student Sign In</h2>
                <form className="student-form" onSubmit={handleStudentSignIn}>
                  <input
                    type="text"
                    name="name"
                    placeholder="Name"
                    value={student.name}
                    onChange={handleInputChange}
                    required
                  />
                  <input
                    type="text"
                    name="roll"
                    placeholder="Roll Number"
                    value={student.roll}
                    onChange={handleInputChange}
                    required
                  />
                  <div className="dob-fields">
                    <select
                      name="day"
                      value={student.day}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Day</option>
                      {days.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                    <select
                      name="month"
                      value={student.month}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Month</option>
                      {months.map((month, idx) => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                    <select
                      name="year"
                      value={student.year}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Year</option>
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <button className="modal-btn student" type="submit">Sign In</button>
                </form>
                <button className="close-btn" onClick={() => { setShowChoice(false); setShowStudentForm(false); setShowAdminForm(false); }}>&times;</button>
              </>
            ) : (
              <>
                <h2>Admin Sign In</h2>
                <form className="admin-form" onSubmit={handleAdminSignIn}>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email ID"
                    value={admin.email}
                    onChange={handleInputChange}
                    required
                  />
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input
                      className="admin-password-input"
                      type={showAdminPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Password"
                      value={admin.password}
                      onChange={handleInputChange}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowAdminPassword(v => !v)}
                      style={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#667eea',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.98em',
                        padding: 0,
                        fontFamily: 'inherit',
                        lineHeight: 1
                      }}
                    >
                      {showAdminPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <button className="modal-btn admin" type="submit">Sign In</button>
                </form>
                <button className="close-btn" onClick={() => { setShowChoice(false); setShowStudentForm(false); setShowAdminForm(false); }}>&times;</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}


export default Welcome;
