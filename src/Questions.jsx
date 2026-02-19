  // TopicsSection: shows topics for selected subject
  function TopicsSection({ subjectId, topics }) {
    const filteredTopics = topics.filter(t => t.subjectId === subjectId);
    return (
      <div style={{ margin: '24px 0', background: '#f5f8ff', borderRadius: 10, padding: 18, boxShadow: '0 2px 8px rgba(60,60,120,0.06)' }}>
        <h3 style={{ color: '#333', fontWeight: 700, marginBottom: 12 }}>Topics for Selected Subject</h3>
        {filteredTopics.length === 0 ? (
          <div style={{ color: '#888', fontStyle: 'italic' }}>No topics found for this subject.</div>
        ) : (
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            {filteredTopics.map(topic => (
              <li key={topic._id} style={{ marginBottom: 8, fontWeight: 500, color: '#222' }}>{topic.valueName}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }
  // Format value id similar to attribute id
  const formatId = (id) => {
    if (typeof id === 'number') {
      return `VAL${id.toString().padStart(3, '0')}`;
    }
    if (typeof id === 'string' && id.length >= 6) {
      return `VAL${id.slice(-6).toUpperCase()}`;
    }
    return id;
  };

import React, { useState, useEffect } from "react";

export default function QuestionsPage({ onHomeClick }) {

  // Dropdown data
  const [boards, setBoards] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedMarks, setSelectedMarks] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [optionInputs, setOptionInputs] = useState([""]);
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState("");


  // Fetch boards, classes, subjects, topics from backend (assuming attribute values)
  useEffect(() => {
    fetch("http://localhost:5000/api/attributes")
      .then(res => res.json())
      .then(attrs => {
        const boardAttr = attrs.find(a => a.name.toLowerCase() === "board");
        if (boardAttr) {
          fetch(`http://localhost:5000/api/values/${boardAttr._id}`)
            .then(res => res.json())
            .then(setBoards);
        }
        const classAttr = attrs.find(a => a.name.toLowerCase() === "class");
        if (classAttr) {
          fetch(`http://localhost:5000/api/values/${classAttr._id}`)
            .then(res => res.json())
            .then(setClasses);
        }
        const topicAttr = attrs.find(a => a.name.toLowerCase() === "topic");
        if (topicAttr) {
          fetch(`http://localhost:5000/api/values/${topicAttr._id}`)
            .then(res => res.json())
            .then(setTopics);
        }
      });
  }, []);

  // Fetch subjects for selected class (filter by classId)
  useEffect(() => {
    if (!selectedClass) {
      if (subjects.length !== 0) setSubjects([]);
      if (questions.length !== 0) setQuestions([]);
      if (activeTab !== "") setActiveTab("");
      return;
    }
    fetch("http://localhost:5000/api/attributes")
      .then(res => res.json())
      .then(attrs => {
        const subjectAttr = attrs.find(a => a.name.toLowerCase() === "subject");
        if (subjectAttr) {
          fetch(`http://localhost:5000/api/values/${subjectAttr._id}`)
            .then(res => res.json())
            .then(subjectsList => {
              // Show all subjects if none are linked to the class
              const filtered = subjectsList.filter(s => s.classId === selectedClass);
              let newSubjects = filtered.length > 0 ? filtered : subjectsList;
              // Only update if changed
              if (JSON.stringify(subjects) !== JSON.stringify(newSubjects)) setSubjects(newSubjects);
              // Do not set any subject as active by default
              if (activeTab && !newSubjects.some(s => s._id === activeTab)) setActiveTab("");
            });
        }
      });
  }, [selectedClass]);

  // Fetch questions for selected class and subject
  useEffect(() => {
    if (!selectedClass || !activeTab) {
      setQuestions([]);
      return;
    }
    fetch(`http://localhost:5000/api/questions?classId=${selectedClass}&subjectId=${activeTab}`)
      .then(res => res.json())
      .then(setQuestions);
  }, [selectedClass, activeTab]);

  // Handle type change for options
  const handleTypeChange = (e) => {
    setSelectedType(e.target.value);
    if (e.target.value === "single" || e.target.value === "multiple") {
      setOptionInputs([""]);
    } else {
      setOptionInputs([]);
    }
  };

  // Add/remove option fields
  const handleOptionChange = (idx, value) => {
    const newOptions = [...optionInputs];
    newOptions[idx] = value;
    setOptionInputs(newOptions);
  };
  const addOptionField = () => setOptionInputs([...optionInputs, ""]);
  const removeOptionField = (idx) => {
    const newOptions = optionInputs.filter((_, i) => i !== idx);
    setOptionInputs(newOptions);
  };

  // Add Question handler
  const handleAddQuestion = () => {
    // Basic validation
    if (!selectedBoard || !selectedClass || !selectedSubject || !selectedTopic || !selectedMarks || !selectedType || !questionText || !answerText) {
      alert("Please fill all fields.");
      return;
    }
    if ((selectedType === "single" || selectedType === "multiple") && optionInputs.some(opt => !opt.trim())) {
      alert("Please fill all options.");
      return;
    }
    const payload = {
      boardId: selectedBoard,
      classId: selectedClass,
      subjectId: selectedSubject,
      topicId: selectedTopic,
      marks: selectedMarks,
      type: selectedType,
      options: (selectedType === "single" || selectedType === "multiple") ? optionInputs : [],
      text: questionText,
      answer: answerText
    };
    fetch("http://localhost:5000/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        setQuestions(qs => [...qs, data]);
        setShowAddPopup(false);
        // Reset form fields
        setSelectedBoard("");
        setSelectedClass("");
        setSelectedSubject("");
        setSelectedTopic("");
        setSelectedMarks("");
        setSelectedType("");
        setOptionInputs([""]);
        setQuestionText("");
        setAnswerText("");
      })
      .catch(() => alert("Failed to add question. Please try again."));
  };

  // Popup/modal for add question (decoupled state)
  const AddQuestionPopup = () => {
    const [localBoard, setLocalBoard] = useState(selectedBoard);
    const [localClass, setLocalClass] = useState(selectedClass);
    const [localSubject, setLocalSubject] = useState(selectedSubject);
    const [localTopic, setLocalTopic] = useState(selectedTopic);
    const [localMarks, setLocalMarks] = useState(selectedMarks);
    const [localType, setLocalType] = useState(selectedType);
    const [localOptions, setLocalOptions] = useState([""]);
    const [localQuestion, setLocalQuestion] = useState("");
    const [localAnswer, setLocalAnswer] = useState("");
    const [localSubjects, setLocalSubjects] = useState([]);

    // Fetch subjects for selected class in popup
    useEffect(() => {
      if (!localClass) {
        setLocalSubjects([]);
        setLocalSubject("");
        return;
      }
      fetch("http://localhost:5000/api/attributes")
        .then(res => res.json())
        .then(attrs => {
          const subjectAttr = attrs.find(a => a.name.toLowerCase() === "subject");
          if (subjectAttr) {
            fetch(`http://localhost:5000/api/values/${subjectAttr._id}`)
              .then(res => res.json())
              .then(subjectsList => {
                const filtered = subjectsList.filter(s => s.classId === localClass);
                let newSubjects = filtered.length > 0 ? filtered : subjectsList;
                setLocalSubjects(newSubjects);
                setLocalSubject(newSubjects[0]?._id || "");
              });
          }
        });
    }, [localClass]);

    // Handle type change for options in popup
    const handleLocalTypeChange = (e) => {
      setLocalType(e.target.value);
      if (e.target.value === "single" || e.target.value === "multiple") {
        setLocalOptions([""]);
      } else {
        setLocalOptions([]);
      }
    };
    const handleLocalOptionChange = (idx, value) => {
      const newOptions = [...localOptions];
      newOptions[idx] = value;
      setLocalOptions(newOptions);
    };
    const addLocalOptionField = () => setLocalOptions([...localOptions, ""]);
    const removeLocalOptionField = (idx) => {
      const newOptions = localOptions.filter((_, i) => i !== idx);
      setLocalOptions(newOptions);
    };

    // Add Question handler for popup
    const handleLocalAddQuestion = () => {
      if (!localBoard || !localClass || !localSubject || !localTopic || !localMarks || !localType || !localQuestion || !localAnswer) {
        alert("Please fill all fields.");
        return;
      }
      if ((localType === "single" || localType === "multiple") && localOptions.some(opt => !opt.trim())) {
        alert("Please fill all options.");
        return;
      }
      const payload = {
        boardId: localBoard,
        classId: localClass,
        subjectId: localSubject,
        topicId: localTopic,
        marks: localMarks,
        type: localType,
        options: (localType === "single" || localType === "multiple") ? localOptions : [],
        text: localQuestion,
        answer: localAnswer
      };
      fetch("http://localhost:5000/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(res => res.json())
        .then(data => {
          setQuestions(qs => [...qs, data]);
          setShowAddPopup(false);
        })
        .catch(() => alert("Failed to add question. Please try again."));
    };

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(40, 40, 60, 0.35)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2.5px)' }}>
        <div style={{ background: 'linear-gradient(135deg, #f8fafc 60%, #e9eafc 100%)', padding: '38px 32px 28px 32px', borderRadius: '20px 1px 1px 20px', minWidth: 360, maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 16px 48px 0 rgba(60, 60, 120, 0.18), 0 2px 12px rgba(60, 60, 120, 0.10)', border: '1.5px solid #e0e3f5', position: 'relative', textAlign: 'center', transition: 'box-shadow 0.2s, border 0.2s', animation: 'modalPopIn 0.25s cubic-bezier(.4,1.6,.6,1) 1' }}>
          <button
            onClick={() => setShowAddPopup(false)}
            style={{
              position: 'absolute',
              top: 12,
              right: 18,
              background: 'none',
              border: 'none',
              fontSize: '2em',
              color: '#888',
              cursor: 'pointer',
              zIndex: 2,
              lineHeight: 1,
              padding: 0
            }}
            aria-label="Close"
            title="Close"
          >
            &times;
          </button>
          <h3 style={{ marginTop: 0, marginBottom: 18, color: '#2d2e4a', fontSize: '1.45em', fontWeight: 700, letterSpacing: 0.2 }}>Add Question</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 8 }}>
            <label style={{ fontWeight: 600, color: '#333', marginBottom: 2, textAlign: 'left' }}>Board
              <select value={localBoard} onChange={e => setLocalBoard(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #bfc8e0', fontSize: '1em', background: '#f5f8ff', color: '#1a237e', marginTop: 4 }}>
                <option value="">Select Board</option>
                {boards.map(b => <option key={b._id} value={b._id}>{b.valueName}</option>)}
              </select>
            </label>
            <label style={{ fontWeight: 600, color: '#333', marginBottom: 2, textAlign: 'left' }}>Class
              <select value={localClass} onChange={e => setLocalClass(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #bfc8e0', fontSize: '1em', background: '#f5f8ff', color: '#1a237e', marginTop: 4 }}>
                <option value="">Select Class</option>
                {classes.map(cls => <option key={cls._id} value={cls._id}>{cls.valueName}</option>)}
              </select>
            </label>
            <label style={{ fontWeight: 600, color: '#333', marginBottom: 2, textAlign: 'left' }}>Subject
              <select value={localSubject} onChange={e => setLocalSubject(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #bfc8e0', fontSize: '1em', background: '#f5f8ff', color: '#1a237e', marginTop: 4 }}>
                <option value="">Select Subject</option>
                {localSubjects.map(sub => <option key={sub._id} value={sub._id}>{sub.valueName}</option>)}
              </select>
            </label>
            <label style={{ fontWeight: 600, color: '#333', marginBottom: 2, textAlign: 'left' }}>Topic
              <select value={localTopic} onChange={e => setLocalTopic(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #bfc8e0', fontSize: '1em', background: '#f5f8ff', color: '#1a237e', marginTop: 4 }}>
                <option value="">Select Topic</option>
                {topics.map(t => <option key={t._id} value={t._id}>{t.valueName}</option>)}
              </select>
            </label>
            <label style={{ fontWeight: 600, color: '#333', marginBottom: 2, textAlign: 'left' }}>Marks
              <select value={localMarks} onChange={e => setLocalMarks(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #bfc8e0', fontSize: '1em', background: '#f5f8ff', color: '#1a237e', marginTop: 4 }}>
                <option value="">Select Marks</option>
                {[1,2,3,4,5].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
            <label style={{ fontWeight: 600, color: '#333', marginBottom: 2, textAlign: 'left' }}>Type
              <select value={localType} onChange={handleLocalTypeChange} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #bfc8e0', fontSize: '1em', background: '#f5f8ff', color: '#1a237e', marginTop: 4 }}>
                <option value="">Select Type</option>
                <option value="single">Single Choice</option>
                <option value="multiple">Multiple Choice</option>
                <option value="text">Text</option>
                <option value="numeric">Numeric</option>
              </select>
            </label>
            {(localType === "single" || localType === "multiple") && (
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontWeight: 600, color: '#333', marginBottom: 2, textAlign: 'left', display: 'block' }}>Options:</label>
                {localOptions.map((opt, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <input type="text" value={opt} onChange={e => handleLocalOptionChange(idx, e.target.value)} placeholder={`Option ${idx+1}`} style={{ flex: 1, padding: '9px 12px', borderRadius: 7, border: '1.5px solid #bfc8e0', fontSize: '1em', background: '#f8fafc', color: '#1a237e' }} />
                    {localOptions.length > 1 && <button type="button" onClick={() => removeLocalOptionField(idx)} style={{ color: '#e53935', background: 'none', border: 'none', fontWeight: 700, fontSize: 18, cursor: 'pointer', padding: '0 8px' }}>×</button>}
                  </div>
                ))}
                <button type="button" onClick={addLocalOptionField} style={{ marginTop: 4, background: 'linear-gradient(90deg, #667eea 60%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 18px', fontWeight: 600, fontSize: '1em', cursor: 'pointer', boxShadow: '0 2px 8px rgba(102, 126, 234, 0.08)' }}>+ Add Option</button>
              </div>
            )}
            <label style={{ fontWeight: 600, color: '#333', marginBottom: 2, textAlign: 'left' }}>Question
              <textarea value={localQuestion} onChange={e => setLocalQuestion(e.target.value)} rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #bfc8e0', fontSize: '1em', background: '#f8fafc', color: '#1a237e', marginTop: 4, resize: 'vertical' }} placeholder="Enter question text..." />
            </label>
            <label style={{ fontWeight: 600, color: '#333', marginBottom: 2, textAlign: 'left' }}>Answer
              <textarea value={localAnswer} onChange={e => setLocalAnswer(e.target.value)} rows={2} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #bfc8e0', fontSize: '1em', background: '#f8fafc', color: '#1a237e', marginTop: 4, resize: 'vertical' }} placeholder="Enter answer..." />
            </label>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, marginTop: 22 }}>
            <button onClick={() => setShowAddPopup(false)} style={{ background: '#eee', color: '#333', borderRadius: 8, padding: '10px 24px', fontWeight: 600, fontSize: '1em', border: 'none', boxShadow: '0 2px 8px rgba(60,60,120,0.06)', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleLocalAddQuestion} style={{ background: 'linear-gradient(90deg, #667eea 60%, #764ba2 100%)', color: '#fff', borderRadius: 8, padding: '10px 28px', fontWeight: 700, fontSize: '1.08em', border: 'none', boxShadow: '0 2px 8px rgba(102, 126, 234, 0.13)', cursor: 'pointer', transition: 'background 0.2s' }}>Add</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="questions-page" style={{ backgroundColor: '#507ced'}}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, marginBottom: 24, backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8 }}>
        <h2 style={{ color: '#333', fontWeight: '800', fontSize: '1.8em', margin: 0 }}>Questions</h2>
        <button className="back-button" style={{ position: 'static', marginBottom: 0 }} onClick={onHomeClick}>
          <span style={{ fontSize: 20, marginRight: 6 }}>&#8592;</span> Back
        </button>
      </div>
      <div style={{ marginBottom: 24, display: 'flex', gap: 18, alignItems: 'center', justifyContent: 'flex-start', backgroundColor: '#c2dbf3', padding: 12, borderRadius: 8 }}>
        <label style={{ fontWeight: 800, fontSize: '1.08em'}}>Class:</label>
        <select
          className="questions-class-dropdown"
          value={selectedClass}
          onChange={e => setSelectedClass(e.target.value)}
        >
          <option value="">Select Class</option>
          {classes.map(cls => (
            <option key={cls._id} value={cls._id}>{cls.valueName}</option>
          ))}
        </select>
        {/* Add Question button always visible if a class is selected */}
        <button
          className="cta-button"
          style={{ marginLeft: 350, padding: '12px 28px', fontSize: '1.08em', fontWeight: 700, borderRadius: 8 }}
          onClick={() => setShowAddPopup(true)}
          disabled={!selectedClass || !activeTab}
        >
          + Add Question
        </button>
      </div>
      {subjects.length > 0 && (
        <div className="questions-subject-tabs-grid">
          {subjects.map((sub, idx) => (
            <React.Fragment key={sub._id}>
              <button
                className={"questions-subject-tab" + (activeTab === sub._id ? " active" : "")}
                onClick={() => setActiveTab(sub._id)}
                style={{ marginBottom: 12 }}
              >
                {sub.valueName}
              </button>
              {(idx % 2 === 1) && <div style={{ width: '100%' }}></div>}
            </React.Fragment>
          ))}
        </div>
      )}
      {/* Show topics for the selected subject tab */}
      {activeTab && (
        <TopicsSection subjectId={activeTab} topics={topics} />
      )}
      {showAddPopup && <AddQuestionPopup />}
      <div style={{ marginTop: 24 }}>
        {questions.length === 0 ? (
          <div className="questions-no-data">No questions found for this class and subject.</div>
        ) : (
          <table className="questions-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Question</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q._id}>
                  <td>{formatId(q._id)}</td>
                  <td>{q.text}</td>
                  <td>{q.type}</td>
                  <td>
                    {/* Add edit/delete buttons here if needed */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
