import React, { useState } from "react";
import "./App.css";
import AttributeMaster from "./AttributeMaster";
import AttributeValues from "./AttributeValues";
import QuestionsPage from "./Questions";
import UserManagement from "./UserManagement";
import QuestionPapers from "./QuestionPapers";
import SettingsPage from "./SettingsPage";

export default function AdminDashboard({ onLogout }) {
  const [mainPage, setMainPage] = useState('dashboard');
  const [showAdminProfile, setShowAdminProfile] = useState(false);
  const [adminDetails, setAdminDetails] = useState({
    name: 'Admin User',
    id: 'admin001',
    password: 'adminpass'
  });
  const [editDetails, setEditDetails] = useState(adminDetails);
  const [editMode, setEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const handleProfileSave = () => {
    setAdminDetails(editDetails);
    setEditMode(false);
  };
  return (
    <div className="admin-landing-root">
      {/* Header Navbar */}
      <header className="admin-header">
        <div className="admin-logo">
          <span className="material-icons" style={{ verticalAlign: "middle", fontSize: 32 }}>admin_panel_settings</span>
          <span className="admin-title">Admin Panel</span>
        </div>
        <nav className="admin-navbar-menu">
          <button className="admin-navbar-btn" onClick={() => setShowAdminProfile(true)}>AdminUser</button>
          <button className="admin-navbar-btn" onClick={onLogout}>Logout</button>
        </nav>
      </header>
      {/* Side Panel + Main Content */}
      <div className="admin-main-layout">
        {showAdminProfile && (
          <div className="popup-overlay">
            <div className="popup-form" style={{ minWidth: 340, maxWidth: 400 }}>
              <div className="popup-header">
                <span className="popup-title">Admin Profile</span>
                <button className="popup-close" onClick={() => { setShowAdminProfile(false); setEditMode(false); }}>&times;</button>
              </div>
              <div className="popup-body">
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Admin Name</label>
                {editMode ? (
                  <input
                    type="text"
                    value={editDetails.name}
                    onChange={e => setEditDetails({ ...editDetails, name: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', marginBottom: 16 }}
                  />
                ) : (
                  <div style={{ marginBottom: 16 }}>{adminDetails.name}</div>
                )}
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Admin ID</label>
                {editMode ? (
                  <input
                    type="text"
                    value={editDetails.id}
                    onChange={e => setEditDetails({ ...editDetails, id: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', marginBottom: 16 }}
                  />
                ) : (
                  <div style={{ marginBottom: 16 }}>{adminDetails.id}</div>
                )}
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Password</label>
                {editMode ? (
                  <div style={{ position: 'relative', marginBottom: 24 }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={editDetails.password}
                      onChange={e => setEditDetails({ ...editDetails, password: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#1976d2', fontWeight: 600, cursor: 'pointer', fontSize: '0.98em', padding: 0, fontFamily: 'inherit', lineHeight: 1 }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                ) : (
                  <div style={{ marginBottom: 24, position: 'relative' }}>
                    <span>{showPassword ? adminDetails.password : '••••••••'}</span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#1976d2', fontWeight: 600, cursor: 'pointer', fontSize: '0.98em', padding: 0, fontFamily: 'inherit', lineHeight: 1 }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                )}
              </div>
              <div className="popup-actions">
                {editMode ? (
                  <>
                    <button className="cta-button" style={{ marginRight: 12 }} onClick={() => setEditMode(false)}>Cancel</button>
                    <button className="cta-button" onClick={handleProfileSave}>Save</button>
                  </>
                ) : (
                  <button className="cta-button" onClick={() => { setEditDetails(adminDetails); setEditMode(true); }}>Edit</button>
                )}
              </div>
            </div>
          </div>
        )}
        <aside className="admin-sidepanel">
          <ul>
            <li style={{fontWeight: mainPage === 'dashboard' ? 700 : 600, cursor:'pointer'}} onClick={() => setMainPage('dashboard')}>Dashboard</li>
            <li style={{fontWeight: mainPage === 'questions' ? 700 : 600, cursor:'pointer'}} onClick={() => setMainPage('questions')}>Questions</li>
            <li style={{fontWeight: mainPage === 'question-papers' ? 700 : 600, cursor:'pointer'}} onClick={() => setMainPage('question-papers')}>Question Papers</li>
            <li style={{fontWeight: 600}}>Results</li>
<li style={{fontWeight: mainPage === 'user-management' ? 700 : 600, cursor:'pointer'}} onClick={() => setMainPage('user-management')}>Manage Users</li>
            <li style={{fontWeight: mainPage === 'settings' ? 700 : 600, cursor:'pointer'}} onClick={() => setMainPage('settings')}>Settings</li>
          </ul>
        </aside>
        <main className="admin-content">
          {mainPage === 'dashboard' && (
            <>
              <h2 className="admin-landing-heading">Welcome to the Admin Page!</h2>
              <p className="admin-landing-caption">Manage users, questions, results, and system settings from the navigation options.</p>
              <div className="admin-dashboard-row">
                <div className="admin-dashboard-panel" style={{cursor:'pointer'}} onClick={() => setMainPage('attribute-master')}>
                  <h2>Attribute Masters</h2>
                  <p>Manage all attribute master records here.</p>
                </div>
                <div className="admin-dashboard-panel" style={{cursor:'pointer'}} onClick={() => setMainPage('attribute-values')}>
                  <h2>Attribute Values</h2>
                  <p>View and edit attribute values here.</p>
                </div>
              </div>
            </>
          )}
          {mainPage === 'attribute-master' && (
            <AttributeMaster onHomeClick={() => setMainPage('dashboard')} />
          )}
          {mainPage === 'attribute-values' && (
            <AttributeValues onHomeClick={() => setMainPage('dashboard')} />
          )}
          {mainPage === 'questions' && (
            <QuestionsPage onHomeClick={() => setMainPage('dashboard')} />
          )}
          {mainPage === 'question-papers' && (
            <QuestionPapers onHomeClick={() => setMainPage('dashboard')} />
          )}
{mainPage === 'user-management' && (
            <UserManagement onHomeClick={() => setMainPage('dashboard')} />
          )}
          {mainPage === 'settings' && (
            <SettingsPage onHomeClick={() => setMainPage('dashboard')} />
          )}
        </main>
      </div>
    </div>
  );
}
