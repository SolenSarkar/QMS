import React, { useState, useEffect } from "react";
import "./App.css";

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
    fetch("/api/attributes")
      .then(res => res.json())
      .then(attrs => {
        const boardAttr = attrs.find(a => a.name.toLowerCase() === "board");
        if (boardAttr) {
          fetch(`/api/values/${boardAttr._id}`)
            .then(res => res.json())
            .then(data => setBoards(data.filter(v => v.status === 'Active')));
        }
        const classAttr = attrs.find(a => a.name.toLowerCase() === "class");
        if (classAttr) {
          fetch(`/api/values/${classAttr._id}`)
            .then(res => res.json())
            .then(data => setClasses(data.filter(v => v.status === 'Active')));
        }
        const subjectAttr = attrs.find(a => a.name.toLowerCase() === "subject");
        if (subjectAttr) {
          fetch(`/api/values/${subjectAttr._id}`)
            .then(res => res.json())
            .then(data => {
              setAllSubjects(data.filter(v => v.status === 'Active'));
              setSubjects(data.filter(v => v.status === 'Active'));
            });
        }
        const topicAttr = attrs.find(a => a.name.toLowerCase() === "topic");
        if (topicAttr) {
          fetch(`/api/values/${topicAttr._id}`)
            .then(res => res.json())
            .then(data => setTopics(data.filter(v => v.status === 'Active')));
        }
      });
  }, []);

  // Get all classes from database (no filtering)
  const getAllClasses = () => {
    return classes;
  };

  // Filter subjects when class is selected
  useEffect(() => {
    if (!selectedClass) {
      // If no class selected, show all subjects
      setSubjects(allSubjects);
    } else {
      // Filter subjects that are linked to the selected class
      const filteredSubjects = allSubjects.filter(subject => {
        // Show subjects that either:
        // 1. Have no classId (universal subjects for all classes)
        // 2. Have a classId that matches the selected class
        const subjectClassId = subject.classId;
        
        // If no classId is set, show the subject (it's a general subject)
        if (!subjectClassId) return true;
        
        // Handle different types of classId (string, ObjectId, or populated object)
        let subjectClassIdStr;
        if (typeof subjectClassId === 'string') {
          subjectClassIdStr = subjectClassId;
        } else if (subjectClassId && typeof subjectClassId === 'object') {
          // If it's an ObjectId object with _id property
          subjectClassIdStr = subjectClassId._id ? subjectClassId._id.toString() : null;
        } else {
          subjectClassIdStr = null;
        }
        
        const selectedClassIdStr = selectedClass.toString();
        
        return subjectClassIdStr === selectedClassIdStr;
      });
      setSubjects(filteredSubjects);
    }
    // Reset subject selection when class changes
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
    fetch(`/api/questions?subjectId=${selectedSubject}`)
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

      {/* Filters Section */}
      <div style={{ 
        background: '#fff', 
        borderRadius: 12, 
        padding: 24, 
        marginBottom: 24,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: 16, color: '#333' }}>Select Parameters</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {/* Board Selection */}
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

          {/* Class Selection - Filtered to only show classes with subjects */}
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

          {/* Subject Selection - Filtered by Class */}
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

          {/* Difficulty Level */}
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

      {/* Questions Selection Section */}
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
                      const topic = topics.find(t => t._id === q.topicId);
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

      {/* Preview Modal */}
      {showPreview && generatedPaper && (
        <div className="popup-overlay">
          <div className="popup-form" style={{ maxWidth: 700, maxHeight: '80vh', overflow: 'auto' }}>
            <div className="popup-header">
              <span className="popup-title">Question Paper Preview</span>
              <button className="popup-close" onClick={() => setShowPreview(false)}>×</button>
            </div>
            <div className="popup-body">
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
              <button type="button" className="cta-button" onClick={() => {
                alert('Question paper generated successfully!');
                setShowPreview(false);
              }}>Save & Print</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
