import React, { useState, useEffect } from "react";
import { API_ENDPOINTS } from './api.js';
import "./App.css";
import { showToast } from "./Toast";

export default function QuestionPapers({ onHomeClick }) {
  const [boards, setBoards] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  
  const [selectedBoard, setSelectedBoard] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [totalMarks, setTotalMarks] = useState(10);
  
  // Questions available for the selected filters
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  
  // Generated question paper
  const [generatedPaper, setGeneratedPaper] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch boards and classes
  useEffect(() => {
    fetch(API_ENDPOINTS.ATTRIBUTES)
      .then(res => res.json())
      .then(attrs => {
        console.log('🔍 QuestionPapers - All attributes:', attrs);
        const boardAttr = attrs.find(a => a.name.toLowerCase() === "board");
        console.log('🔍 QuestionPapers - Board attribute found:', boardAttr);
        if (boardAttr) {
          console.log('🔍 QuestionPapers - Fetching boards for ID:', boardAttr._id);
          fetch(API_ENDPOINTS.VALUES(boardAttr._id))
            .then(res => {
              console.log('🔍 QuestionPapers - Boards API response status:', res.status);
              return res.json();
            })
            .then(data => {
              console.log('🔍 QuestionPapers - Raw boards data:', data);
              const activeBoards = data.filter(v => v.status === 'Active');
              console.log('🔍 QuestionPapers - Active boards after filter:', activeBoards);
              setBoards(activeBoards);
            })
            .catch(err => console.error('❌ QuestionPapers - Failed to fetch boards:', err));
        } else {
          console.warn('⚠️ QuestionPapers - No "board" attribute found in attributes list');
        }
        const classAttr = attrs.find(a => a.name.toLowerCase() === "class");
        if (classAttr) {
          fetch(API_ENDPOINTS.VALUES(classAttr._id))
            .then(res => res.json())
            .then(data => setClasses(data.filter(v => v.status === 'Active')))
            .catch(err => console.error('Failed to fetch classes:', err));
        }
        const subjectAttr = attrs.find(a => a.name.toLowerCase() === "subject");
        if (subjectAttr) {
          fetch(API_ENDPOINTS.VALUES(subjectAttr._id))
            .then(res => res.json())
            .then(data => {
              setAllSubjects(data.filter(v => v.status === 'Active'));
              setSubjects(data.filter(v => v.status === 'Active'));
            })
            .catch(err => console.error('Failed to fetch subjects:', err));
        }
        const topicAttr = attrs.find(a => a.name.toLowerCase() === "topic");
        if (topicAttr) {
          fetch(API_ENDPOINTS.VALUES(topicAttr._id))
            .then(res => res.json())
            .then(data => setTopics(data.filter(v => v.status === 'Active')))
            .catch(err => console.error('Failed to fetch topics:', err));
        }
      })
      .catch(err => {
        console.error('❌ QuestionPapers - Failed to fetch attributes:', err);
        showToast('Failed to load dropdown data. Check console for details.', 'error');
      });
  }, []);

  // Get all classes from database (no filtering)
  const getAllClasses = () => {
    return classes;
  };

  // Filter subjects when class is selected
  useEffect(() => {
    if (!selectedClass) {
      setSubjects(allSubjects);
    } else {
      const filteredSubjects = allSubjects.filter(subject => {
        const subjectClassId = subject.classId;
        if (!subjectClassId) return true;
        
        let subjectClassIdStr;
        if (typeof subjectClassId === 'string') {
          subjectClassIdStr = subjectClassId;
        } else if (subjectClassId && typeof subjectClassId === 'object') {
          subjectClassIdStr = subjectClassId._id ? subjectClassId._id.toString() : null;
        } else {
          subjectClassIdStr = null;
        }
        
        const selectedClassIdStr = selectedClass.toString();
        return subjectClassIdStr === selectedClassIdStr;
      });
      setSubjects(filteredSubjects);
    }
    setSelectedSubject("");
    setAvailableQuestions([]);
    setSelectedQuestions([]);
  }, [selectedClass, allSubjects, classes]);

  // Fetch questions based on filters
  useEffect(() => {
    if (!selectedSubject) {
      setAvailableQuestions([]);
      return;
    }
    
    setLoadingQuestions(true);
    fetch(`https://qms-sjuv.onrender.com/api/questions?subjectId=${selectedSubject}`)
      .then(res => res.json())
      .then(data => {
        setAvailableQuestions(data);
        setLoadingQuestions(false);
      })
      .catch(err => {
        console.error("Error fetching questions:", err);
        setLoadingQuestions(false);
      });
  }, [selectedSubject]);

  // Handle question selection
  const toggleQuestion = (question) => {
    const isSelected = selectedQuestions.some(q => q._id === question._id);
    if (isSelected) {
      setSelectedQuestions(selectedQuestions.filter(q => q._id !== question._id));
    } else {
      setSelectedQuestions([...selectedQuestions, question]);
    }
  };

  // Calculate total marks of selected questions
  const calculateTotalMarks = () => {
    return selectedQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);
  };

  // Generate question paper
  const generatePaper = () => {
    const paper = {
      board: boards.find(b => b._id === selectedBoard)?.valueName || "",
      class: classes.find(c => c._id === selectedClass)?.valueName || "",
      subject: subjects.find(s => s._id === selectedSubject)?.valueName || "",
      difficulty: difficulty,
      totalMarks: calculateTotalMarks(),
      questions: selectedQuestions,
      createdAt: new Date().toISOString()
    };
    setGeneratedPaper(paper);
    setShowPreview(true);
  };

  // Group questions by marks
  const questionsByMarks = {};
  availableQuestions.forEach(q => {
    const marks = q.marks || 1;
    if (!questionsByMarks[marks]) {
      questionsByMarks[marks] = [];
    }
    questionsByMarks[marks].push(q);
  });

  const marksOptions = Object.keys(questionsByMarks).map(Number).sort((a, b) => a - b);

  // Get filtered classes
  const filteredClasses = getAllClasses();

  // View mode toggle buttons
  const toggleButtonsStyle = {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px'
  };
  
  const toggleButtonStyle = (isActive) => ({
    padding: '10px 24px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '1em',
    fontWeight: 600,
    cursor: 'pointer',
    background: isActive ? '#1976d2' : '#e0e0e0',
    color: isActive ? '#fff' : '#333'
  });

  // State for managing saved question papers
  const [savedPapers, setSavedPapers] = useState([]);
  const [viewMode, setViewMode] = useState('create'); // 'create', 'manage', or 'permit'
  const [selectedSavedPaper, setSelectedSavedPaper] = useState(null);
  const [loadingSavedPapers, setLoadingSavedPapers] = useState(false);

  // Fetch saved question papers
  const fetchSavedPapers = async () => {
    setLoadingSavedPapers(true);
    try {
      const response = await fetch('https://qms-sjuv.onrender.com/api/question-papers');
      if (response.ok) {
        const data = await response.json();
        setSavedPapers(data);
      }
    } catch (err) {
      console.error('Error fetching saved papers:', err);
    }
    setLoadingSavedPapers(false);
  };

  // Load saved papers when switching to manage or permit mode
  useEffect(() => {
    if (viewMode === 'manage' || viewMode === 'permit') {
      fetchSavedPapers();
    }
  }, [viewMode]);

  // Delete a question paper
  const deletePaper = async (paperId) => {
    if (!window.confirm('Are you sure you want to delete this question paper?')) {
      return;
    }
    
    try {
      const response = await fetch(`https://qms-sjuv.onrender.com/api/question-papers/${paperId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        showToast('Question paper deleted successfully!', 'success');
        fetchSavedPapers();
        setSelectedSavedPaper(null);
      } else {
        const result = await response.json();
        showToast(`Failed to delete: ${result.error || 'Unknown error'}`, 'error');
      }
    } catch (err) {
      console.error('Error deleting paper:', err);
      showToast('Error deleting question paper', 'error');
    }
  };

  // Download question paper as PDF
  const downloadAsPDF = () => {
    const printContent = document.getElementById('question-paper-print-content');
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
        <title>${generatedPaper.subject} - Question Paper</title>
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
          .info-item { margin: 4px 0; }
          .info-item strong { color: #333; }
          .questions { margin-top: 20px; }
          .question { 
            margin-bottom: 20px; 
            page-break-inside: avoid;
          }
          .question-header { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 8px;
          }
          .question-text { font-weight: 500; }
          .question-marks { 
            font-weight: 600; 
            color: #1976d2;
          }
          .options { 
            margin-left: 20px; 
            margin-top: 8px;
          }
          .option { margin: 4px 0; }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
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

  // Save question paper to database
  const saveQuestionPaper = async () => {
    try {
      const paperData = {
        board: generatedPaper.board,
        boardId: selectedBoard,
        class: generatedPaper.class,
        classId: selectedClass,
        subject: generatedPaper.subject,
        subjectId: selectedSubject,
        difficulty: generatedPaper.difficulty,
        totalMarks: generatedPaper.totalMarks,
        totalQuestions: generatedPaper.questions.length,
        questions: generatedPaper.questions,
        createdAt: new Date().toISOString()
      };
      
      console.log('Saving question paper with data:', paperData);
      console.log('Making request to /api/question-papers');
      
      const response = await fetch('https://qms-sjuv.onrender.com/api/question-papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paperData)
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers.get('content-type'));
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        showToast(`Failed to save question paper. Server returned status ${response.status}. Please check if the backend server is running.`, 'error');
        setShowPreview(false);
        return;
      }
      
      const result = await response.json();
      console.log('Save response:', response.status, result);
      
      if (response.ok) {
        showToast('Question paper saved successfully!', 'success');
      } else {
        showToast(`Failed to save question paper: ${result.error || 'Unknown error'}`, 'error');
      }
    } catch (err) {
      console.error('Error saving question paper:', err);
      showToast(`Error saving question paper: ${err.message}. Please check if the backend server is running on port 5000.`, 'error');
    }
    setShowPreview(false);
  };

  // Permit functionality - state
  const [permitPaper, setPermitPaper] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timeLimit, setTimeLimit] = useState(60); // default 60 minutes

  // Save permit settings
  const savePermit = async () => {
    if (!permitPaper) {
      showToast('Please select a question paper to permit', 'warning');
      return;
    }
    if (!startDate || !endDate) {
      showToast('Please select both start and end dates', 'warning');
      return;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      showToast('End date must be after start date', 'warning');
      return;
    }
    if (timeLimit <= 0) {
      showToast('Please enter a valid time limit', 'warning');
      return;
    }

    try {
      const permitData = {
        questionPaperId: permitPaper._id,
        startDate: startDate,
        endDate: endDate,
        timeLimit: timeLimit,
        createdAt: new Date().toISOString()
      };

      console.log('Saving permit with data:', permitData);
      
      const response = await fetch('https://qms-sjuv.onrender.com/api/question-paper-permits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permitData)
      });

      if (response.ok) {
        showToast('Permit saved successfully! Students can now access this question paper during the specified time.', 'success');
        // Reset form
        setPermitPaper(null);
        setStartDate("");
        setEndDate("");
        setTimeLimit(60);
      } else {
        const result = await response.json();
        showToast(`Failed to save permit: ${result.error || 'Unknown error'}`, 'error');
      }
    } catch (err) {
      console.error('Error saving permit:', err);
      showToast(`Error saving permit: ${err.message}`, 'error');
    }
  };

  return (
    <div className="question-papers-page" style={{ position: 'relative', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 24, marginBottom: 24 }}>
        <button
          className="back-button"
          style={{
            background: '#fff',
            color: '#1976d2',
            border: 'none',
            borderRadius: 6,
            padding: '8px 18px',
            fontSize: '1em',
            fontWeight: 700,
            boxShadow: '0 2px 8px rgba(25, 118, 210, 0.08)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
          onClick={onHomeClick}
        >
          <span style={{ fontSize: 20, marginRight: 6 }}>←</span> Back
        </button>
        <h2 style={{ color: '#ffffff', fontWeight: '800', fontSize: '1.8em', margin: 0 }}>Question Papers</h2>
      </div>

      {/* View Mode Toggle */}
      <div style={toggleButtonsStyle}>
        <button
          style={toggleButtonStyle(viewMode === 'create')}
          onClick={() => setViewMode('create')}
        >
          Create New
        </button>
        <button
          style={toggleButtonStyle(viewMode === 'manage')}
          onClick={() => setViewMode('manage')}
        >
          Manage Saved Papers
        </button>
        <button
          style={toggleButtonStyle(viewMode === 'permit')}
          onClick={() => setViewMode('permit')}
        >
          Permit
        </button>
      </div>

      {/* Create New Question Paper View */}
      {viewMode === 'create' && (
        <div>
        <div style={{ 
          background: '#fff', 
          borderRadius: 12, 
          padding: 24, 
          marginBottom: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, color: '#333' }}>Select Parameters</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Board</label>
              <select
                value={selectedBoard}
                onChange={(e) => setSelectedBoard(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #bfc8e0', fontSize: '1em' }}
              >
                <option value="">Select Board</option>
                {boards.map(board => (
                  <option key={board._id} value={board._id}>{board.valueName}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #bfc8e0', fontSize: '1em' }}
              >
                <option value="">Select Class</option>
                {filteredClasses.map(cls => (
                  <option key={cls._id} value={cls._id}>{cls.valueName}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={!selectedClass}
                style={{ 
                  width: '100%', 
                  padding: '10px 12px', 
                  borderRadius: 8, 
                  border: '1.5px solid #bfc8e0', 
                  fontSize: '1em',
                  opacity: !selectedClass ? 0.5 : 1
                }}
              >
                <option value="">{selectedClass ? "Select Subject" : "Select Class First"}</option>
                {subjects.map(sub => (
                  <option key={sub._id} value={sub._id}>{sub.valueName}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Difficulty Level</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #bfc8e0', fontSize: '1em' }}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>

        {selectedSubject && (
          <div style={{ 
            background: '#fff', 
            borderRadius: 12, 
            padding: 24, 
            marginBottom: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ marginTop: 0, color: '#333' }}>Select Questions</h3>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>
                  Selected: {selectedQuestions.length} questions | Total Marks: {calculateTotalMarks()}
                </span>
                <button
                  className="cta-button"
                  onClick={generatePaper}
                  disabled={selectedQuestions.length === 0}
                  style={{ opacity: selectedQuestions.length === 0 ? 0.5 : 1 }}
                >
                  Generate Paper
                </button>
              </div>
            </div>

            {loadingQuestions ? (
              <p style={{ textAlign: 'center', padding: 20 }}>Loading questions...</p>
            ) : availableQuestions.length === 0 ? (
              <p style={{ textAlign: 'center', padding: 20, color: '#888' }}>
                No questions available for the selected subject.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                {marksOptions.map(marks => (
                  <div key={marks} style={{ 
                    border: '1px solid #e0e0e0', 
                    borderRadius: 8, 
                    padding: 16,
                    background: '#f9f9f9'
                  }}>
                    <h4 style={{ marginTop: 0, marginBottom: 12, color: '#1976d2' }}>
                      {marks} Mark{marks > 1 ? 's' : ''} Questions ({questionsByMarks[marks].length})
                    </h4>
                    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                      {questionsByMarks[marks].map(q => {
                        const isSelected = selectedQuestions.some(sq => sq._id === q._id);
                        return (
                          <div 
                            key={q._id}
                            onClick={() => toggleQuestion(q)}
                            style={{
                              padding: '8px 12px',
                              marginBottom: 8,
                              borderRadius: 6,
                              border: isSelected ? '2px solid #4c6fff' : '1px solid #ddd',
                              background: isSelected ? '#e8edff' : '#fff',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <span style={{ fontSize: '0.9em' }}>{q.text?.substring(0, 50)}...</span>
                            <input 
                              type="checkbox" 
                              checked={isSelected} 
                              onChange={() => toggleQuestion(q)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        </div>
      )}

      {/* Manage Saved Question Papers View */}
      {viewMode === 'manage' && (
        <div style={{ 
          background: '#fff', 
          borderRadius: 12, 
          padding: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, color: '#333' }}>Saved Question Papers</h3>
          
          {loadingSavedPapers ? (
            <p style={{ textAlign: 'center', padding: 20 }}>Loading saved papers...</p>
          ) : savedPapers.length === 0 ? (
            <p style={{ textAlign: 'center', padding: 20, color: '#888' }}>
              No saved question papers found.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {savedPapers.map(paper => (
                <div 
                  key={paper._id}
                  style={{ 
                    border: '1px solid #e0e0e0', 
                    borderRadius: 8, 
                    padding: 16,
                    background: '#f9f9f9'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', color: '#1976d2' }}>
                        {paper.subject} - {paper.class}
                      </h4>
                      <p style={{ margin: '4px 0', fontSize: '0.9em' }}>
                        <strong>Board:</strong> {paper.board} | 
                        <strong> Difficulty:</strong> {paper.difficulty} |
                        <strong> Questions:</strong> {paper.totalQuestions} |
                        <strong> Marks:</strong> {paper.totalMarks}
                      </p>
                      <p style={{ margin: '4px 0', fontSize: '0.8em', color: '#666' }}>
                        Created: {new Date(paper.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button 
                        className="cta-button"
                        onClick={() => {
                          setSelectedSavedPaper(paper);
                          setGeneratedPaper(paper);
                          setShowPreview(true);
                        }}
                        style={{ padding: '8px 16px', fontSize: '0.9em' }}
                      >
                        View
                      </button>
                      <button 
                        className="cta-button"
                        onClick={() => deletePaper(paper._id)}
                        style={{ padding: '8px 16px', fontSize: '0.9em', background: '#d32f2f' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* permit Question Papers View */}
      {viewMode === 'permit' && (
        <div style={{ 
          background: '#fff', 
          borderRadius: 12, 
          padding: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, color: '#333' }}>Permit Question Papers for Students</h3>
          <p style={{ marginBottom: 24, color: '#666' }}>
            Select a question paper and set the date range and time limit for students to access and solve the paper.
          </p>
          
          {loadingSavedPapers ? (
            <p style={{ textAlign: 'center', padding: 20 }}>Loading saved papers...</p>
          ) : savedPapers.length === 0 ? (
            <p style={{ textAlign: 'center', padding: 20, color: '#888' }}>
              No saved question papers found. Create and save a question paper first.
            </p>
          ) : (
            <div>
              {/* Select Paper */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '1.1em' }}>Select Question Paper:</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {savedPapers.map(paper => (
                    <div 
                      key={paper._id}
                      onClick={() => setPermitPaper(paper)}
                      style={{ 
                        border: permitPaper?._id === paper._id ? '2px solid #1976d2' : '1px solid #e0e0e0',
                        borderRadius: 8, 
                        padding: 16,
                        background: permitPaper?._id === paper._id ? '#e3f2fd' : '#f9f9f9',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <h4 style={{ margin: '0 0 8px 0', color: '#1976d2', fontSize: '1em' }}>
                        {paper.subject} - {paper.class}
                      </h4>
                      <p style={{ margin: '4px 0', fontSize: '0.85em', color: '#666' }}>
                        <strong>Board:</strong> {paper.board} | 
                        <strong> Questions:</strong> {paper.totalQuestions} |
                        <strong> Marks:</strong> {paper.totalMarks}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Permit Settings */}
              {permitPaper && (
                <div style={{ 
                  border: '2px solid #4caf50', 
                  borderRadius: 12, 
                  padding: 24,
                  background: '#f1f8e9'
                }}>
                  <h4 style={{ marginTop: 0, marginBottom: 16, color: '#2e7d32', fontSize: '1.2em' }}>
                    Permit Settings for: {permitPaper.subject} - {permitPaper.class}
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                    {/* Start Date */}
                    <div>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Start Date & Time:</label>
                      <input 
                        type="datetime-local" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{ 
                          width: '100%', 
                          padding: '10px 12px', 
                          borderRadius: 8, 
                          border: '1.5px solid #bfc8e0', 
                          fontSize: '1em'
                        }}
                      />
                      <p style={{ marginTop: 4, fontSize: '0.8em', color: '#666' }}>When students can start accessing the paper</p>
                    </div>

                    {/* End Date */}
                    <div>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>End Date & Time:</label>
                      <input 
                        type="datetime-local" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={{ 
                          width: '100%', 
                          padding: '10px 12px', 
                          borderRadius: 8, 
                          border: '1.5px solid #bfc8e0', 
                          fontSize: '1em'
                        }}
                      />
                      <p style={{ marginTop: 4, fontSize: '0.8em', color: '#666' }}>When student access will be blocked</p>
                    </div>

                    {/* Time Limit */}
                    <div>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Time Limit (minutes):</label>
                      <input 
                        type="number" 
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)}
                        min="1"
                        style={{ 
                          width: '100%', 
                          padding: '10px 12px', 
                          borderRadius: 8, 
                          border: '1.5px solid #bfc8e0', 
                          fontSize: '1em'
                        }}
                      />
                      <p style={{ marginTop: 4, fontSize: '0.8em', color: '#666' }}>Duration to complete the paper</p>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div style={{ marginTop: 24, textAlign: 'center' }}>
                    <button 
                      onClick={savePermit}
                      style={{
                        background: '#4caf50',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '12px 32px',
                        fontSize: '1.1em',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
                      }}
                    >
                      Save Permit
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && generatedPaper && (
        <div className="popup-overlay">
          <div className="popup-form" style={{ maxWidth: 700, maxHeight: '80vh', overflow: 'auto' }}>
            <div className="popup-header">
              <span className="popup-title">Question Paper Preview</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button 
                  onClick={downloadAsPDF}
                  style={{
                    background: '#4caf50',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    padding: '6px 12px',
                    fontSize: '0.85em',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                  title="Download as PDF"
                >
                  <span>⬇</span> Download PDF
                </button>
                <button className="popup-close" onClick={() => setShowPreview(false)}>×</button>
              </div>
            </div>
            <div className="popup-body" id="question-paper-print-content">
              <div style={{ marginBottom: 16, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
                <p style={{ margin: '4px 0' }}><strong>Board:</strong> {generatedPaper.board}</p>
                <p style={{ margin: '4px 0' }}><strong>Class:</strong> {generatedPaper.class}</p>
                <p style={{ margin: '4px 0' }}><strong>Subject:</strong> {generatedPaper.subject}</p>
                <p style={{ margin: '4px 0' }}><strong>Difficulty:</strong> {generatedPaper.difficulty}</p>
                <p style={{ margin: '4px 0' }}><strong>Total Questions:</strong> {generatedPaper.questions.length}</p>
                <p style={{ margin: '4px 0' }}><strong>Total Marks:</strong> {generatedPaper.totalMarks}</p>
              </div>
              
              <h4 style={{ marginTop: 0 }}>Questions:</h4>
              {generatedPaper.questions.map((q, index) => (
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
            <div className="popup-actions">
              <button type="button" className="cta-button" style={{ marginRight: 12 }} onClick={() => setShowPreview(false)}>Close</button>
              {viewMode === 'create' && (
                <button type="button" className="cta-button" onClick={saveQuestionPaper}>Save & Print</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

