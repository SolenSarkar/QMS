import React, { useState, useEffect } from 'react';
import './App.css';

function StudentDashboard({ name, studentData, onProjectTitleClick, onLogout }) {
  // Extract student info from studentData prop
  const rollNumber = studentData?.rollNumber || '';
  const dateOfBirth = studentData?.dateOfBirth || '';
  
  // Use className and boardName directly from API response (set by backend)
  const className = studentData?.className || studentData?.classId?.valueName || '';
  const boardName = studentData?.boardName || studentData?.boardId?.valueName || '';
  
  // Get student IDs for API calls
  const classId = studentData?.classId || '';
  const studentId = studentData?._id || '';

  // Active tab state: 'home', 'mytest', 'results', 'profile'
  const [activeTab, setActiveTab] = useState('home');
  
  // State for subjects and questions
  const [subjects, setSubjects] = useState([]);
  const [subjectsWithQuestions, setSubjectsWithQuestions] = useState({});
  const [loading, setLoading] = useState(true);
  const [availableCount, setAvailableCount] = useState(0);
  const [incompleteCount, setIncompleteCount] = useState(0);

  // My Test tab state - subject and difficulty selection
  const [selectedTestSubject, setSelectedTestSubject] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [testPapers, setTestPapers] = useState([]);
  const [loadingPapers, setLoadingPapers] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [showPaperPreview, setShowPaperPreview] = useState(false);

  // State for profile view/edit
  const [showProfile, setShowProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: studentData?.name || '',
    rollNumber: studentData?.rollNumber || '',
    dateOfBirth: studentData?.dateOfBirth || '',
    className: className,
    boardName: boardName
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Normalize ID to string
  const normalizeId = (id) => {
    if (!id) return "";
    if (typeof id === 'string') return id;
    if (id.$oid) return id.$oid;
    return String(id);
  };

  // Fetch subjects and check for questions
  useEffect(() => {
    if (!classId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch attributes to get subject attribute ID
        const attrsRes = await fetch("http://localhost:5000/api/attributes");
        const attrs = await attrsRes.json();
        
        const subjectAttr = attrs.find(a => a.name && a.name.toLowerCase() === "subject");
        if (!subjectAttr) {
          setLoading(false);
          return;
        }

        // Fetch subjects for this class
        const subjectsRes = await fetch(`http://localhost:5000/api/values/${subjectAttr._id}`);
        const subjectsData = await subjectsRes.json();
        
        // Filter subjects by class
        const classIdStr = normalizeId(classId);
        const filteredSubjects = subjectsData.filter(s => {
          const sClassId = normalizeId(s.classId);
          return sClassId === classIdStr && s.status === 'Active';
        });
        
        setSubjects(filteredSubjects);

        // Fetch questions to check which subjects have question papers
        const questionsRes = await fetch("http://localhost:5000/api/questions");
        const questions = await questionsRes.json();

        // Create a map of subjectId -> hasQuestions
        const subjectQuestionMap = {};
        questions.forEach(q => {
          const qClassId = normalizeId(q.classId);
          const qSubjectId = normalizeId(q.subjectId);
          
          // Only count questions that match student's class
          if (qClassId === classIdStr) {
            if (!subjectQuestionMap[qSubjectId]) {
              subjectQuestionMap[qSubjectId] = 0;
            }
            subjectQuestionMap[qSubjectId]++;
          }
        });

        setSubjectsWithQuestions(subjectQuestionMap);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
      setLoading(false);
    };

    fetchData();
  }, [classId]);

  // Fetch test papers when subject or difficulty changes
  useEffect(() => {
    if (!selectedTestSubject && !selectedDifficulty) {
      setTestPapers([]);
      return;
    }

    const fetchTestPapers = async () => {
      setLoadingPapers(true);
      try {
        // Fetch saved question papers
        const papersRes = await fetch("http://localhost:5000/api/question-papers");
        const papers = await papersRes.json();

        // Fetch permits to check which papers are available
        const permitsRes = await fetch("http://localhost:5000/api/question-paper-permits");
        const permits = await permitsRes.json();
        
        const now = new Date();
        
        // Filter papers based on:
        // 1. Student's class
        // 2. Selected subject (if any)
        // 3. Selected difficulty (if any)
        // 4. Has an active permit (current date is within permit range)
        const classIdStr = normalizeId(classId);
        
        const filteredPapers = papers.filter(paper => {
          // Check class match
          const paperClassId = normalizeId(paper.classId);
          if (paperClassId !== classIdStr) return false;
          
          // Check subject match
          if (selectedTestSubject) {
            const paperSubjectId = normalizeId(paper.subjectId);
            if (paperSubjectId !== selectedTestSubject) return false;
          }
          
          // Check difficulty match
          if (selectedDifficulty) {
            if (paper.difficulty !== selectedDifficulty) return false;
          }
          
          // Check if there's an active permit
          const paperPermit = permits.find(permit => 
            normalizeId(permit.questionPaperId) === normalizeId(paper._id) &&
            new Date(permit.startDate) <= now &&
            new Date(permit.endDate) >= now
          );
          
          return paperPermit !== undefined;
        });

        setTestPapers(filteredPapers);
      } catch (err) {
        console.error("Error fetching test papers:", err);
      }
      setLoadingPapers(false);
    };

    fetchTestPapers();
  }, [selectedTestSubject, selectedDifficulty, classId]);

  // Handle profile input changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMessage('');
    
    try {
      const response = await fetch(`http://localhost:5000/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileData.name,
          rollNumber: profileData.rollNumber,
          dateOfBirth: profileData.dateOfBirth
        })
      });

      if (response.ok) {
        setSaveMessage('Profile updated successfully!');
        setIsEditing(false);
        // Update localStorage with new data
        const updatedData = { ...studentData, ...profileData };
        localStorage.setItem('qms_studentData', JSON.stringify(updatedData));
        localStorage.setItem('qms_studentName', profileData.name);
        // Reload page to reflect changes
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setSaveMessage('Failed to update profile. Please try again.');
      }
    } catch (err) {
      setSaveMessage('Error connecting to server.');
    }
    
    setSaving(false);
  };

  // Handle navbar clicks
  const handleNavClick = (tab) => {
    if (tab === 'profile') {
      setShowProfile(true);
    }
    setActiveTab(tab);
  };

  // Download paper as PDF
  const downloadPaperAsPDF = () => {
    const printContent = document.getElementById('student-paper-print-content');
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download the PDF');
      return;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${selectedPaper.subject} - Question Paper</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 40px; 
            font-size: 14px;
            line-height: 1.6;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .header h1 { 
            font-size: 24px; 
            margin-bottom: 10px; 
            color: #1a237e;
          }
          .info { 
            display: flex; 
            justify-content: space-between; 
            flex-wrap: wrap;
            margin-bottom: 20px;
            font-size: 13px;
          }
          .question { 
            margin-bottom: 20px; 
            page-break-inside: avoid;
          }
          .question-text { font-weight: 500; }
          .question-marks { 
            font-weight: 600; 
            color: #1976d2;
          }
          .options { margin-left: 20px; margin-top: 8px; }
          .option { margin: 4px 0; }
          @media print {
            body { padding: 20px; }
            .question { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Render My Test tab content
  const renderMyTestTab = () => {
    return (
      <div style={{ padding: '20px' }}>
        <h2 style={{ marginBottom: 24, color: '#333' }}>My Test - Available Question Papers</h2>
        
        {/* Filters */}
        <div style={{ 
          background: '#fff', 
          borderRadius: 12, 
          padding: 24, 
          marginBottom: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, color: '#333' }}>Select Filters</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Subject</label>
              <select
                value={selectedTestSubject}
                onChange={(e) => setSelectedTestSubject(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #bfc8e0', fontSize: '1em' }}
              >
                <option value="">All Subjects</option>
                {subjects.map(sub => (
                  <option key={sub._id} value={sub._id}>{sub.valueName}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Difficulty Level</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #bfc8e0', fontSize: '1em' }}
              >
                <option value="">All Levels</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>

        {/* Available Papers */}
        <div style={{ 
          background: '#fff', 
          borderRadius: 12, 
          padding: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, color: '#333' }}>Available Question Papers</h3>
          
          {loadingPapers ? (
            <p style={{ textAlign: 'center', padding: 20 }}>Loading papers...</p>
          ) : testPapers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
              <p style={{ fontSize: '1.1em' }}>
                {(!selectedTestSubject && !selectedDifficulty) 
                  ? "Select a subject and difficulty level to view available question papers."
                  : "No question papers available for the selected filters."}
              </p>
              <p style={{ marginTop: 8 }}>Contact your teacher if you believe there should be papers available.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {testPapers.map(paper => (
                <div 
                  key={paper._id}
                  style={{ 
                    border: '1px solid #e0e0e0', 
                    borderRadius: 8, 
                    padding: 16,
                    background: '#f9f9f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', color: '#1976d2' }}>
                      {paper.subject} - {paper.class}
                    </h4>
                    <p style={{ margin: '4px 0', fontSize: '0.9em' }}>
                      <strong>Difficulty:</strong> {paper.difficulty} |
                      <strong> Questions:</strong> {paper.totalQuestions} |
                      <strong> Marks:</strong> {paper.totalMarks}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      className="cta-button"
                      onClick={() => {
                        setSelectedPaper(paper);
                        setShowPaperPreview(true);
                      }}
                      style={{ padding: '8px 16px', fontSize: '0.9em' }}
                    >
                      View Paper
                    </button>
                    <button 
                      className="cta-button"
                      style={{ padding: '8px 16px', fontSize: '0.9em', background: '#4caf50' }}
                    >
                      Start Test
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render Home tab content
  const renderHomeTab = () => {
    return (
      <div className="dashboard-welcome-content">
        <br />
        <h1>Welcome, {name}! Ready to start your quiz?</h1>
        <p>This is your dashboard. Here you can access quizzes, test papers, and your results.</p>
        <button className="cta-button" onClick={() => setActiveTab('mytest')}>Start Quiz</button>
        
        <div className="dashboard-row" >
          <div className="dashboard-main-panel">
            {/* Main (wider) left container content - Subjects with question status */}
            <h3 style={{marginBottom: 20}}>Available Subjects</h3>
            {loading ? (
              <p>Loading subjects...</p>
            ) : subjects.length === 0 ? (
              <p>No subjects available for your class.</p>
            ) : (
              <div style={{ display: 'grid', gap: 12, maxHeight: '420px', overflowY: 'auto', scrollbarWidth: 'thin' }}>
                {subjects.map(subject => {
                  const subId = normalizeId(subject._id);
                  const hasQuestions = subjectsWithQuestions[subId] && subjectsWithQuestions[subId] > 0;
                  return (
                    <div key={subject._id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '12px 16px', 
                      backgroundColor: hasQuestions ? '#e8f5e9' : '#f8f9fa', 
                      borderRadius: 8,
                      border: `1px solid ${hasQuestions ? '#4caf50' : '#e0e0e0'}`
                    }}>
                      <span style={{ fontWeight: 600, color: '#333' }}>
                        {subject.valueName}
                      </span>
                      <span style={{ 
                        padding: '4px 12px',
                        borderRadius: 12,
                        fontSize: '0.85em',
                        fontWeight: 600,
                        backgroundColor: hasQuestions ? '#4caf50' : '#e0e0e0',
                        color: hasQuestions ? '#fff' : '#666'
                      }}>
                        {hasQuestions ? '✓ Available' : 'Coming Soon'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="dashboard-side-panel">
            {/* Right (narrower) side container content - Student Profile */}
            <div className='profile-container' style={{background:'#f7f7f8', padding:'20px', marginBottom: 20, borderRadius: 5}}>
            <h3>Student Profile</h3>
            {studentData && Object.keys(studentData).length > 0 ? (
              <div style={{ textAlign: 'left', padding: '10px',fontSize:'13px' }}>
                <p><strong>Name:</strong> {name}</p>
                {rollNumber && <p><strong>Roll Number:</strong> {rollNumber}</p>}
                {dateOfBirth && <p><strong>Date of Birth:</strong> {dateOfBirth}</p>}
                {className && <p><strong>Class:</strong> {className}</p>}
                {boardName && <p><strong>Board:</strong> {boardName}</p>}
              </div>
            ) : (
              <p>No profile data available.</p>
            )}
            </div>
            
            {/* TestCard Section */}
            <div className='testcard-container' style={{
              background: '#f7f7f8',
              padding: '20px',
              borderRadius: 5
            }}>
              <h3>TestCard</h3>
              {/* Calculate counts based on subjects with actual questions */}
              {(() => {
                const availableSubjects = subjects.filter(s => {
                  const subId = normalizeId(s._id);
                  return subjectsWithQuestions[subId] && subjectsWithQuestions[subId] > 0;
                }).length;
                const completeCount = 0;
                const incompleteCount = availableSubjects - completeCount;
                
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 15 }}>
                    <div style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px', 
                      backgroundColor: '#e3f2fd', 
                      borderRadius: 8,
                      borderLeft: '4px solid #2196f3'
                    }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#1565c0' }}>Available</span>
                      <span style={{ fontSize: 20, fontWeight: 700, color: '#1976d2' }}>{availableSubjects}</span>
                    </div>
                    <div style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px', 
                      backgroundColor: '#e8f5e9', 
                      borderRadius: 8,
                      borderLeft: '4px solid #4caf50'
                    }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#1b5e20' }}>Complete</span>
                      <span style={{ fontSize: 20, fontWeight: 700, color: '#2e7d32' }}>{completeCount}</span>
                    </div>
                    <div style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px', 
                      backgroundColor: '#fff3e0', 
                      borderRadius: 8,
                      borderLeft: '4px solid #ff9800'
                    }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#bf360c' }}>Incomplete</span>
                      <span style={{ fontSize: 20, fontWeight: 700, color: '#e65100' }}>{incompleteCount}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    );
  };

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
          <li 
            className="navbar-menu-item" 
            style={{ cursor: 'pointer', fontWeight: activeTab === 'home' ? 700 : 400 }}
            onClick={() => handleNavClick('home')}
          >
            Home
          </li>
          <li 
            className="navbar-menu-item" 
            style={{ cursor: 'pointer', fontWeight: activeTab === 'mytest' ? 700 : 400 }}
            onClick={() => handleNavClick('mytest')}
          >
            My Test
          </li>
          <li 
            className="navbar-menu-item" 
            style={{ cursor: 'pointer', fontWeight: activeTab === 'results' ? 700 : 400 }}
            onClick={() => handleNavClick('results')}
          >
            Results
          </li>
          <li 
            className="navbar-menu-item" 
            style={{ cursor: 'pointer', fontWeight: activeTab === 'profile' ? 700 : 400 }}
            onClick={() => handleNavClick('profile')}
          >
            Profile
          </li>
          <li className="navbar-menu-item" style={{ cursor: 'pointer', color: '#ffd6d6' }} onClick={onLogout}>Logout</li>
        </ul>
      </nav>
      
      {/* Profile Modal */}
      {showProfile && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '90%', maxWidth: 500,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: '#333' }}>My Profile</h2>
              <button onClick={() => { setShowProfile(false); setIsEditing(false); }} style={{
                background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#666'
              }}>×</button>
            </div>
            
            <div style={{ display: 'grid', gap: 16 }}>
              {/* Name */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#444' }}>Name</label>
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #ddd',
                    fontSize: 14, backgroundColor: isEditing ? '#fff' : '#f5f5f5'
                  }}
                />
              </div>
              
              {/* Roll Number */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#444' }}>Roll Number</label>
                <input
                  type="text"
                  name="rollNumber"
                  value={profileData.rollNumber}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #ddd',
                    fontSize: 14, backgroundColor: isEditing ? '#fff' : '#f5f5f5'
                  }}
                />
              </div>
              
              {/* Date of Birth */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#444' }}>Date of Birth</label>
                <input
                  type="text"
                  name="dateOfBirth"
                  value={profileData.dateOfBirth}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  placeholder="DD-MM-YYYY"
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #ddd',
                    fontSize: 14, backgroundColor: isEditing ? '#fff' : '#f5f5f5'
                  }}
                />
              </div>
              
              {/* Class (read-only) */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#444' }}>Class</label>
                <input
                  type="text"
                  value={profileData.className}
                  disabled
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #ddd',
                    fontSize: 14, backgroundColor: '#f5f5f5', color: '#666'
                  }}
                />
              </div>
              
              {/* Board (read-only) */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#444' }}>Board</label>
                <input
                  type="text"
                  value={profileData.boardName}
                  disabled
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #ddd',
                    fontSize: 14, backgroundColor: '#f5f5f5', color: '#666'
                  }}
                />
              </div>
              
              {/* Status Message */}
              {saveMessage && (
                <div style={{
                  padding: '10px', borderRadius: 6, textAlign: 'center',
                  backgroundColor: saveMessage.includes('success') ? '#e8f5e9' : '#ffebee',
                  color: saveMessage.includes('success') ? '#2e7d32' : '#c62828'
                }}>
                  {saveMessage}
                </div>
              )}
              
              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      style={{
                        flex: 1, padding: '12px', borderRadius: 6, border: 'none',
                        backgroundColor: '#4caf50', color: '#fff', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.7 : 1
                      }}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => { setIsEditing(false); setProfileData({
                        name: studentData?.name || '',
                        rollNumber: studentData?.rollNumber || '',
                        dateOfBirth: studentData?.dateOfBirth || '',
                        className: className,
                        boardName: boardName
                      });}}
                      style={{
                        flex: 1, padding: '12px', borderRadius: 6, border: '1px solid #ddd',
                        backgroundColor: '#fff', color: '#666', fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{
                      width: '100%', padding: '12px', borderRadius: 6, border: 'none',
                      backgroundColor: '#667eea', color: '#fff', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="dashboard-content">
        {/* Render content based on active tab */}
        {activeTab === 'home' && renderHomeTab()}
        {activeTab === 'mytest' && renderMyTestTab()}
        {activeTab === 'results' && (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Results</h2>
            <p>Your test results will appear here.</p>
          </div>
        )}
      </div>

      {/* Paper Preview Modal */}
      {showPaperPreview && selectedPaper && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '90%', maxWidth: 700, maxHeight: '80vh',
            overflow: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: '#333' }}>Question Paper Preview</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button 
                  onClick={downloadPaperAsPDF}
                  style={{
                    background: '#4caf50',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    padding: '6px 12px',
                    fontSize: '0.85em',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  ⬇ Download PDF
                </button>
                <button onClick={() => { setShowPaperPreview(false); setSelectedPaper(null); }} style={{
                  background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#666'
                }}>×</button>
              </div>
            </div>
            
            <div id="student-paper-print-content">
              <div style={{ marginBottom: 16, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
                <p style={{ margin: '4px 0' }}><strong>Board:</strong> {selectedPaper.board}</p>
                <p style={{ margin: '4px 0' }}><strong>Class:</strong> {selectedPaper.class}</p>
                <p style={{ margin: '4px 0' }}><strong>Subject:</strong> {selectedPaper.subject}</p>
                <p style={{ margin: '4px 0' }}><strong>Difficulty:</strong> {selectedPaper.difficulty}</p>
                <p style={{ margin: '4px 0' }}><strong>Total Questions:</strong> {selectedPaper.questions?.length || selectedPaper.totalQuestions}</p>
                <p style={{ margin: '4px 0' }}><strong>Total Marks:</strong> {selectedPaper.totalMarks}</p>
              </div>
              
              <h4 style={{ marginTop: 0 }}>Questions:</h4>
              {(selectedPaper.questions || []).map((q, index) => (
                <div key={index} style={{ marginBottom: 12, padding: 12, border: '1px solid #eee', borderRadius: 6 }}>
                  <p style={{ margin: '0 0 8px 0' }}>
                    <strong>Q{index + 1}.</strong> {q.text} 
                    <span style={{ float: 'right', fontWeight: 600, color: '#1976d2' }}>[{q.marks} mark{q.marks > 1 ? 's' : ''}]</span>
                  </p>
                  {q.options && q.options.map((opt, optIndex) => (
                    <p key={optIndex} style={{ margin: '4px 0', paddingLeft: 16, fontSize: '0.9em' }}>
                      {String.fromCharCode(65 + optIndex)}. {opt}
                    </p>
                  ))}
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowPaperPreview(false); setSelectedPaper(null); }}
                style={{
                  padding: '12px 24px', borderRadius: 6, border: '1px solid #ddd',
                  backgroundColor: '#fff', color: '#666', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                style={{
                  padding: '12px 24px', borderRadius: 6, border: 'none',
                  backgroundColor: '#1976d2', color: '#fff', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Start Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;
