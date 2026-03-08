import React, { useState, useEffect } from "react";
import "./App.css";
import { showToast } from "./Toast";
import AttributeMaster from "./AttributeMaster";
import AttributeValues from "./AttributeValues";
import QuestionsPage from "./Questions";
import UserManagement from "./UserManagement";
import QuestionPapers from "./QuestionPapers";
import SettingsPage from "./SettingsPage";
import Results from "./Results";

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
  
  // Query management state
  const [queries, setQueries] = useState([]);
  const [loadingQueries, setLoadingQueries] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  
  // Fetch queries when queries page is active
  useEffect(() => {
    if (mainPage !== 'queries') return;
    
    const fetchQueries = async () => {
      setLoadingQueries(true);
      try {
        const response = await fetch('http://localhost:5000/api/queries');
        if (response.ok) {
          const data = await response.json();
          setQueries(data);
        }
      } catch (err) {
        console.error('Error fetching queries:', err);
      }
      setLoadingQueries(false);
    };
    
    fetchQueries();
  }, [mainPage]);
  
  // Handle responding to a query
  const handleRespondToQuery = async (queryId) => {
    if (!responseText.trim()) {
      showToast('Please enter a response', 'warning');
      return;
    }
    
    setSubmittingResponse(true);
    try {
      const response = await fetch(`http://localhost:5000/api/queries/${queryId}/respond`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminResponse: responseText })
      });
      
      if (response.ok) {
        // Refresh queries
        const queriesResponse = await fetch('http://localhost:5000/api/queries');
        if (queriesResponse.ok) {
          const data = await queriesResponse.json();
          setQueries(data);
        }
        // Close the modal
        setSelectedQuery(null);
        setResponseText('');
        showToast('Response submitted successfully!', 'success');
      } else {
        showToast('Failed to submit response. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Error responding to query:', err);
      showToast('Error connecting to server.', 'error');
    }
    setSubmittingResponse(false);
  };
  
  // Handle delete query
  const handleDeleteQuery = async (queryId) => {
    if (!confirm('Are you sure you want to delete this query?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/queries/${queryId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Refresh queries
        const queriesResponse = await fetch('http://localhost:5000/api/queries');
        if (queriesResponse.ok) {
          const data = await queriesResponse.json();
          setQueries(data);
        }
        showToast('Query deleted successfully!', 'success');
      } else {
        showToast('Failed to delete query. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Error deleting query:', err);
      showToast('Error connecting to server.', 'error');
    }
  };
  
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
            <li style={{fontWeight: mainPage === 'results' ? 700 : 600, cursor:'pointer'}} onClick={() => setMainPage('results')}>Results</li>
            <li style={{fontWeight: mainPage === 'user-management' ? 700 : 600, cursor:'pointer'}} onClick={() => setMainPage('user-management')}>Manage Users</li>
            <li style={{fontWeight: mainPage === 'queries' ? 700 : 600, cursor:'pointer'}} onClick={() => setMainPage('queries')}>Queries</li>
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
          {mainPage === 'results' && (
            <Results onHomeClick={() => setMainPage('dashboard')} />
          )}
{mainPage === 'user-management' && (
            <UserManagement onHomeClick={() => setMainPage('dashboard')} />
          )}
          {mainPage === 'settings' && (
            <SettingsPage onHomeClick={() => setMainPage('dashboard')} />
          )}
          
          {/* Queries Management */}
          {mainPage === 'queries' && (
            <div style={{ padding: '20px' }}>
              <h2 style={{ marginBottom: 24, color: '#333' }}>Student Queries</h2>
              
              {loadingQueries ? (
                <p style={{ textAlign: 'center', padding: 20 }}>Loading queries...</p>
              ) : queries.length ===0 ? (
                <div style={{ 
                  background: '#fff', 
                  borderRadius: 12, 
                  padding: 40,
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <p style={{ fontSize: '1.1em', color: '#888' }}>
                    No queries from students yet.
                  </p>
                  <p style={{ marginTop: 8, color: '#666' }}>
                    Students will appear here when they submit queries.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                  {queries.map((query) => (
                    <div 
                      key={query._id}
                      style={{
                        background: '#fff',
                        borderRadius: 12,
                        padding: 20,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        borderLeft: `4px solid ${query.status === 'Responded' ? '#4caf50' : '#ff9800'}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', color: '#333', fontSize: '1.1em' }}>
                            {query.subject || 'General Inquiry'}
                          </h3>
                          <p style={{ margin: 0, fontSize: '0.85em', color: '#888' }}>
                            From: {query.studentName} (Roll: {query.rollNumber})
                          </p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.85em', color: '#888' }}>
                            Submitted on: {query.createdAt ? new Date(query.createdAt).toLocaleDateString('en-GB', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Unknown'}
                          </p>
                        </div>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: 12,
                          fontSize: '0.85em',
                          fontWeight: 600,
                          backgroundColor: query.status === 'Responded' ? '#4caf50' : '#ff9800',
                          color: '#fff'
                        }}>
                          {query.status === 'Responded' ? '✓ Resolved' : '⏳ Pending'}
                        </span>
                      </div>
                      
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#444' }}>Student's Message:</p>
                        <p style={{ margin: 0, color: '#666', lineHeight: 1.5 }}>{query.message}</p>
                      </div>
                      
                      {query.adminResponse && (
                        <div style={{ 
                          background: '#e8f5e9', 
                          borderRadius: 8, 
                          padding: 16,
                          marginBottom: 12
                        }}>
                          <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#2e7d32' }}>Your Response:</p>
                          <p style={{ margin: 0, color: '#333', lineHeight: 1.5 }}>{query.adminResponse}</p>
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        {query.status !== 'Responded' && (
                          <button 
                            className="cta-button"
                            onClick={() => {
                              setSelectedQuery(query);
                              setResponseText(query.adminResponse || '');
                            }}
                            style={{ padding: '8px 16px', fontSize: '0.9em' }}
                          >
                            Respond
                          </button>
                        )}
                        <button 
                          className="cta-button"
                          onClick={() => handleDeleteQuery(query._id)}
                          style={{ 
                            padding: '8px 16px', 
                            fontSize: '0.9em',
                            background: '#f44336'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Response Modal */}
          {selectedQuery && (
            <div className="popup-overlay">
              <div className="popup-form" style={{ minWidth: 400, maxWidth: 500 }}>
                <div className="popup-header">
                  <span className="popup-title">Respond to Query</span>
                  <button className="popup-close" onClick={() => { setSelectedQuery(null); setResponseText(''); }}>&times;</button>
                </div>
                <div className="popup-body">
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#444' }}>From: {selectedQuery.studentName}</p>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.9em', color: '#888' }}>Roll: {selectedQuery.rollNumber}</p>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.9em', color: '#888' }}>Subject: {selectedQuery.subject || 'General Inquiry'}</p>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#444' }}>Student's Message:</p>
                    <p style={{ margin: 0, color: '#666', lineHeight: 1.5, background: '#f5f5f5', padding: 12, borderRadius: 6 }}>{selectedQuery.message}</p>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#444' }}>Your Response:</label>
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Type your response to the student..."
                      rows={5}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 6,
                        border: '1px solid #ccc',
                        fontSize: 14,
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </div>
                <div className="popup-actions">
                  <button 
                    className="cta-button" 
                    style={{ marginRight: 12 }}
                    onClick={() => { setSelectedQuery(null); setResponseText(''); }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="cta-button"
                    disabled={submittingResponse}
                    onClick={() => handleRespondToQuery(selectedQuery._id)}
                  >
                    {submittingResponse ? 'Submitting...' : 'Submit Response'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

