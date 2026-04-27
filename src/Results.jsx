import React, { useState, useEffect } from "react";
import "./App.css";

export default function Results({ onHomeClick }) {
  const [students, setStudents] = useState([]);
  const [allTestRecords, setAllTestRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [classes, setClasses] = useState([]);
  
  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRecord, setReviewRecord] = useState(null);

  // Fetch classes for filter dropdown
  useEffect(() => {
    fetch("https://qms-sjuv.onrender.com/api/attributes")
      .then(res => res.json())
      .then(attrs => {
        const classAttr = attrs.find(a => a.name.toLowerCase() === "class");
        if (classAttr) {
          fetch(`https://qms-sjuv.onrender.com/api/values/${classAttr._id}`)
            .then(res => res.json())
            .then(data => setClasses(data.filter(v => v.status === 'Active')))
            .catch(err => console.error("Error fetching classes:", err));
        }
      })
      .catch(err => console.error("Error fetching attributes:", err));
  }, []);

  // Fetch all students and their test records
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all students
        const studentsRes = await fetch("https://qms-sjuv.onrender.com/api/students");
        const studentsData = await studentsRes.json();
        
        if (Array.isArray(studentsData) && studentsData.length > 0) {
          setStudents(studentsData);
          
          // Fetch test records for each student
          const allRecords = [];
          for (const student of studentsData) {
            try {
              const recordsRes = await fetch(`https://qms-sjuv.onrender.com/api/test-records/${student._id}`);
              const recordsData = await recordsRes.json();
              
              if (Array.isArray(recordsData)) {
                // Add student info to each record
                recordsData.forEach(record => {
                  allRecords.push({
                    ...record,
                    studentName: student.name,
                    rollNumber: student.rollNumber,
                    classId: student.classId,
                    className: student.className || student.classId?.valueName || '-'
                  });
                });
              }
            } catch (err) {
              console.error(`Error fetching records for student ${student._id}:`, err);
            }
          }
          
          // Sort by date (newest first)
          allRecords.sort((a, b) => new Date(b.testDate) - new Date(a.testDate));
          setAllTestRecords(allRecords);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  // Filter results based on search and class filter
  const filteredResults = allTestRecords.filter(record => {
    const matchesSearch = searchTerm === "" || 
      record.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.subjectName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = filterClass === "" || 
      record.classId === filterClass || 
      record.classId?._id === filterClass;
    
    return matchesSearch && matchesClass;
  });

  // Calculate statistics
  const totalTests = allTestRecords.length;
  const averageScore = totalTests > 0 
    ? (allTestRecords.reduce((sum, r) => sum + r.score, 0) / totalTests).toFixed(1)
    : 0;

  return (
    <div className="results-page" style={{ position: 'relative', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14, marginBottom: 24 }}>
        <button
          className="back-button"
          style={{
            background: '#edebeb',
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
        <h2 style={{ color: '#ffffff', fontWeight: '800', fontSize: '1.8em', margin: 0 }}>Test Results</h2>
      </div>

      {/* Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          borderRadius: 12, 
          padding: 20,
          color: 'white'
        }}>
          <div style={{ fontSize: '0.9em', opacity: 0.9 }}>Total Test Attempts</div>
          <div style={{ fontSize: '2.5em', fontWeight: 'bold' }}>{totalTests}</div>
        </div>
        <div style={{ 
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
          borderRadius: 12, 
          padding: 20,
          color: 'white'
        }}>
          <div style={{ fontSize: '0.9em', opacity: 0.9 }}>Average Score</div>
          <div style={{ fontSize: '2.5em', fontWeight: 'bold' }}>{averageScore}</div>
        </div>
        <div style={{ 
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
          borderRadius: 12, 
          padding: 20,
          color: 'white'
        }}>
          <div style={{ fontSize: '0.9em', opacity: 0.9 }}>Total Students</div>
          <div style={{ fontSize: '2.5em', fontWeight: 'bold' }}>{students.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by student name, roll number, or subject..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: 250,
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid #ddd',
            fontSize: '1em'
          }}
        />
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid #ddd',
            fontSize: '1em',
            minWidth: 150
          }}
        >
          <option value="">All Classes</option>
          {classes.map(cls => (
            <option key={cls._id} value={cls._id}>{cls.valueName}</option>
          ))}
        </select>
      </div>

      {/* Results Table */}
      <div className="attribute-table-container">
        <table className="attribute-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Roll Number</th>
              <th>Class</th>
              <th>Subject</th>
              <th>Score</th>
              <th>Correct Answers</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ color: '#888' }}>Loading results...</div>
                </td>
              </tr>
            ) : filteredResults.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ color: '#888' }}>
                    {allTestRecords.length === 0 
                      ? "No test results found. Students need to complete tests first."
                      : "No results match your search criteria."}
                  </div>
                </td>
              </tr>
            ) : (
              filteredResults.map((record, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: 600, color: '#1976d2' }}>
                    {record.studentName}
                    {record.isAutoSubmitted && (
                      <span style={{
                        display: 'inline-block',
                        marginLeft: 8,
                        padding: '2px 8px',
                        borderRadius: 4,
                        backgroundColor: '#ff9800',
                        color: '#fff',
                        fontSize: '0.75em',
                        fontWeight: 600
                      }}>
                        Auto-Submitted
                      </span>
                    )}
                  </td>
                  <td>{record.rollNumber}</td>
                  <td>{record.className}</td>
                  <td>{record.subjectName || '-'}</td>
                  <td>
                    <span style={{ 
                      fontWeight: 'bold',
                      color: record.score >= (record.totalQuestions * 0.7) ? '#4caf50' : 
                             record.score >= (record.totalQuestions * 0.5) ? '#ff9800' : '#f44336'
                    }}>
                      {record.score}
                    </span>
                  </td>
                  <td>{record.correctAnswers}/{record.totalQuestions}</td>
                  <td>
                    {new Date(record.testDate).toLocaleDateString('en-GB', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td>
                    <button 
                      onClick={() => { setReviewRecord(record); setShowReviewModal(true); }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 4,
                        border: 'none',
                        backgroundColor: '#667eea',
                        color: '#fff',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.85em'
                      }}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      {showReviewModal && reviewRecord && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '90%', maxWidth: 800, maxHeight: '85vh', overflow: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: '#333' }}>Test Review</h2>
              <button onClick={() => { setShowReviewModal(false); setReviewRecord(null); }} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#666' }}>×</button>
            </div>
            <div style={{ marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
                <div><p style={{ margin: '0 0 4px 0', fontSize: '0.85em', color: '#666' }}>Student</p><p style={{ margin: 0, fontWeight: 600, fontSize: '1.1em' }}>{reviewRecord.studentName}</p></div>
                <div><p style={{ margin: '0 0 4px 0', fontSize: '0.85em', color: '#666' }}>Subject</p><p style={{ margin: 0, fontWeight: 600, fontSize: '1.1em' }}>{reviewRecord.subjectName || 'Test'}</p></div>
                <div><p style={{ margin: '0 0 4px 0', fontSize: '0.85em', color: '#666' }}>Date</p><p style={{ margin: 0, fontWeight: 600, fontSize: '1.1em' }}>{new Date(reviewRecord.testDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p></div>
                <div><p style={{ margin: '0 0 4px 0', fontSize: '0.85em', color: '#666' }}>Score</p><p style={{ margin: 0, fontWeight: 600, fontSize: '1.1em', color: reviewRecord.score >= (reviewRecord.totalQuestions * 0.7) ? '#4caf50' : reviewRecord.score >= (reviewRecord.totalQuestions * 0.5) ? '#ff9800' : '#f44336' }}>{reviewRecord.score} / {reviewRecord.totalQuestions}</p></div>
                <div><p style={{ margin: '0 0 4px 0', fontSize: '0.85em', color: '#666' }}>Correct Answers</p><p style={{ margin: 0, fontWeight: 600, fontSize: '1.1em' }}>{reviewRecord.correctAnswers} / {reviewRecord.totalQuestions}</p></div>
              </div>
            </div>
            <h3 style={{ marginTop: 0, marginBottom: 16, color: '#333' }}>Question Review</h3>
            {reviewRecord.answers && reviewRecord.answers.length > 0 ? (
              <div style={{ display: 'grid', gap: 16 }}>
                {reviewRecord.answers.map((answer, index) => {
                  // Determine if this is a text/numeric question (no options) or multiple choice
                  const hasOptions = answer.options && answer.options.length > 0;
                  
                  // Format the correct answer for display
                  const formatAnswer = (ans) => {
                    if (ans === undefined || ans === null || ans === '') return 'Not Answered';
                    if (typeof ans === 'number') {
                      // Check if it's a letter code (0-3 for A-D)
                      if (ans >= 0 && ans <= 25) {
                        return String.fromCharCode(65 + ans);
                      }
                      return String(ans);
                    }
                    return String(ans);
                  };
                  
                  // Get user's answer display
                  const userAnswerDisplay = formatAnswer(answer.selectedAnswer);
                  // Get correct answer display  
                  const correctAnswerDisplay = formatAnswer(answer.correctAnswer);
                  
                  return (
                    <div key={index} style={{ padding: 16, borderRadius: 8, border: `2px solid ${answer.isCorrect ? '#4caf50' : '#f44336'}`, backgroundColor: answer.isCorrect ? '#f1f8e9' : '#ffebee' }}>
                      {/* Question Header with status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '1.1em', flex: 1, paddingRight: 12 }}>
                          <strong>Q{index + 1}.</strong> {answer.questionText}
                          {answer.marks && <span style={{ marginLeft: 8, fontSize: '0.85em', color: '#666', fontWeight: 400 }}>({answer.marks} mark{answer.marks > 1 ? 's' : ''})</span>}
                        </p>
                        <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: '0.8em', fontWeight: 600, backgroundColor: answer.isCorrect ? '#4caf50' : '#f44336', color: '#fff', whiteSpace: 'nowrap' }}>
                          {answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                        </span>
                      </div>
                      
                      {/* Your Answer Section - Always Visible */}
                      <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: 6, backgroundColor: answer.isCorrect ? '#e8f5e9' : '#ffebee', border: `1px solid ${answer.isCorrect ? '#4caf50' : '#f44336'}` }}>
                        <p style={{ margin: '0 0 6px 0', fontSize: '0.85em', fontWeight: 600, color: '#333' }}>
                          {answer.isCorrect ? '✓ Your Answer (Correct)' : '✗ Your Answer'}
                        </p>
                        <p style={{ margin: 0, fontSize: '1.1em', fontWeight: 600, color: answer.isCorrect ? '#2e7d32' : '#c62828' }}>
                          {userAnswerDisplay}
                        </p>
                        {answer.imageUrl && (
                          <div style={{ marginTop: 12 }}>
                            <p style={{ margin: '0 0 8px 0', fontSize: '0.8em', fontWeight: 600, color: '#1976d2' }}>📷 Supporting Image:</p>
                            <img 
                              src={`https://qms-sjuv.onrender.com${answer.imageUrl}`} 
                              alt="Student answer" 
                              style={{ 
                                maxWidth: '200px', 
                                maxHeight: '150px', 
                                borderRadius: 8, 
                                border: '2px solid #e0e0e0',
                                objectFit: 'contain'
                              }} 
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Show options for multiple choice questions */}
                      {hasOptions && (
                        <div style={{ marginTop: 12 }}>
                          <p style={{ margin: '0 0 8px 0', fontSize: '0.85em', fontWeight: 600, color: '#666' }}>Options:</p>
                          {answer.options.map((opt, optIndex) => {
                            // Check if answers are letter codes or text
                            const isSelectedLetter = typeof answer.selectedAnswer === 'string' && answer.selectedAnswer.length === 1 && /[A-Z]/i.test(answer.selectedAnswer);
                            const isCorrectLetter = typeof answer.correctAnswer === 'string' && answer.correctAnswer.length === 1 && /[A-Z]/i.test(answer.correctAnswer);
                            
                            let isSelected = false;
                            let isCorrectOption = false;
                            
                            if (isSelectedLetter && isCorrectLetter) {
                              // Both are letter codes - compare by index
                              const selectedIdx = answer.selectedAnswer.toUpperCase().charCodeAt(0) - 65;
                              const correctIdx = answer.correctAnswer.toUpperCase().charCodeAt(0) - 65;
                              isSelected = optIndex === selectedIdx;
                              isCorrectOption = optIndex === correctIdx;
                            } else {
                              // Compare by text content
                              isSelected = opt.toString().trim().toLowerCase() === (answer.selectedAnswer || '').toString().trim().toLowerCase();
                              isCorrectOption = opt.toString().trim().toLowerCase() === (answer.correctAnswer || '').toString().trim().toLowerCase();
                            }
                            
                            let backgroundColor = '#fff';
                            let borderColor = '#e0e0e0';
                            let fontWeight = 400;
                            let badge = null;
                            
                            if (isCorrectOption) { 
                              backgroundColor = '#c8e6c9'; 
                              borderColor = '#4caf50'; 
                              fontWeight = 600;
                              badge = <span style={{ marginLeft: 8, fontWeight: 600, color: '#2e7d32', fontSize: '0.85em' }}>✓ Correct</span>;
                            }
                            else if (isSelected && !isCorrectOption) { 
                              backgroundColor = '#ffcdd2'; 
                              borderColor = '#f44336'; 
                              fontWeight = 600;
                              badge = <span style={{ marginLeft: 8, fontWeight: 600, color: '#c62828', fontSize: '0.85em' }}>✗ Wrong</span>;
                            }
                            
                            return (
                              <div key={optIndex} style={{ padding: '10px 12px', margin: '4px 0', borderRadius: 6, border: '2px solid ' + borderColor, backgroundColor: backgroundColor, fontWeight: fontWeight, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ flex: 1 }}>
                                  {String.fromCharCode(65 + optIndex)}. {opt}
                                </span>
                                {badge}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Correct Answer Section - Only show if wrong */}
                      {!answer.isCorrect && answer.correctAnswer !== undefined && answer.correctAnswer !== "" && (
                        <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: 6, backgroundColor: '#e8f5e9', border: '1px solid #4caf50' }}>
                          <p style={{ margin: '0 0 6px 0', fontSize: '0.85em', fontWeight: 600, color: '#2e7d32' }}>
                            ✓ Correct Answer
                          </p>
                          <p style={{ margin: 0, fontSize: '1.1em', fontWeight: 600, color: '#2e7d32' }}>
                            {correctAnswerDisplay}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (<div style={{ textAlign: 'center', padding: 40, color: '#888' }}><p>No detailed answers available for this test.</p></div>)}
            <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowReviewModal(false); setReviewRecord(null); }} style={{ padding: '12px 24px', borderRadius: 6, border: '1px solid #ddd', backgroundColor: '#fff', color: '#666', fontWeight: 600, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

