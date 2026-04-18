import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { showToast } from "./Toast";

const API_URL = import.meta.env.VITE_API_URL || 'https://qms-sjuv.onrender.com';

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

function PasskeyPopup({
  pendingSubject,
  enteredPasskey,
  setEnteredPasskey,
  passkeyError,
  onClose,
  onVerify
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.4)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 2000
    }}>
      <div style={{
        background: "white",
        padding: 30,
        borderRadius: 12,
        width: 350,
        textAlign: "center"
      }}>
        <h3>Enter Passkey for {pendingSubject?.valueName}</h3>

        <input
          ref={inputRef}
          type="password"
          value={enteredPasskey}
          onChange={(e) => setEnteredPasskey(e.target.value)}
          placeholder="Enter passkey"
          style={{
            width: "100%", padding: 10, marginTop: 15, borderRadius: 6, border: "1px solid #ccc"
          }}
        />

        {passkeyError && (
          <p style={{ color: "red", marginTop: 10 }}>
            {passkeyError}
          </p>
        )}

        <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#ddd", cursor: "pointer" }}>Cancel</button>
          <button onClick={onVerify} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#4c6fff", color: "white", cursor: "pointer" }}>Unlock</button>
        </div>
      </div>
    </div>
  );
}


export default function QuestionsPage({ onHomeClick }) {
  
// "grid" or "dropdown"
const [subjectViewMode, setSubjectViewMode] = useState("grid");

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
  const [showPasskeyPopup, setShowPasskeyPopup] = useState(false);
  const passkeyInputRef = useRef(null);
  const [pendingSubject, setPendingSubject] = useState(null);
  const [enteredPasskey, setEnteredPasskey] = useState("");
  const [passkeyError, setPasskeyError] = useState("");
const [unlockedSubjects, setUnlockedSubjects] = useState([]);
  
  // Store all subjects to determine which classes have subjects
  const [allSubjects, setAllSubjects] = useState([]);
  
  // Track expanded topics
  const [expandedTopics, setExpandedTopics] = useState({});
  
// Passkeys are now stored in the database - using pendingSubject.passkey

  // Fetch boards, classes, subjects, topics from backend (assuming attribute values)
  useEffect(() => {
    fetch("https://qms-sjuv.onrender.com/api/attributes")
      .then(res => res.json())
      .then(attrs => {
        const boardAttr = attrs.find(a => a.name.toLowerCase() === "board");
        if (boardAttr) {
          fetch(`https://qms-sjuv.onrender.com/api/values/${boardAttr._id}`)
            .then(res => res.json())
            .then(setBoards);
        }
        const classAttr = attrs.find(a => a.name.toLowerCase() === "class");
        if (classAttr) {
          fetch(`https://qms-sjuv.onrender.com/api/values/${classAttr._id}`)
            .then(res => res.json())
            .then(data => setClasses(data.filter(v => v.status === 'Active')));
        }
        const subjectAttr = attrs.find(a => a.name.toLowerCase() === "subject");
        if (subjectAttr) {
          fetch(`https://qms-sjuv.onrender.com/api/values/${subjectAttr._id}`)
            .then(res => res.json())
            .then(data => {
              setAllSubjects(data);
            });
        }
        const topicAttr = attrs.find(a => a.name.toLowerCase() === "topic");
        if (topicAttr) {
          fetch(`https://qms-sjuv.onrender.com/api/values/${topicAttr._id}`)
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
    fetch("https://qms-sjuv.onrender.com/api/attributes")
      .then(res => res.json())
      .then(attrs => {
        const subjectAttr = attrs.find(a => a.name.toLowerCase() === "subject");
        if (subjectAttr) {
          fetch(`https://qms-sjuv.onrender.com/api/values/${subjectAttr._id}`)
            .then(res => res.json())
            .then(subjectsList => {
              // Filter subjects that match the selected class OR have no classId (universal subjects)
              const filtered = subjectsList.filter(s => {
                if (!s.classId) return true; // Show subjects without classId
                return s.classId.toString() === selectedClass.toString();
              });
              let newSubjects = filtered.length > 0 ? filtered : subjectsList;
              // Only update if changed
              if (JSON.stringify(subjects) !== JSON.stringify(newSubjects)) setSubjects(newSubjects);
              // Do not set any subject as active by default
              if (activeTab && !newSubjects.some(s => s._id === activeTab)) setActiveTab("");
            });
        }
      });
  }, [selectedClass]);
  useEffect(() => {
  if (showPasskeyPopup && passkeyInputRef.current) {
    passkeyInputRef.current.focus();
  }
}, [showPasskeyPopup]);
  // Fetch questions for selected class and subject
  useEffect(() => {
    if (!selectedClass || !activeTab) {
      setQuestions([]);
      return;
    }
    fetch(`https://qms-sjuv.onrender.com/api/questions?classId=${selectedClass}&subjectId=${activeTab}`)
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
      showToast("Please fill all fields.", 'warning');
      return;
    }
    if ((selectedType === "single" || selectedType === "multiple") && optionInputs.some(opt => !opt.trim())) {
      showToast("Please fill all options.", 'warning');
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
    fetch("https://qms-sjuv.onrender.com/api/questions", {
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
      .catch(() => showToast("Failed to add question. Please try again.", 'error'));
  };
  
const handleSubjectClick = (subject) => {
  if (unlockedSubjects.includes(subject._id)) {
    setActiveTab(subject._id);
    setSubjectViewMode("dropdown");
    return;
  }

  setPendingSubject(subject);
  setEnteredPasskey("");
  setPasskeyError("");
  setShowPasskeyPopup(true);
};

const verifyPasskey = () => {
  if (!pendingSubject) return;

  // Get passkey from database (subject.passkey field)
  const correctKey = pendingSubject.passkey || "";

  // If no passkey is set in database, allow access
  if (!correctKey) {
    setUnlockedSubjects(prev => [...prev, pendingSubject._id]);
    setActiveTab(pendingSubject._id);
    setShowPasskeyPopup(false);
    setSubjectViewMode("dropdown");
    return;
  }

  if (enteredPasskey === correctKey) {
    setUnlockedSubjects(prev => [...prev, pendingSubject._id]);
    setActiveTab(pendingSubject._id);
    setShowPasskeyPopup(false);
    setSubjectViewMode("dropdown");
  } else {
    setPasskeyError("Incorrect passkey. Try again.");
  }
};

const getTopicName = (topicId) => {
  const topic = topics.find(t => t._id === topicId);
  return topic ? topic.valueName : topicId;
};

const handleDelete = (id) => {
  if (!confirm('Are you sure you want to delete this question?')) {
    return;
  }
  console.log('Deleting question with ID:', id);
  fetch(`https://qms-sjuv.onrender.com/api/questions/${id}`, {
    method: 'DELETE'
  })
  .then(res => {
    console.log('Delete response status:', res.status);
    if (!res.ok) {
      return res.json().then(err => { throw new Error(err.error || 'Delete failed'); });
    }
    return res.json();
  })
  .then(data => {
    console.log('Delete response data:', data);
    setQuestions(qs => qs.filter(q => {
      // Handle both string and ObjectId comparisons
      const questionId = q._id.toString();
      const deleteId = id.toString();
      return questionId !== deleteId;
    }));
  })
  .catch(err => {
    console.error('Delete error:', err);
    showToast('Failed to delete question: ' + err.message, 'error');
  });
};

const toggleTopic = (topicId) => {
  setExpandedTopics(prev => ({
    ...prev,
    [topicId]: !prev[topicId]
  }));
};

// Group questions by topic and sort by marks
const getQuestionsByTopic = () => {
  const questionsByTopic = {};
  questions.forEach(q => {
    const topicId = q.topicId || 'uncategorized';
    if (!questionsByTopic[topicId]) {
      questionsByTopic[topicId] = [];
    }
    questionsByTopic[topicId].push(q);
  });
  
  // Sort questions by marks within each topic (ascending order)
  Object.keys(questionsByTopic).forEach(topicId => {
    questionsByTopic[topicId].sort((a, b) => {
      const marksA = a.marks || 0;
      const marksB = b.marks || 0;
      return marksA - marksB;
    });
  });
  
  return questionsByTopic;
};

const questionsByTopic = getQuestionsByTopic();

  // Popup/modal for add question (decoupled state)
  const AddQuestionPopup = () => {
    const [localBoard, setLocalBoard] = useState(selectedBoard);
    const [localClass, setLocalClass] = useState(selectedClass);
    const [localSubject, setLocalSubject] = useState(selectedSubject);
    const [localTopic, setLocalTopic] = useState(selectedTopic);
const [localMarks, setLocalMarks] = useState(selectedMarks);
const [localType, setLocalType] = useState(selectedType);
    const [localOptions, setLocalOptions] = useState([""]);
    const [localImage, setLocalImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const fileInputRef = useRef(null);
    const [uploadMethod, setUploadMethod] = useState('local');
    const [localQuestion, setLocalQuestion] = useState("");
    const [localAnswer, setLocalAnswer] = useState("");
    const [localSubjects, setLocalSubjects] = useState([]);

    // Fetch subjects for selected class.in popup
    useEffect(() => {
      if (!localClass) {
        setLocalSubjects([]);
        setLocalSubject("");
        return;
      }
      fetch("https://qms-sjuv.onrender.com/api/attributes")
        .then(res => res.json())
        .then(attrs => {
          const subjectAttr = attrs.find(a => a.name.toLowerCase() === "subject");
          if (subjectAttr) {
            fetch(`https://qms-sjuv.onrender.com/api/values/${subjectAttr._id}`)
              .then(res => res.json())
              .then(subjectsList => {
                const filtered = subjectsList.filter(s => {
                  if (!s.classId) return true; // Show subjects without classId
                  return s.classId.toString() === localClass.toString();
                });
                let newSubjects = filtered.length > 0 ? filtered : subjectsList;
                setLocalSubjects(newSubjects);
                setLocalSubject(newSubjects[0]?._id || "");
              });
          }
        });
    }, [localClass]);

    // Handle type change for options in popup
    const handleLocalTypeChange = (e) => {
      const newType = e.target.value;
      setLocalType(newType);
      if (newType === "single" || newType === "multiple") {
        setLocalOptions([""]);
      } else {
        setLocalOptions([]);
      }
      if (newType !== "picture") {
        setLocalImage(null);
        setImagePreview(null);
      }
    };

    const handleImageChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setLocalImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    };

    const removeImage = () => {
      setLocalImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
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
        showToast("Please fill all fields.", 'warning');
        return;
      }
      if ((localType === "single" || localType === "multiple") && localOptions.some(opt => !opt.trim())) {
        showToast("Please fill all options.", 'warning');
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
      fetch("https://qms-sjuv.onrender.com/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(res => res.json())
        .then(data => {
          setQuestions(qs => [...qs, data]);
          setShowAddPopup(false);
        })
        .catch(() => showToast("Failed to add question. Please try again.", 'error'));
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
                <option value="picture">Picture</option>
              </select>
            </label>
            {localType === 'picture' && (
              <div style={{ marginTop: 12, padding: 12, backgroundColor: '#f8f9ff', borderRadius: 8, border: '1px solid #e0e7ff' }}>
                <label style={{ fontWeight: 600, color: '#1e40af', marginBottom: 8, display: 'block' }}>Image Upload:</label>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: 6, borderRadius: 6, backgroundColor: uploadMethod === 'local' ? '#dbeafe' : 'transparent' }}>
                    <input type="radio" name="uploadMethod" value="local" checked={uploadMethod === 'local'} onChange={(e) => setUploadMethod(e.target.value)} style={{ margin: 0 }} />
                    <span>Local File</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: 6, borderRadius: 6, backgroundColor: uploadMethod === 'url' ? '#dbeafe' : 'transparent' }}>
                    <input type="radio" name="uploadMethod" value="url" checked={uploadMethod === 'url'} onChange={(e) => setUploadMethod(e.target.value)} style={{ margin: 0 }} />
                    <span>Web URL</span>
                  </label>
                </div>
                {uploadMethod === 'local' && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ width: '100%', padding: 10, borderRadius: 6, border: '1.5px solid #bfc8e0', background: '#f8fafc' }}
                    />
                    {imagePreview && (
                      <div style={{ marginTop: 12 }}>
                        <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <button onClick={removeImage} style={{ marginTop: 8, padding: '4px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Remove</button>
                      </div>
                    )}
                  </div>
                )}
                {uploadMethod === 'url' && (
                  <div>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      style={{ width: '100%', padding: 10, borderRadius: 6, border: '1.5px solid #bfc8e0', background: '#f8fafc' }}
                    />
                    {imageUrl && (
                      <div style={{ marginTop: 12 }}>
                        <img src={imageUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} onError={(e) => e.target.style.display = 'none'} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
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
            {(localType === "single" || localType === "multiple") && localOptions.length > 0 && (
              <label style={{ fontWeight: 600, color: '#333', marginBottom: 2, textAlign: 'left' }}>Correct Answer
                <select 
                  value={localAnswer} 
                  onChange={e => setLocalAnswer(e.target.value)} 
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #bfc8e0', fontSize: '1em', background: '#f8fafc', color: '#1a237e', marginTop: 4 }}
                >
                  <option value="">Select Correct Answer</option>
                  {localOptions.map((opt, idx) => (
                    <option key={idx} value={String.fromCharCode(65 + idx)}>
                      {String.fromCharCode(65 + idx)}. {opt}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {(localType === "text" || localType === "numeric") && (
              <label style={{ fontWeight: 600, color: '#333', marginBottom: 2, textAlign: 'left' }}>Answer
                <textarea value={localAnswer} onChange={e => setLocalAnswer(e.target.value)} rows={2} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #bfc8e0', fontSize: '1em', background: '#f8fafc', color: '#1a237e', marginTop: 4, resize: 'vertical' }} placeholder="Enter answer..." />
              </label>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, marginTop: 22 }}>
            <button onClick={() => setShowAddPopup(false)} style={{ background: '#eee', color: '#333', borderRadius: 8, padding: '10px 24px', fontWeight: 600, fontSize: '1em', border: 'none', boxShadow: '0 2px 8px rgba(60,60,120,0.06)', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleLocalAddQuestion} style={{ background: 'linear-gradient(90deg, #667eea 60%, #764ba2 100%)', color: '#fff', borderRadius: 8, padding: '10px 28px', fontWeight: 700, fontSize: '1.08em', border: 'none', boxShadow: '0 2px 8px rgba(102, 126, 234, 0.13)', cursor: 'pointer', transition: 'background 0.2s' }}>Add</button>
          </div>
        </div>
      </div>
    );
  };

  // Show all classes from database
  const filteredClasses = classes;

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
          {filteredClasses.map(cls => (
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
{subjects.length > 0 && ( subjectViewMode === "grid" ? (

  // 🔵 GRID VIEW
  <div className="questions-subject-tabs-grid">
    {subjects.map((sub, idx) => (
      <React.Fragment key={sub._id}>
        <button
          className={
            "questions-subject-tab" +
            (activeTab === sub._id ? " active" : "")
          }
          onClick={() => handleSubjectClick(sub)}
          style={{ marginBottom: 12 }}
        >
          {sub.valueName}
        </button>

        {(idx % 2 === 1) && <div style={{ width: "100%" }}></div>}
      </React.Fragment>
    ))}
  </div>

) : (

  // 🔵 DROPDOWN VIEW
  <div style={{ marginBottom: 20,fontSize:'20px' }}>
    <label style={{ marginRight: 10, fontWeight: 600, color:'#ffff' }}>
      Subject:
    </label>

    <select
      value={activeTab}
      onChange={(e) => {
        const selected = subjects.find(
          sub => sub._id === e.target.value
        );
        if (selected) {
          handleSubjectClick(selected);
        }
      }}
      style={{
        padding: 8,
        borderRadius: 6,
        border: "1px solid #ccc",
        fontSize:'15px'
      }}
    >
      {subjects.map(sub => (
        <option key={sub._id} value={sub._id}>
          {sub.valueName}
        </option>
      ))}
    </select>

    <button
      onClick={() => setSubjectViewMode("grid")}
      style={{
        marginLeft: 15,
        padding: "6px 12px",
        borderRadius: 6,
        border: "none",
        background: "#ddd",
        fontSize:'15px',
        cursor: "pointer"
      }}
    >
      Change Subject
    </button>
  </div>
)
)}

      {/* Show topics for the selected subject tab */}
      {activeTab && (
        <TopicsSection subjectId={activeTab} topics={topics} />
      )}
      

      {showAddPopup && <AddQuestionPopup />}
      {showPasskeyPopup && (
  <PasskeyPopup
    pendingSubject={pendingSubject}
    enteredPasskey={enteredPasskey}
    setEnteredPasskey={setEnteredPasskey}
    passkeyError={passkeyError}
    onClose={() => setShowPasskeyPopup(false)}
    onVerify={verifyPasskey}
  />
)}

      <div style={{ marginTop: 24 }}>
        {questions.length === 0 ? (
          <div className="questions-no-data">No questions found for this class and subject.</div>
        ) : (
          <div>
            {Object.entries(questionsByTopic).map(([topicId, topicQuestions]) => (
              <div key={topicId} style={{ marginBottom: 16 }}>
                <div 
                  onClick={() => toggleTopic(topicId)}
                  style={{ 
                    background: '#05165b', 
                    color: 'white', 
                    padding: '12px 16px', 
                    borderRadius: 8, 
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: 600
                  }}
                >
                  <span>{topicId === 'uncategorized' ? 'Uncategorized' : getTopicName(topicId)}</span>
                  <span>{expandedTopics[topicId] ? '▼' : '▶'} ({topicQuestions.length})</span>
                </div>
                {expandedTopics[topicId] && (
                  <table className="questions-table" style={{ marginTop: 8,backgroundColor:'#67cdf9' }}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Question</th>
                        <th>Type</th>
                        <th>Answer</th>
                        <th>Mark</th>
                        <th>Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topicQuestions.map((q) => (
                        <tr key={q._id}>
                          <td>{formatId(q._id)}</td>
                          <td>{q.text}</td>
                          <td>{q.type}</td>
                          <td>{q.answer}</td>
                          <td>{q.marks}</td>
                          <td>
                            <button onClick={() => handleDelete(q._id)} style={{background:'#fa0303',fontSize:16,padding:8,borderRadius:5,border:'none',color:'white'}}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

