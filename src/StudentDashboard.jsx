import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { showToast } from './Toast';

function StudentDashboard({ name, studentData, onProjectTitleClick, onLogout }) {
  const rollNumber = studentData?.rollNumber || '';
  const dateOfBirth = studentData?.dateOfBirth || '';
  const className = studentData?.className || studentData?.classId?.valueName || '';
  const boardName = studentData?.boardName || studentData?.boardId?.valueName || '';
  const classId = studentData?.classId || '';
  const studentId = studentData?._id || '';

  const [activeTab, setActiveTab] = useState('home');
  const [subjects, setSubjects] = useState([]);
  const [subjectsWithQuestions, setSubjectsWithQuestions] = useState({});
  const [loading, setLoading] = useState(true);
  const [availableCount, setAvailableCount] = useState(0);
  const [incompleteCount, setIncompleteCount] = useState(0);

  const [selectedTestSubject, setSelectedTestSubject] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [testPapers, setTestPapers] = useState([]);
  const [loadingPapers, setLoadingPapers] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [showPaperPreview, setShowPaperPreview] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRecord, setReviewRecord] = useState(null);

  const [testRecords, setTestRecords] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);

  const [activeTest, setActiveTest] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [textAnswers, setTextAnswers] = useState({});
  const [numericAnswers, setNumericAnswers] = useState({});
  const [testTimeLeft, setTestTimeLeft] = useState(0);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testSubmitting, setTestSubmitting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showTestStartReminder, setShowTestStartReminder] = useState(false);

  useEffect(() => {
    if (!activeTest || testTimeLeft <= 0 || testSubmitted) return;
    const timer = setInterval(() => {
      setTestTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTest, testTimeLeft, testSubmitted]);

  useEffect(() => {
    if (activeTest && !testSubmitted) {
      const enterFullscreen = async () => {
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          } else if (document.documentElement.webkitRequestFullscreen) {
            await document.documentElement.webkitRequestFullscreen();
          } else if (document.documentElement.msRequestFullscreen) {
            await document.documentElement.msRequestFullscreen();
          }
        } catch (err) {
          console.log('Fullscreen request failed:', err);
        }
      };
      enterFullscreen();
    }
  }, [activeTest, testSubmitted]);

  useEffect(() => {
    if (!activeTest && document.fullscreenElement) {
      const exitFullscreen = async () => {
        try {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
            await document.webkitExitFullscreen();
          }
        } catch (err) {
          console.log('Exit fullscreen failed:', err);
        }
      };
      exitFullscreen();
    }
  }, [activeTest]);

  useEffect(() => {
    if (!activeTest || testSubmitted) return;
    const handleKeyDown = (e) => {
      const blockedKeys = [
        { key: 'Tab', alt: true },
        { key: 'F4', alt: true },
        { key: 'W', alt: true },
        { key: 'Escape', alt: false },
        { key: 'w', ctrl: true },
        { key: 'W', ctrl: true },
        { key: 'Tab', ctrl: true },
        { key: 'N', ctrl: true },
        { key: 't', ctrl: true },
        { key: 'T', ctrl: true },
        { key: 'F4', ctrl: true },
        { key: 'q', ctrl: true },
        { key: 'Q', ctrl: true },
        { key: 'F5' },
        { key: 'F11' },
        { key: 'Escape' },
      ];
      const isBlocked = blockedKeys.some(block => {
        if (block.alt && e.altKey && e.key.toLowerCase() === block.key.toLowerCase()) return true;
        if (block.ctrl && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === block.key.toLowerCase()) return true;
        if (!block.alt && !block.ctrl && e.key === block.key) return true;
        return false;
      });
      if (isBlocked) {
        e.preventDefault();
        e.stopPropagation();
        if (e.key === 'Escape') {
          showToast('Please complete the test before leaving. If you close the browser, your progress will be lost.', 'warning');
        } else if (e.key === 'F5') {
          showToast('Refresh is disabled during the test. Your progress will be lost.', 'warning');
        }
        return false;
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [activeTest, testSubmitted]);

  useEffect(() => {
    if (!activeTest || testSubmitted) return;
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };
    window.addEventListener('contextmenu', handleContextMenu);
    return () => window.removeEventListener('contextmenu', handleContextMenu);
  }, [activeTest, testSubmitted]);

  useEffect(() => {
    if (!activeTest || testSubmitted) return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'You have an active test in progress. Are you sure you want to leave?';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeTest, testSubmitted]);

  const startTest = async (paper) => {
    
    try {
      const permitsRes = await fetch("http://localhost:5000/api/question-paper-permits");
      const permits = await permitsRes.json();
      const now = new Date();
      const paperPermit = permits.find(permit => {
        const permitPaperId = permit.questionPaperId && permit.questionPaperId._id 
          ? normalizeId(permit.questionPaperId._id) 
          : normalizeId(permit.questionPaperId);
        const paperId = normalizeId(paper._id);
        return permitPaperId === paperId &&
          new Date(permit.startDate) <= now &&
          new Date(permit.endDate) >= now;
      });

      if (!paperPermit) {
        showToast('No active permit found for this paper', 'error');
        return;
      }

      const checkRes = await fetch(`http://localhost:5000/api/test-records/check/${studentId}/${paper._id}`);
      const checkData = await checkRes.json();
      
      if (checkData.hasAttempted) {
        
      }

      const timeLimit = paperPermit.timeLimit || 60;
      setTestTimeLeft(timeLimit * 60);
      setActiveTest({
        paper: paper,
        permit: paperPermit,
        startTime: new Date()
      });
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setTextAnswers({});
      setNumericAnswers({});
      setTestSubmitted(false);
      setTestResult(null);
      setShowPaperPreview(false);
      setShowTestStartReminder(true);
    } catch (err) {
      console.error('Error starting test:', err);
      showToast('Error starting test. Please try again.', 'error');
    }
  };

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  const handleTextAnswerChange = (questionIndex, text) => {
    setTextAnswers(prev => ({
      ...prev,
      [questionIndex]: text
    }));
  };

  const handleNumericAnswerChange = (questionIndex, value) => {
    setNumericAnswers(prev => ({
      ...prev,
      [questionIndex]: value
    }));
  };

  const handleSubmitTest = async () => {
    if (!activeTest) return;
    setTestSubmitting(true);
    try {
      const questions = activeTest.paper.questions || [];
      let score = 0;
      let correctAnswers = 0;
      const answers = [];

      questions.forEach((question, index) => {
        const selectedOptionIndex = selectedAnswers[index];
        const correctAnswer = question.answer;
        let correctAnswerIndex = -1;
        if (typeof correctAnswer === 'number') {
          correctAnswerIndex = correctAnswer;
        } else if (typeof correctAnswer === 'string') {
          const answerChar = correctAnswer.toUpperCase();
          correctAnswerIndex = answerChar.charCodeAt(0) - 65;
        }
        const isCorrect = selectedOptionIndex === correctAnswerIndex;
        if (isCorrect) {
          score += question.marks || 1;
          correctAnswers++;
        }
        answers.push({
          questionText: question.text,
          options: question.options || [],
          selectedAnswer: selectedOptionIndex,
          correctAnswer: correctAnswerIndex,
          isCorrect: isCorrect,
          marks: question.marks || 1
        });
      });

      const result = {
        score,
        correctAnswers,
        totalQuestions: questions.length,
        answers,
        submittedAt: new Date()
      };

      const response = await fetch('http://localhost:5000/api/test-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: studentId,
          questionPaperId: activeTest.paper._id,
          score: score,
          totalQuestions: questions.length,
          correctAnswers: correctAnswers,
          subjectName: activeTest.paper.subject,
          questionResults: answers
        })
      });

      if (response.ok) {
        setTestResult(result);
        setTestSubmitted(true);
        const recordsRes = await fetch(`http://localhost:5000/api/test-records/${studentId}`);
        if (recordsRes.ok) {
          const recordsData = await recordsRes.json();
          setTestRecords(recordsData);
        }
      } else {
        showToast('Failed to save test results. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Error submitting test:', err);
      showToast('Error submitting test. Please try again.', 'error');
    }
    setTestSubmitting(false);
  };

  const closeTest = () => {
    setActiveTest(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setTestTimeLeft(0);
    setTestSubmitted(false);
    setTestResult(null);
  };

  const formatTimeLeft = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  const normalizeId = (id) => {
    if (!id) return "";
    if (typeof id === 'string') return id;
    if (id.$oid) return id.$oid;
    return String(id);
  };

  useEffect(() => {
    if (!classId) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        const attrsRes = await fetch("http://localhost:5000/api/attributes");
        const attrs = await attrsRes.json();
        const subjectAttr = attrs.find(a => a.name && a.name.toLowerCase() === "subject");
        if (!subjectAttr) {
          setLoading(false);
          return;
        }
        const subjectsRes = await fetch(`http://localhost:5000/api/values/${subjectAttr._id}`);
        const subjectsData = await subjectsRes.json();
        const classIdStr = normalizeId(classId);
        const filteredSubjects = subjectsData.filter(s => {
          const sClassId = normalizeId(s.classId);
          return sClassId === classIdStr && s.status === 'Active';
        });
        setSubjects(filteredSubjects);

        const questionsRes = await fetch("http://localhost:5000/api/questions");
        const questions = await questionsRes.json();
        const subjectQuestionMap = {};
        questions.forEach(q => {
          const qClassId = normalizeId(q.classId);
          const qSubjectId = normalizeId(q.subjectId);
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

  useEffect(() => {
    if (activeTab === 'mytest' && studentId) {
      const fetchRecords = async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/test-records/${studentId}`);
          if (response.ok) {
            const data = await response.json();
            setTestRecords(data);
          }
        } catch (err) {
          console.error("Error fetching test records:", err);
        }
      };
      fetchRecords();
    }
    if (!selectedTestSubject && !selectedDifficulty) {
      setTestPapers([]);
      return;
    }
    const fetchTestPapers = async () => {
      setLoadingPapers(true);
      try {
        const papersRes = await fetch("http://localhost:5000/api/question-papers");
        const papers = await papersRes.json();
        const permitsRes = await fetch("http://localhost:5000/api/question-paper-permits");
        const permits = await permitsRes.json();
        const now = new Date();
        const classIdStr = normalizeId(classId);
        const filteredPapers = papers.filter(paper => {
          const paperClassId = normalizeId(paper.classId);
          if (paperClassId !== classIdStr) return false;
          if (selectedTestSubject) {
            const paperSubjectId = normalizeId(paper.subjectId);
            if (paperSubjectId !== selectedTestSubject) return false;
          }
          if (selectedDifficulty) {
            if (paper.difficulty !== selectedDifficulty) return false;
          }
          const paperPermit = permits.find(permit => {
            const permitPaperId = permit.questionPaperId && permit.questionPaperId._id 
              ? normalizeId(permit.questionPaperId._id) 
              : normalizeId(permit.questionPaperId);
            const paperId = normalizeId(paper._id);
            return permitPaperId === paperId &&
              new Date(permit.startDate) <= now &&
              new Date(permit.endDate) >= now;
          });
          return paperPermit !== undefined;
        });
        setTestPapers(filteredPapers);
      } catch (err) {
        console.error("Error fetching test papers:", err);
      }
      setLoadingPapers(false);
    };
    fetchTestPapers();
  }, [selectedTestSubject, selectedDifficulty, classId, activeTab, studentId]);

  useEffect(() => {
    if (activeTab !== 'results' || !studentId) {
      return;
    }
    const fetchTestRecords = async () => {
      setLoadingResults(true);
      try {
        const response = await fetch(`http://localhost:5000/api/test-records/${studentId}`);
        if (response.ok) {
          const data = await response.json();
          setTestRecords(data);
        }
      } catch (err) {
        console.error("Error fetching test records:", err);
      }
      setLoadingResults(false);
    };
    fetchTestRecords();
  }, [activeTab, studentId]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

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
        const updatedData = { ...studentData, ...profileData };
        localStorage.setItem('qms_studentData', JSON.stringify(updatedData));
        localStorage.setItem('qms_studentName', profileData.name);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setSaveMessage('Failed to update profile. Please try again.');
      }
    } catch (err) {
      setSaveMessage('Error connecting to server.');
    }
    setSaving(false);
  };

  const handleNavClick = (tab) => {
    if (tab === 'profile') {
      setShowProfile(true);
    }
    setActiveTab(tab);
  };

  const downloadPaperAsPDF = () => {
    const printContent = document.getElementById('student-paper-print-content');
    if (!printContent) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Please allow popups to download the PDF', 'warning');
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${selectedPaper.subject} - Question Paper</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; font-size: 14px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { font-size: 24px; margin-bottom: 10px; color: #1a237e; }
          .info { display: flex; justify-content: space-between; flex-wrap: wrap; margin-bottom: 20px; font-size: 13px; }
          .question { margin-bottom: 20px; page-break-inside: avoid; }
          .question-text { font-weight: 500; }
          .question-marks { font-weight: 600; color: #1976d2; }
          .options { margin-left: 20px; margin-top: 8px; }
          .option { margin: 4px 0; }
          @media print { body { padding: 20px; } .question { page-break-inside: avoid; } }
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

  const renderMyTestTab = () => {
    return (
      <div style={{ padding: '20px' }}>
        <h2 style={{ marginBottom: 24, color: '#333' }}>My Test</h2>
        {testRecords.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, color: '#333' }}>Your Attempted Tests</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              {testRecords.map((record, index) => (
                <div key={index} style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, background: '#f9f9f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', color: '#1976d2' }}>{record.subjectName || 'Test'}</h4>
                    <p style={{ margin: '4px 0', fontSize: '0.9em', color: '#666' }}>
                      <strong>Date:</strong> {new Date(record.testDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} | 
                      <strong> Questions:</strong> {record.totalQuestions} | <strong> Correct:</strong> {record.correctAnswers}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: record.score >= (record.totalQuestions * 0.7) ? '#4caf50' : record.score >= (record.totalQuestions * 0.5) ? '#ff9800' : '#f44336' }}>
                      {record.score}/{record.totalQuestions}
                    </div>
                    <button className="cta-button" style={{ padding: '6px 12px', fontSize: '0.8em', marginTop: 4 }} onClick={() => { setReviewRecord(record); setShowReviewModal(true); }}>Review</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, color: '#333' }}>Available Question Papers</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Subject</label>
              <select value={selectedTestSubject} onChange={(e) => setSelectedTestSubject(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #bfc8e0', fontSize: '1em' }}>
                <option value="">All Subjects</option>
                {subjects.map(sub => (<option key={sub._id} value={sub._id}>{sub.valueName}</option>))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Difficulty Level</label>
              <select value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #bfc8e0', fontSize: '1em' }}>
                <option value="">All Levels</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, color: '#333' }}>Available Question Papers</h3>
          {loadingPapers ? (<p style={{ textAlign: 'center', padding: 20 }}>Loading papers...</p>) : testPapers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
              <p style={{ fontSize: '1.1em' }}>{(!selectedTestSubject && !selectedDifficulty) ? "Select a subject and difficulty level to view available question papers." : "No question papers available for the selected filters."}</p>
              <p style={{ marginTop: 8 }}>Contact your teacher if you believe there should be papers available.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {testPapers.map(paper => (
                <div key={paper._id} style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, background: '#f9f9f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', color: '#1976d2' }}>{paper.subject} - {paper.class}</h4>
                    <p style={{ margin: '4px 0', fontSize: '0.9em' }}><strong>Difficulty:</strong> {paper.difficulty} | <strong> Questions:</strong> {paper.totalQuestions} | <strong> Marks:</strong> {paper.totalMarks}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="cta-button" onClick={() => { setSelectedPaper(paper); setShowPaperPreview(true); }} style={{ padding: '8px 16px', fontSize: '0.9em' }}>View Paper</button>
                    <button className="cta-button" onClick={() => startTest(paper)} style={{ padding: '8px 16px', fontSize: '0.9em', background: '#4caf50' }}>Start Test</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderHomeTab = () => {
    return (
      <div className="dashboard-welcome-content">
        <br />
        <h1>Welcome, {name}! Ready to start your quiz?</h1>
        <p>This is your dashboard. Here you can access quizzes, test papers, and your results.</p>
        <button className="cta-button" onClick={() => setActiveTab('mytest')}>Start Quiz</button>
        <div className="dashboard-row">
          <div className="dashboard-main-panel">
            <h3 style={{marginBottom: 20}}>Available Subjects</h3>
            {loading ? (<p>Loading subjects...</p>) : subjects.length === 0 ? (<p>No subjects available for your class.</p>) : (
              <div style={{ display: 'grid', gap: 12, maxHeight: '420px', overflowY: 'auto', scrollbarWidth: 'thin' }}>
                {subjects.map(subject => {
                  const subId = normalizeId(subject._id);
                  const hasQuestions = subjectsWithQuestions[subId] && subjectsWithQuestions[subId] > 0;
                  return (
                    <div key={subject._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: hasQuestions ? '#e8f5e9' : '#f8f9fa', borderRadius: 8, border: `1px solid ${hasQuestions ? '#4caf50' : '#e0e0e0'}` }}>
                      <span style={{ fontWeight: 600, color: '#333' }}>{subject.valueName}</span>
                      <span style={{ padding: '4px 12px', borderRadius: 12, fontSize: '0.85em', fontWeight: 600, backgroundColor: hasQuestions ? '#4caf50' : '#e0e0e0', color: hasQuestions ? '#fff' : '#666' }}>
                        {hasQuestions ? '✓ Available' : 'Coming Soon'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="dashboard-side-panel">
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
              ) : (<p>No profile data available.</p>)}
            </div>
            <div className='testcard-container' style={{background: '#f7f7f8', padding: '20px', borderRadius: 5}}>
              <h3>TestCard</h3>
              {(() => {
                const availableSubjects = subjects.filter(s => {
                  const subId = normalizeId(s._id);
                  return subjectsWithQuestions[subId] && subjectsWithQuestions[subId] > 0;
                }).length;
                const completeCount = 0;
                const incompleteCount = availableSubjects - completeCount;
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 15 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#e3f2fd', borderRadius: 8, borderLeft: '4px solid #2196f3' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#1565c0' }}>Available</span>
                      <span style={{ fontSize: 20, fontWeight: 700, color: '#1976d2' }}>{availableSubjects}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#e8f5e9', borderRadius: 8, borderLeft: '4px solid #4caf50' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#1b5e20' }}>Complete</span>
                      <span style={{ fontSize: 20, fontWeight: 700, color: '#2e7d32' }}>{completeCount}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#fff3e0', borderRadius: 8, borderLeft: '4px solid #ff9800' }}>
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
        <div className="navbar-title" style={{ fontWeight: 700, fontSize: '1.25em', marginLeft: 18, color: '#fff', cursor: 'pointer', userSelect: 'none' }} onClick={onProjectTitleClick} title="Go to landing page">
          Questionnaire System
        </div>
        <ul className="navbar-menu" style={{ display: 'flex', listStyle: 'none', marginLeft: 'auto', gap: 28, alignItems: 'center' }}>
          <li className="navbar-menu-item" style={{ cursor: 'pointer', fontWeight: activeTab === 'home' ? 700 : 400 }} onClick={() => handleNavClick('home')}>Home</li>
          <li className="navbar-menu-item" style={{ cursor: 'pointer', fontWeight: activeTab === 'mytest' ? 700 : 400 }} onClick={() => handleNavClick('mytest')}>My Test</li>
          <li className="navbar-menu-item" style={{ cursor: 'pointer', fontWeight: activeTab === 'results' ? 700 : 400 }} onClick={() => handleNavClick('results')}>Results</li>
          <li className="navbar-menu-item" style={{ cursor: 'pointer', fontWeight: activeTab === 'profile' ? 700 : 400 }} onClick={() => handleNavClick('profile')}>Profile</li>
          <li className="navbar-menu-item" style={{ cursor: 'pointer', color: '#ffd6d6' }} onClick={onLogout}>Logout</li>
        </ul>
      </nav>
      
      {showProfile && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '90%', maxWidth: 500, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: '#333' }}>My Profile</h2>
              <button onClick={() => { setShowProfile(false); setIsEditing(false); }} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#666' }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#444' }}>Name</label>
                <input type="text" name="name" value={profileData.name} onChange={handleProfileChange} disabled={!isEditing} style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14, backgroundColor: isEditing ? '#fff' : '#f5f5f5' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#444' }}>Roll Number</label>
                <input type="text" name="rollNumber" value={profileData.rollNumber} onChange={handleProfileChange} disabled={!isEditing} style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14, backgroundColor: isEditing ? '#fff' : '#f5f5f5' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#444' }}>Date of Birth</label>
                <input type="text" name="dateOfBirth" value={profileData.dateOfBirth} onChange={handleProfileChange} disabled={!isEditing} placeholder="DD-MM-YYYY" style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14, backgroundColor: isEditing ? '#fff' : '#f5f5f5' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#444' }}>Class</label>
                <input type="text" value={profileData.className} disabled style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14, backgroundColor: '#f5f5f5', color: '#666' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#444' }}>Board</label>
                <input type="text" value={profileData.boardName} disabled style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14, backgroundColor: '#f5f5f5', color: '#666' }} />
              </div>
              {saveMessage && (
                <div style={{ padding: '10px', borderRadius: 6, textAlign: 'center', backgroundColor: saveMessage.includes('success') ? '#e8f5e9' : '#ffebee', color: saveMessage.includes('success') ? '#2e7d32' : '#c62828' }}>{saveMessage}</div>
              )}
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                {isEditing ? (
                  <>
                    <button onClick={handleSaveProfile} disabled={saving} style={{ flex: 1, padding: '12px', borderRadius: 6, border: 'none', backgroundColor: '#4caf50', color: '#fff', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving...' : 'Save Changes'}</button>
                    <button onClick={() => { setIsEditing(false); setProfileData({ name: studentData?.name || '', rollNumber: studentData?.rollNumber || '', dateOfBirth: studentData?.dateOfBirth || '', className: className, boardName: boardName }); }} style={{ flex: 1, padding: '12px', borderRadius: 6, border: '1px solid #ddd', backgroundColor: '#fff', color: '#666', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  </>
                ) : (
                  <button onClick={() => setIsEditing(true)} style={{ width: '100%', padding: '12px', borderRadius: 6, border: 'none', backgroundColor: '#667eea', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Edit Profile</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="dashboard-content">
        {activeTab === 'home' && renderHomeTab()}
        {activeTab === 'mytest' && renderMyTestTab()}
        {activeTab === 'results' && (
          <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: 24, color: '#333' }}>My Test Results</h2>
            {testRecords.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 12, padding: 20, color: 'white' }}>
                  <div style={{ fontSize: '0.9em', opacity: 0.9 }}>Tests Taken</div>
                  <div style={{ fontSize: '2.5em', fontWeight: 'bold' }}>{testRecords.length}</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)', borderRadius: 12, padding: 20, color: 'white' }}>
                  <div style={{ fontSize: '0.9em', opacity: 0.9 }}>Total Score</div>
                  <div style={{ fontSize: '2.5em', fontWeight: 'bold' }}>{testRecords.reduce((sum, r) => sum + r.score, 0)}</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', borderRadius: 12, padding: 20, color: 'white' }}>
                  <div style={{ fontSize: '0.9em', opacity: 0.9 }}>Average Score</div>
                  <div style={{ fontSize: '2.5em', fontWeight: 'bold' }}>{(testRecords.reduce((sum, r) => sum + r.score, 0) / testRecords.length).toFixed(1)}</div>
                </div>
              </div>
            )}
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginTop: 0, marginBottom: 16, color: '#333' }}>Test History</h3>
              {loadingResults ? (<p style={{ textAlign: 'center', padding: 20 }}>Loading results...</p>) : testRecords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                  <p style={{ fontSize: '1.1em' }}>You haven't attempted any tests yet.</p>
                  <p style={{ marginTop: 8 }}>Go to "My Test" to start a quiz.</p>
                  <button className="cta-button" onClick={() => setActiveTab('mytest')} style={{ marginTop: 16 }}>Start a Test</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                  {testRecords.map((record, index) => (
                    <div key={index} style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, background: '#f9f9f9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ margin: '0 0 8px 0', color: '#1976d2' }}>{record.subjectName || 'Test'}</h4>
                          <p style={{ margin: '4px 0', fontSize: '0.9em', color: '#666' }}>
                            <strong>Date:</strong> {new Date(record.testDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p style={{ margin: '4px 0', fontSize: '0.9em', color: '#666' }}>
                            <strong>Questions:</strong> {record.totalQuestions} | <strong> Correct:</strong> {record.correctAnswers}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '2em', fontWeight: 'bold', color: record.score >= (record.totalQuestions * 0.7) ? '#4caf50' : record.score >= (record.totalQuestions * 0.5) ? '#ff9800' : '#f44336' }}>{record.score}</div>
                          <div style={{ fontSize: '0.85em', color: '#666' }}>out of {record.totalQuestions * 1}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showPaperPreview && selectedPaper && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '90%', maxWidth: 700, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: '#333' }}>Question Paper Preview</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={downloadPaperAsPDF} style={{ background: '#4caf50', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', fontSize: '0.85em', fontWeight: 600, cursor: 'pointer' }}>⬇ Download PDF</button>
                <button onClick={() => { setShowPaperPreview(false); setSelectedPaper(null); }} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#666' }}>×</button>
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
                  <p style={{ margin: '0 0 8px 0' }}><strong>Q{index + 1}.</strong> {q.text} <span style={{ float: 'right', fontWeight: 600, color: '#1976d2' }}>[{q.marks} mark{q.marks > 1 ? 's' : ''}]</span></p>
                  {q.options && q.options.map((opt, optIndex) => (<p key={optIndex} style={{ margin: '4px 0', paddingLeft: 16, fontSize: '0.9em' }}>{String.fromCharCode(65 + optIndex)}. {opt}</p>))}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowPaperPreview(false); setSelectedPaper(null); }} style={{ padding: '12px 24px', borderRadius: 6, border: '1px solid #ddd', backgroundColor: '#fff', color: '#666', fontWeight: 600, cursor: 'pointer' }}>Close</button>
              <button onClick={() => startTest(selectedPaper)} style={{ padding: '12px 24px', borderRadius: 6, border: 'none', backgroundColor: '#1976d2', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Start Test</button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && reviewRecord && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '90%', maxWidth: 800, maxHeight: '85vh', overflow: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: '#333' }}>Test Review</h2>
              <button onClick={() => { setShowReviewModal(false); setReviewRecord(null); }} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#666' }}>×</button>
            </div>
            <div style={{ marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
                <div><p style={{ margin: '0 0 4px 0', fontSize: '0.85em', color: '#666' }}>Subject</p><p style={{ margin: 0, fontWeight: 600, fontSize: '1.1em' }}>{reviewRecord.subjectName || 'Test'}</p></div>
                <div><p style={{ margin: '0 0 4px 0', fontSize: '0.85em', color: '#666' }}>Date</p><p style={{ margin: 0, fontWeight: 600, fontSize: '1.1em' }}>{new Date(reviewRecord.testDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p></div>
                <div><p style={{ margin: '0 0 4px 0', fontSize: '0.85em', color: '#666' }}>Score</p><p style={{ margin: 0, fontWeight: 600, fontSize: '1.1em', color: reviewRecord.score >= (reviewRecord.totalQuestions * 0.7) ? '#4caf50' : reviewRecord.score >= (reviewRecord.totalQuestions * 0.5) ? '#ff9800' : '#f44336' }}>{reviewRecord.score} / {reviewRecord.totalQuestions}</p></div>
                <div><p style={{ margin: '0 0 4px 0', fontSize: '0.85em', color: '#666' }}>Correct Answers</p><p style={{ margin: 0, fontWeight: 600, fontSize: '1.1em' }}>{reviewRecord.correctAnswers} / {reviewRecord.totalQuestions}</p></div>
              </div>
            </div>
            <h3 style={{ marginTop: 0, marginBottom: 16, color: '#333' }}>Question Review</h3>
            {reviewRecord.answers && reviewRecord.answers.length > 0 ? (
              <div style={{ display: 'grid', gap: 16 }}>
                {reviewRecord.answers.map((answer, index) => (
                  <div key={index} style={{ padding: 16, borderRadius: 8, border: `2px solid ${answer.isCorrect ? '#4caf50' : '#f44336'}`, backgroundColor: answer.isCorrect ? '#f1f8e9' : '#ffebee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '1.1em' }}><strong>Q{index + 1}.</strong> {answer.questionText}</p>
                      <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: '0.8em', fontWeight: 600, backgroundColor: answer.isCorrect ? '#4caf50' : '#f44336', color: '#fff' }}>{answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}</span>
                    </div>
                    {answer.options && answer.options.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        {answer.options.map((opt, optIndex) => {
                          const isSelected = answer.selectedAnswer === optIndex;
                          const isCorrect = answer.correctAnswer === optIndex;
                          let backgroundColor = 'transparent';
                          let borderColor = '#ddd';
                          let fontWeight = 400;
                          if (isCorrect) { backgroundColor = '#c8e6c9'; borderColor = '#4caf50'; fontWeight = 600; }
                          else if (isSelected && !isCorrect) { backgroundColor = '#ffcdd2'; borderColor = '#f44336'; fontWeight = 600; }
                          return (
                            <div key={optIndex} style={{ padding: '10px 12px', margin: '4px 0', borderRadius: 6, border: `2px solid ${borderColor}`, backgroundColor: backgroundColor, fontWeight }}>
                              {String.fromCharCode(65 + optIndex)}. {opt}
                              {isSelected && <span style={{ marginLeft: 8, fontWeight: 600 }}> (Your Answer)</span>}
                              {isCorrect && !isSelected && <span style={{ marginLeft: 8, fontWeight: 600, color: '#2e7d32' }}>(Correct Answer)</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {!answer.isCorrect && answer.correctAnswer !== undefined && (<p style={{ margin: '12px 0 0 0', fontSize: '0.9em', color: '#2e7d32' }}><strong>Correct Answer:</strong> {String.fromCharCode(65 + answer.correctAnswer)}</p>)}
                  </div>
                ))}
              </div>
            ) : (<div style={{ textAlign: 'center', padding: 40, color: '#888' }}><p>No detailed answers available for this test.</p></div>)}
            <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowReviewModal(false); setReviewRecord(null); }} style={{ padding: '12px 24px', borderRadius: 6, border: '1px solid #ddd', backgroundColor: '#fff', color: '#666', fontWeight: 600, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {activeTest && !testSubmitted && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#f5f5f5', zIndex: 2000, overflow: 'auto' }}>
          <div style={{ backgroundColor: '#1976d2', color: '#fff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5em' }}>{activeTest.paper.subject}</h2>
              <p style={{ margin: '4px 0 0 0', opacity: 0.9 }}>{activeTest.paper.class} - {activeTest.paper.difficulty}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2em', fontWeight: 'bold', color: testTimeLeft < 60 ? '#ffeb3b' : '#fff' }}>{formatTimeLeft(testTimeLeft)}</div>
              <p style={{ margin: 0, opacity: 0.8 }}>Time Remaining</p>
            </div>
          </div>
          <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: '12px 16px', backgroundColor: '#fff', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <span style={{ fontWeight: 600, color: '#333' }}>Question {currentQuestionIndex + 1} of {activeTest.paper.questions?.length || 0}</span>
              <span style={{ color: '#666' }}>{Object.keys(selectedAnswers).length} answered</span>
            </div>
            {activeTest.paper.questions && activeTest.paper.questions.length > 0 && (() => {
              const currentQuestion = activeTest.paper.questions[currentQuestionIndex];
              const questionType = currentQuestion?.type || 'single';
              return (
                <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: 24 }}>
                  <div style={{ marginBottom: 20 }}>
                    <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 12, backgroundColor: '#e3f2fd', color: '#1976d2', fontSize: '0.85em', fontWeight: 600, marginBottom: 12 }}>{currentQuestion?.marks} mark{currentQuestion?.marks > 1 ? 's' : ''} | {questionType === 'text' ? 'Text Answer' : questionType === 'numeric' ? 'Numeric Answer' : 'Multiple Choice'}</span>
                    <h3 style={{ margin: '12px 0 0 0', fontSize: '1.2em', color: '#333', lineHeight: 1.5 }}>{currentQuestion?.text}</h3>
                  </div>
                  {questionType === 'text' ? (
                    <div style={{ marginTop: 16 }}>
                      <textarea value={textAnswers[currentQuestionIndex] || ''} onChange={(e) => handleTextAnswerChange(currentQuestionIndex, e.target.value)} placeholder="Type your answer here..." rows={4} style={{ width: '100%', padding: '14px 16px', borderRadius: 8, border: '2px solid #e0e0e0', fontSize: '1em', fontFamily: 'inherit', resize: 'vertical', backgroundColor: '#fafafa', color: '#333' }} />
                      <p style={{ marginTop: 8, fontSize: '0.85em', color: '#666' }}>{textAnswers[currentQuestionIndex]?.length > 0 ? '✓ Answer entered' : 'Please enter your answer above'}</p>
                    </div>
                  ) : questionType === 'numeric' ? (
                    <div style={{ marginTop: 16 }}>
                      <input type="number" value={numericAnswers[currentQuestionIndex] || ''} onChange={(e) => handleNumericAnswerChange(currentQuestionIndex, e.target.value)} placeholder="Enter numeric answer" style={{ width: '100%', padding: '14px 16px', borderRadius: 8, border: '2px solid #e0e0e0', fontSize: '1em', backgroundColor: '#fafafa', color: '#333' }} />
                      <p style={{ marginTop: 8, fontSize: '0.85em', color: '#666' }}>{numericAnswers[currentQuestionIndex] !== undefined && numericAnswers[currentQuestionIndex] !== '' ? '✓ Answer entered' : 'Please enter a number'}</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 12 }}>
                      {currentQuestion?.options?.map((option, optIndex) => {
                        const isSelected = selectedAnswers[currentQuestionIndex] === optIndex;
                        return (
                          <div key={optIndex} onClick={() => handleAnswerSelect(currentQuestionIndex, optIndex)} style={{ padding: '16px 20px', borderRadius: 8, border: `2px solid ${isSelected ? '#1976d2' : '#e0e0e0'}`, backgroundColor: isSelected ? '#e3f2fd' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s' }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${isSelected ? '#1976d2' : '#ccc'}`, backgroundColor: isSelected ? '#1976d2' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: '0.9em' }}>{isSelected ? '✓' : String.fromCharCode(65 + optIndex)}</div>
                            <span style={{ fontSize: '1em', color: '#333' }}>{option}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <button onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))} disabled={currentQuestionIndex === 0} style={{ padding: '14px 28px', borderRadius: 8, border: 'none', backgroundColor: currentQuestionIndex === 0 ? '#e0e0e0' : '#667eea', color: currentQuestionIndex === 0 ? '#999' : '#fff', fontWeight: 600, cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer', fontSize: '1em' }}>← Previous</button>
              {currentQuestionIndex < (activeTest.paper.questions?.length || 0) - 1 ? (
                <button onClick={() => setCurrentQuestionIndex(prev => prev + 1)} style={{ padding: '14px 28px', borderRadius: 8, border: 'none', backgroundColor: '#4caf50', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '1em' }}>Next →</button>
              ) : (
                <button onClick={handleSubmitTest} disabled={testSubmitting} style={{ padding: '14px 28px', borderRadius: 8, border: 'none', backgroundColor: testSubmitting ? '#e0e0e0' : '#f44336', color: testSubmitting ? '#999' : '#fff', fontWeight: 600, cursor: testSubmitting ? 'not-allowed' : 'pointer', fontSize: '1em' }}>{testSubmitting ? 'Submitting...' : 'Submit Test'}</button>
              )}
            </div>
            <div style={{ marginTop: 24, padding: 16, backgroundColor: '#fff', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <p style={{ margin: '0 0 12px 0', fontWeight: 600, color: '#333' }}>Jump to Question:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {activeTest.paper.questions?.map((_, idx) => (
                  <button key={idx} onClick={() => setCurrentQuestionIndex(idx)} style={{ width: 40, height: 40, borderRadius: 8, border: `2px solid ${currentQuestionIndex === idx ? '#1976d2' : selectedAnswers[idx] !== undefined ? '#4caf50' : '#e0e0e0'}`, backgroundColor: currentQuestionIndex === idx ? '#1976d2' : selectedAnswers[idx] !== undefined ? '#e8f5e9' : '#fff', color: currentQuestionIndex === idx ? '#fff' : selectedAnswers[idx] !== undefined ? '#2e7d32' : '#666', fontWeight: 600, cursor: 'pointer', fontSize: '0.9em' }}>{idx + 1}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {testSubmitted && testResult && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, width: '90%', maxWidth: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px', backgroundColor: testResult.correctAnswers >= testResult.totalQuestions * 0.7 ? '#4caf50' : testResult.correctAnswers >= testResult.totalQuestions * 0.5 ? '#ff9800' : '#f44336', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '2.5em', color: '#fff' }}>{testResult.correctAnswers >= testResult.totalQuestions * 0.7 ? '🎉' : testResult.correctAnswers >= testResult.totalQuestions * 0.5 ? '👍' : '💪'}</span>
            </div>
            <h2 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '1.8em' }}>Test Completed!</h2>
            <p style={{ margin: '0 0 24px 0', color: '#666', fontSize: '1.1em' }}>{activeTest?.paper?.subject}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
              <div style={{ padding: 16, backgroundColor: '#e3f2fd', borderRadius: 12 }}><div style={{ fontSize: '2em', fontWeight: 'bold', color: '#1976d2' }}>{testResult.score}</div><div style={{ fontSize: '0.85em', color: '#666' }}>Score</div></div>
              <div style={{ padding: 16, backgroundColor: '#e8f5e9', borderRadius: 12 }}><div style={{ fontSize: '2em', fontWeight: 'bold', color: '#4caf50' }}>{testResult.correctAnswers}</div><div style={{ fontSize: '0.85em', color: '#666' }}>Correct</div></div>
              <div style={{ padding: 16, backgroundColor: '#ffebee', borderRadius: 12 }}><div style={{ fontSize: '2em', fontWeight: 'bold', color: '#f44336' }}>{testResult.totalQuestions - testResult.correctAnswers}</div><div style={{ fontSize: '0.85em', color: '#666' }}>Wrong</div></div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={closeTest} style={{ padding: '14px 32px', borderRadius: 8, border: '1px solid #ddd', backgroundColor: '#fff', color: '#666', fontWeight: 600, cursor: 'pointer', fontSize: '1em' }}>Close</button>
              <button onClick={() => { setReviewRecord({ subjectName: activeTest?.paper?.subject, testDate: testResult.submittedAt, score: testResult.score, totalQuestions: testResult.totalQuestions, correctAnswers: testResult.correctAnswers, answers: testResult.answers }); setShowReviewModal(true); closeTest(); }} style={{ padding: '14px 32px', borderRadius: 8, border: 'none', backgroundColor: '#1976d2', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '1em' }}>View Details</button>
            </div>
          </div>
        </div>
      )}

      {showTestStartReminder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, width: '90%', maxWidth: 450, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px', backgroundColor: '#ff9800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '2.5em', color: '#fff' }}>⚠️</span></div>
            <h2 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '1.6em' }}>Important Reminder</h2>
            <div style={{ textAlign: 'left', backgroundColor: '#fff3e0', borderRadius: 12, padding: 20, marginBottom: 24, borderLeft: '4px solid #ff9800' }}>
              <p style={{ margin: '0 0 12px 0', color: '#333', fontSize: '1.05em', fontWeight: 600 }}>Please do NOT exit the test before completing it!</p>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#666', lineHeight: 1.8 }}><li>Your progress will be lost if you exit</li><li>Do not close or refresh the browser</li><li>Complete all questions before submitting</li><li>If you face any issue, stay on the page</li></ul>
            </div>
            <p style={{ margin: '0 0 24px 0', color: '#666', fontSize: '0.95em' }}>Click <strong>"I Understand"</strong> to proceed with the test.</p>
            <button onClick={() => setShowTestStartReminder(false)} style={{ padding: '14px 40px', borderRadius: 8, border: 'none', backgroundColor: '#4caf50', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '1.1em' }}>I Understand</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;



