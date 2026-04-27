import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { showToast } from './Toast';
import { API_ENDPOINTS } from './api';
import StudentChatbot from './StudentChatbot';

function StudentDashboard({ name, studentData, onProjectTitleClick, onLogout }) {
  const normalizeId = (id) => {
    if (!id) return "";
    if (typeof id === 'string') return id;
    if (id.$oid) return id.$oid;
    return String(id);
  };

  const rollNumber = studentData?.rollNumber || '';
  const dateOfBirth = studentData?.dateOfBirth || '';
  const className = studentData?.className || studentData?.classId?.valueName || '';
  const boardName = studentData?.boardName || studentData?.boardId?.valueName || '';
  const classId = normalizeId(studentData?.classId) || '';
  const studentId = normalizeId(studentData?._id);

  const [activeTab, setActiveTab] = useState('home');
  const [subjects, setSubjects] = useState([]);
  const [subjectsWithQuestions, setSubjectsWithQuestions] = useState({});
  const [loading, setLoading] = useState(true);


  const [selectedTestSubject, setSelectedTestSubject] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [testPapers, setTestPapers] = useState([]);
  const [loadingPapers, setLoadingPapers] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [showPaperPreview, setShowPaperPreview] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRecord, setReviewRecord] = useState(null);

  const [testRecords, setTestRecords] = useState([]);
  const [testSummary, setTestSummary] = useState({ available: 0, completed: 0, notCompleted: 0 });
  const [loadingResults, setLoadingResults] = useState(false);
  const [loadingTestCard, setLoadingTestCard] = useState(true);
  const [loadingTestSummary, setLoadingTestSummary] = useState(true);
  const [attemptedPapers, setAttemptedPapers] = useState({}); // Track which papers have been attempted

  const [activeTest, setActiveTest] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [textAnswers, setTextAnswers] = useState({});
  const [numericAnswers, setNumericAnswers] = useState({});
  const [imageFiles, setImageFiles] = useState({});
  const [testTimeLeft, setTestTimeLeft] = useState(0);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testSubmitting, setTestSubmitting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showTestStartReminder, setShowTestStartReminder] = useState(false);

  // Voice recording states
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const recognitionRef = useRef(null);
  const [showExitWarning, setShowExitWarning] = useState(false);

  // Query management state
  const [queries, setQueries] = useState([]);
  const [loadingQueries, setLoadingQueries] = useState(false);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [newQuery, setNewQuery] = useState({ subject: '', message: '' });
  const [submittingQuery, setSubmittingQuery] = useState(false);

  // Feedback management state
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [newFeedback, setNewFeedback] = useState({ category: '', rating: 5, message: '' });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

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

  // Detect fullscreen exit during test and show warning popup
  useEffect(() => {
    if (!activeTest || testSubmitted) return;
    
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        // User exited fullscreen - show warning popup
        setShowExitWarning(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [activeTest, testSubmitted]);

  // Function to return to fullscreen
  const returnToFullscreen = async () => {
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
    setShowExitWarning(false);
  };

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
      const permitsRes = await fetch("https://qms-sjuv.onrender.com/api/question-paper-permits");
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

      const checkRes = await fetch(`https://qms-sjuv.onrender.com/api/test-records/check/${studentId}/${paper._id}`);
      const checkData = await checkRes.json();
      
      if (checkData.hasAttempted) {
        showToast('You have already attempted this test. You cannot attempt it again.', 'error');
        return;
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

  const handleImageChange = (questionIndex, file) => {
    if (file && file.size > 4 * 1024 * 1024) {
      showToast('Image must be less than 4MB', 'error');
      return;
    }
    if (file && !file.type.startsWith('image/')) {
      showToast('Please select an image file only', 'error');
      return;
    }
    setImageFiles(prev => ({
      ...prev,
      [questionIndex]: file
    }));
  };

  const removeImage = (questionIndex) => {
    setImageFiles(prev => ({
      ...prev,
      [questionIndex]: null
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
        
        // Determine the correct answer index based on answer type
        if (question.type === 'text' || question.type === 'numeric') {
          // For text/numeric questions, compare the actual text
          const studentAnswer = textAnswers[index] || numericAnswers[index] || '';
          const isCorrect = studentAnswer.toString().trim().toLowerCase() === correctAnswer.toString().trim().toLowerCase();
          if (isCorrect) {
            score += question.marks || 1;
            correctAnswers++;
          }
          answers.push({
            questionText: question.text,
            options: question.options || [],
            selectedAnswer: studentAnswer,
            correctAnswer: correctAnswer,
            isCorrect: isCorrect,
            marks: question.marks || 1
          });
          return; // Skip the rest for text/numeric questions
        }
        
        // For single/multiple choice questions
        // First check if answer is a valid letter (A, B, C, D)
        let isLetterAnswer = false;
        if (typeof correctAnswer === 'string') {
          const answerChar = correctAnswer.toUpperCase().trim();
          // Check if it's a valid single letter A-Z
          if (answerChar.length === 1 && answerChar >= 'A' && answerChar <= 'Z') {
            isLetterAnswer = true;
            correctAnswerIndex = answerChar.charCodeAt(0) - 65;
          }
        }
        
        // If answer is NOT a letter code, it means the answer is stored as actual option text
        // We need to find which option matches the correct answer
        if (!isLetterAnswer && question.options && question.options.length > 0) {
          // Find the index of the option that matches the correct answer
          correctAnswerIndex = question.options.findIndex(opt => 
            opt.toString().trim().toLowerCase() === correctAnswer.toString().trim().toLowerCase()
          );
        }
        
        // Validate that the correct answer index is within valid range
        const maxOptionIndex = (question.options?.length || 4) - 1;
        if (correctAnswerIndex < 0 || correctAnswerIndex > maxOptionIndex) {
          // Invalid answer - mark as incorrect
          correctAnswerIndex = -1;
        }
        
        const isCorrect = selectedOptionIndex === correctAnswerIndex;
        if (isCorrect) {
          score += question.marks || 1;
          correctAnswers++;
        }
        
        // Store the selected answer as letter (A, B, C, D) for proper display in review
        // Or as the actual option text if comparing by text
        let selectedAnswerDisplay;
        if (selectedOptionIndex !== undefined && selectedOptionIndex >= 0) {
          if (isLetterAnswer) {
            selectedAnswerDisplay = String.fromCharCode(65 + selectedOptionIndex);
          } else if (question.options && question.options[selectedOptionIndex]) {
            selectedAnswerDisplay = question.options[selectedOptionIndex];
          } else {
            selectedAnswerDisplay = String(selectedOptionIndex);
          }
        } else {
          selectedAnswerDisplay = '';
        }
        
        // Store the correct answer as the letter (A, B, C, D) or as the actual option text
        let correctAnswerDisplay;
        if (correctAnswerIndex >= 0) {
          if (isLetterAnswer) {
            correctAnswerDisplay = String.fromCharCode(65 + correctAnswerIndex);
          } else if (question.options && question.options[correctAnswerIndex]) {
            correctAnswerDisplay = question.options[correctAnswerIndex];
          } else {
            correctAnswerDisplay = String(correctAnswerIndex);
          }
        } else {
          correctAnswerDisplay = correctAnswer;
        }
        
        answers.push({
          questionText: question.text,
          options: question.options || [],
          selectedAnswer: selectedAnswerDisplay,
          correctAnswer: correctAnswerDisplay,
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

      const hasImages = Object.values(imageFiles).some(file => file !== null && file !== undefined);
      let response;
      if (hasImages) {
        // FormData for image submission
        const formData = new FormData();
        formData.append('studentId', studentId);
        formData.append('questionPaperId', activeTest.paper._id);
        formData.append('score', score);
        formData.append('totalQuestions', questions.length);
        formData.append('correctAnswers', correctAnswers);
        formData.append('subjectName', activeTest.paper.subject);
        formData.append('answersData', JSON.stringify(answers));
        
        // Append image files
        Object.entries(imageFiles).forEach(([qIndex, file]) => {
          if (file) {
            formData.append(`answerImage_${qIndex}`, file);
          }
        });
        
        response = await fetch('https://qms-sjuv.onrender.com/api/test-records', {
          method: 'POST',
          body: formData
        });
      } else {
        // JSON for regular submission
        response = await fetch('https://qms-sjuv.onrender.com/api/test-records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: studentId,
            questionPaperId: activeTest.paper._id,
            score: score,
            totalQuestions: questions.length,
            correctAnswers: correctAnswers,
            subjectName: activeTest.paper.subject,
            answers: answers
          })
        });
      }

      if (response.ok) {
        setTestResult(result);
        setTestSubmitted(true);
        const recordsRes = await fetch(`https://qms-sjuv.onrender.com/api/test-records/${studentId}`);
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
    setIsVoiceRecording(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Speech Recognition setup
  const setupSpeechRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      showToast('Speech recognition not supported in this browser. Please use Chrome/Edge.', 'warning');
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsVoiceRecording(true);
      console.log('Voice recording started');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const currentIdx = currentQuestionIndex;
      setTextAnswers(prev => ({
        ...prev,
        [currentIdx]: (prev[currentIdx] || '') + ' ' + transcript
      }));
      showToast(`Transcribed: "${transcript}"`, 'success');
      console.log('Transcribed:', transcript);
    };

    recognition.onerror = (event) => {
      setIsVoiceRecording(false);
      let errorMsg = 'Speech recognition error';
      if (event.error === 'not-allowed') {
        errorMsg = 'Microphone permission denied';
      } else if (event.error === 'no-speech') {
        errorMsg = 'No speech detected';
      }
      showToast(errorMsg, 'error');
      console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
      setIsVoiceRecording(false);
      console.log('Voice recording ended');
    };

    recognitionRef.current = recognition;
    return recognition;
  }, [currentQuestionIndex]);

  // Toggle voice input
  const toggleVoiceInput = useCallback(() => {
    if (isVoiceRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    const recognition = setupSpeechRecognition();
    if (recognition) {
      recognition.start();
    }
  }, [isVoiceRecording, setupSpeechRecognition]);

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

  useEffect(() => {
    if (!classId) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        const attrsRes = await fetch("https://qms-sjuv.onrender.com/api/attributes");
        const attrs = await attrsRes.json();
        const subjectAttr = attrs.find(a => a.name && a.name.toLowerCase() === "subject");
        if (!subjectAttr) {
          setLoading(false);
          return;
        }
        const subjectsRes = await fetch(`https://qms-sjuv.onrender.com/api/values/${subjectAttr._id}`);
        const subjectsData = await subjectsRes.json();
        const classIdStr = normalizeId(classId);
        const filteredSubjects = subjectsData.filter(s => {
          const sClassId = normalizeId(s.classId);
          return sClassId === classIdStr && s.status === 'Active';
        });
        setSubjects(filteredSubjects);

        const questionsRes = await fetch("https://qms-sjuv.onrender.com/api/questions");
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

  // Fetch test records for TestCard on component mount
  useEffect(() => {
    if (!studentId) {
      setLoadingTestCard(false);
      setLoadingTestSummary(false);
      return;
    }
    
    // Fetch test summary for TestCard (lightweight counts)
    const fetchTestSummary = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.TEST_SUMMARY(studentId));
        if (response.ok) {
          const data = await response.json();
          setTestSummary({
            available: data.total || 0,
            completed: data.completed || 0,
            notCompleted: data.pending || 0
          });
        } else {
          console.error('Test summary API error:', response.status, await response.text());
        }
      } catch (err) {
        console.error("Error fetching test summary:", err);
      }
      setLoadingTestSummary(false);
    };
    
    // Keep existing test records fetch for detailed list
    const fetchTestCardData = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.TEST_RECORDS(studentId));
        if (response.ok) {
          const data = await response.json();
          setTestRecords(data);
        } else {
          console.error('Test records API error:', response.status, await response.text());
        }
      } catch (err) {
        console.error("Error fetching test card records:", err);
      }
      setLoadingTestCard(false);
    };
    
    fetchTestSummary();
    fetchTestCardData();
  }, [studentId]);

  useEffect(() => {
    if (activeTab === 'mytest' && studentId) {
      const fetchRecords = async () => {
        try {
          const response = await fetch(`https://qms-sjuv.onrender.com/api/test-records/${studentId}`);
          if (response.ok) {
            const data = await response.json();
            setTestRecords(data);
            // Build attempted papers map
            const attempted = {};
            data.forEach(record => {
              const paperId = normalizeId(record.questionPaperId);
              attempted[paperId] = true;
            });
            setAttemptedPapers(attempted);
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
        const papersRes = await fetch("https://qms-sjuv.onrender.com/api/question-papers");
        const papers = await papersRes.json();
        const permitsRes = await fetch("https://qms-sjuv.onrender.com/api/question-paper-permits");
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
        const response = await fetch(`https://qms-sjuv.onrender.com/api/test-records/${studentId}`);
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

  // Fetch queries when queries tab is active
  useEffect(() => {
    if (activeTab !== 'queries' || !studentId) return;
    
    const fetchQueries = async () => {
      setLoadingQueries(true);
      try {
        const response = await fetch(`https://qms-sjuv.onrender.com/api/queries/student/${studentId}`);
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
  }, [activeTab, studentId]);

  // Fetch feedback when feedback tab is active
  useEffect(() => {
    if (activeTab !== 'feedback' || !studentId) return;
    
    const fetchFeedback = async () => {
      setLoadingFeedbacks(true);
      try {
        const response = await fetch(`https://qms-sjuv.onrender.com/api/feedback/student/${studentId}`);
        if (response.ok) {
          const data = await response.json();
          setFeedbacks(data);
        }
      } catch (err) {
        console.error('Error fetching feedback:', err);
      }
      setLoadingFeedbacks(false);
    };
    
    fetchFeedback();
  }, [activeTab, studentId]);

  // Submit a new feedback
  const handleSubmitQuery = async () => {
    if (!newQuery.message.trim()) {
      showToast('Please enter your query message', 'warning');
      return;
    }
    
    setSubmittingQuery(true);
    try {
      const response = await fetch('https://qms-sjuv.onrender.com/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          studentName: name,
          rollNumber,
          subject: newQuery.subject,
          message: newQuery.message
        })
      });
      
      if (response.ok) {
        showToast('Query submitted successfully!', 'success');
        setShowQueryModal(false);
        setNewQuery({ subject: '', message: '' });
        // Refresh queries list
        const queriesRes = await fetch(`https://qms-sjuv.onrender.com/api/queries/student/${studentId}`);
        if (queriesRes.ok) {
          const data = await queriesRes.json();
          setQueries(data);
        }
      } else {
        showToast('Failed to submit query. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Error submitting query:', err);
      showToast('Error connecting to server.', 'error');
    }
    setSubmittingQuery(false);
  };

  // Render Queries Tab
  const renderQueriesTab = () => {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, color: '#333' }}>My Queries</h2>
          <button 
            className="cta-button" 
            onClick={() => setShowQueryModal(true)}
            style={{ padding: '10px 20px' }}
          >
            + Submit New Query
          </button>
        </div>
        
        {loadingQueries ? (
          <p style={{ textAlign: 'center', padding: 40, color: '#666' }}>Loading queries...</p>
        ) : queries.length === 0 ? (
          <div style={{ 
            background: '#fff', 
            borderRadius: 12, 
            padding: 40, 
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <p style={{ fontSize: '1.1em', color: '#888', marginBottom: 8 }}>You haven't submitted any queries yet.</p>
            <p style={{ color: '#666' }}>Click "Submit New Query" to ask a question to the admin.</p>
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
                  <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#444' }}>Your Message:</p>
                  <p style={{ margin: 0, color: '#666', lineHeight: 1.5 }}>{query.message}</p>
                </div>
                
                {query.adminResponse && (
                  <div style={{ 
                    background: '#e8f5e9', 
                    borderRadius: 8, 
                    padding: 16
                  }}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#2e7d32' }}>Admin Response:</p>
                    <p style={{ margin: 0, color: '#333', lineHeight: 1.5 }}>{query.adminResponse}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderProfileTab = () => {
    return (
      <div style={{ padding: '20px' }}>
        <h2 style={{ marginBottom: 24, color: '#333' }}>My Profile</h2>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', maxWidth: 600 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: '#667eea', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '2em', fontWeight: 700 }}>
              {name ? name.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px 0', color: '#333' }}>{name || 'Student'}</h3>
              <p style={{ margin: 0, color: '#666', fontSize: '0.9em' }}>{rollNumber || 'No Roll Number'}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #eee' }}>
              <span style={{ color: '#666', fontWeight: 500 }}>Full Name</span>
              <span style={{ color: '#333', fontWeight: 600 }}>{name || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #eee' }}>
              <span style={{ color: '#666', fontWeight: 500 }}>Roll Number</span>
              <span style={{ color: '#333', fontWeight: 600 }}>{rollNumber || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #eee' }}>
              <span style={{ color: '#666', fontWeight: 500 }}>Date of Birth</span>
              <span style={{ color: '#333', fontWeight: 600 }}>{dateOfBirth || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #eee' }}>
              <span style={{ color: '#666', fontWeight: 500 }}>Class</span>
              <span style={{ color: '#333', fontWeight: 600 }}>{className || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #eee' }}>
              <span style={{ color: '#666', fontWeight: 500 }}>Board</span>
              <span style={{ color: '#333', fontWeight: 600 }}>{boardName || '-'}</span>
            </div>
          </div>
          <button
            onClick={() => setShowProfile(true)}
            style={{ marginTop: 24, padding: '12px 24px', borderRadius: 6, border: 'none', backgroundColor: '#667eea', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '1em' }}
          >
            Edit Profile
          </button>
        </div>
      </div>
    );
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      const response = await fetch(`https://qms-sjuv.onrender.com/api/students/${studentId}`, {
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

  // Function to handle review button click - fetches detailed answers if not present
  const handleReviewClick = async (record) => {
    try {
      // First check if answers already exist in the record
      if (record.answers && record.answers.length > 0) {
        setReviewRecord(record);
        setShowReviewModal(true);
        return;
      }
      
      // If answers don't exist, fetch detailed record from API
      const response = await fetch(`https://qms-sjuv.onrender.com/api/test-records/detail/${record._id}`);
      if (response.ok) {
        const detailedRecord = await response.json();
        setReviewRecord(detailedRecord);
      } else {
        // Fallback to original record if API fails
        setReviewRecord(record);
      }
    } catch (err) {
      console.error("Error fetching detailed record:", err);
      setReviewRecord(record);
    }
    setShowReviewModal(true);
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
                    <button className="cta-button" style={{ padding: '6px 12px', fontSize: '0.8em', marginTop: 4 }} onClick={() => handleReviewClick(record)}>Review</button>
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
              {testPapers.map(paper => {
                const paperId = normalizeId(paper._id);
                const isAttempted = attemptedPapers[paperId];
                return (
                <div key={paper._id} style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, background: isAttempted ? '#f5f5f5' : '#f9f9f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', color: '#1976d2' }}>{paper.subject} - {paper.class} {isAttempted && <span style={{ fontSize: '0.8em', color: '#f44336', fontWeight: 600 }}>(Attempted)</span>}</h4>
                    <p style={{ margin: '4px 0', fontSize: '0.9em' }}><strong>Difficulty:</strong> {paper.difficulty} | <strong> Questions:</strong> {paper.totalQuestions} | <strong> Marks:</strong> {paper.totalMarks}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      className="cta-button" 
                      onClick={() => startTest(paper)} 
                      style={{ padding: '8px 16px', fontSize: '0.9em', background: isAttempted ? '#9e9e9e' : '#4caf50', cursor: isAttempted ? 'not-allowed' : 'pointer' }}
                      disabled={isAttempted}
                    >
                      {isAttempted ? 'Attempted' : 'Start Test'}
                    </button>
                  </div>
                </div>
              )})}
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
            
            {/* Feedback Section in Main Panel */}
            <div className="feedback-section" style={{borderStyle:'double',borderWidth:'7px',borderRadius:'10px',borderColor:'#550f86',marginTop:'30px',padding:'20px'}}>
              <h3 style={{marginBottom:'35px'}}>Feedback</h3>
              <div className="feedback-card">
                <p>
                  We value your feedback! Let us know about your experience with the quiz system, any issues you face, or suggestions for improvement.
                </p>
                <button 
                  className="cta-button" 
                  onClick={() => setShowFeedbackModal(true)}
                >
                  + Submit Feedback
                </button>
              </div>
            </div>
          </div>
          <div className="dashboard-side-panel">
            {/* Performance Section */}
            {testRecords.length > 0 && (() => {
              // Calculate subject-wise performance
              const subjectPerformance = {};
              testRecords.forEach(record => {
                const subjectName = record.subjectName || 'Unknown';
                if (!subjectPerformance[subjectName]) {
                  subjectPerformance[subjectName] = { totalScore: 0, totalQuestions: 0, attempts: 0 };
                }
                subjectPerformance[subjectName].totalScore += record.score || 0;
                subjectPerformance[subjectName].totalQuestions += record.totalQuestions || 1;
                subjectPerformance[subjectName].attempts += 1;
              });
              
              const subjectsData = Object.entries(subjectPerformance).map(([name, data]) => ({
                name,
                percentage: data.totalQuestions > 0 ? (data.totalScore / data.totalQuestions) * 100 : 0,
                attempts: data.attempts
              }));
              
              const averageScore = subjectsData.length > 0 
                ? (subjectsData.reduce((sum, s) => sum + s.percentage, 0) / subjectsData.length).toFixed(1)
                : 0;
              
              const bestSubjects = subjectsData.filter(s => s.percentage >= 70);
              
              return (
                <div className='performance-container' style={{background: '#f7f7f8', padding: '20px', marginBottom: 20, borderRadius: 5, border: '1px solid #e0e0e0'}}>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', borderBottom: '1px solid #ddd', paddingBottom: '10px', color: '#333' }}>
                    📊 Performance
                  </h3>
                  
                  {/* Average Score */}
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>Average Score</span>
                      <span style={{ 
                        fontSize: '28px', 
                        fontWeight: 700, 
                        color: averageScore >= 70 ? '#4caf50' : averageScore >= 50 ? '#ff9800' : '#f44336'
                      }}>
                        {averageScore}%
                      </span>
                    </div>
                    {/* Overall Progress Bar */}
                    <div style={{ 
                      width: '100%', 
                      height: '10px', 
                      backgroundColor: '#e0e0e0', 
                      borderRadius: '5px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${averageScore}%`, 
                        height: '100%', 
                        backgroundColor: averageScore >= 70 ? '#4caf50' : averageScore >= 50 ? '#ff9800' : '#f44336',
                        borderRadius: '5px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>

                  {/* Subject-wise Percentage Bars */}
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', color: '#666', fontWeight: 500, display: 'block', marginBottom: '10px' }}>
                      Subject Scores
                    </span>
                    {subjectsData.map((subject, index) => (
                      <div key={index} style={{ marginBottom: '12px' }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: '4px'
                        }}>
                          <span style={{ 
                            fontSize: '13px', 
                            fontWeight: subject.percentage >= 70 ? 600 : 400,
                            maxWidth: '80px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: '#333'
                          }} title={subject.name}>
                            {subject.name}
                          </span>
                          <span style={{ 
                            fontSize: '13px', 
                            fontWeight: 600,
                            color: subject.percentage >= 70 ? '#4caf50' : subject.percentage >= 50 ? '#ff9800' : '#f44336'
                          }}>
                            {subject.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div style={{ 
                          width: '100%', 
                          height: '8px', 
                          backgroundColor: '#e0e0e0', 
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            width: `${subject.percentage}%`, 
                            height: '100%', 
                            backgroundColor: subject.percentage >= 70 ? '#4caf50' : subject.percentage >= 50 ? '#ff9800' : '#f44336',
                            borderRadius: '4px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Best Subjects Badge */}
                  {bestSubjects.length > 0 && (
                    <div style={{ 
                      padding: '12px', 
                      backgroundColor: '#e8f5e9', 
                      borderRadius: '8px',
                      border: '1px solid #4caf50'
                    }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px', color: '#2e7d32' }}>
                        🏆 Best Performers
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {bestSubjects.map((subject, index) => (
                          <span key={index} style={{ 
                            fontSize: '12px', 
                            backgroundColor: '#4caf50', 
                            color: '#fff', 
                            padding: '4px 10px', 
                            borderRadius: '12px',
                            fontWeight: 500
                          }}>
                            {subject.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            
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
              {(loadingTestSummary || loadingTestCard) ? (
                <p style={{ textAlign: 'center', padding: '10px', color: '#666' }}>Loading...</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 15 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#e3f2fd', borderRadius: 8, borderLeft: '4px solid #2196f3' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1565c0' }}>Total</span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: '#1976d2' }}>{testSummary.available}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#e8f5e9', borderRadius: 8, borderLeft: '4px solid #4caf50' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1b5e20' }}>Completed</span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: '#2e7d32' }}>{testSummary.completed}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#fff3e0', borderRadius: 8, borderLeft: '4px solid #ff9800' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#bf360c' }}>Pending</span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: '#e65100' }}>{testSummary.notCompleted}</span>
                  </div>
                </div>
              )}
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
<li className="navbar-menu-item" style={{ cursor: 'pointer', fontWeight: activeTab === 'queries' ? 700 : 400 }} onClick={() => handleNavClick('queries')}>Queries</li>
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

      {/* Query Submission Modal */}
      {showQueryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '90%', maxWidth: 500, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: '#333' }}>Submit a Query</h2>
              <button onClick={() => { setShowQueryModal(false); setNewQuery({ subject: '', message: '' }); }} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#666' }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#444' }}>Subject / Category</label>
                <select value={newQuery.subject} onChange={(e) => setNewQuery({ ...newQuery, subject: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}>
                  <option value="">Select a category</option>
                  <option value="General">General Inquiry</option>
                  <option value="Test Related">Test Related</option>
                  <option value="Question Related">Question Related</option>
                  <option value="Technical Issue">Technical Issue</option>
                  <option value="Account">Account</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#444' }}>Your Message</label>
                <textarea value={newQuery.message} onChange={(e) => setNewQuery({ ...newQuery, message: e.target.value })} placeholder="Describe your query in detail..." rows={5} style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button onClick={() => { setShowQueryModal(false); setNewQuery({ subject: '', message: '' }); }} style={{ flex: 1, padding: '12px', borderRadius: 6, border: '1px solid #ddd', backgroundColor: '#fff', color: '#666', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleSubmitQuery} disabled={submittingQuery} style={{ flex: 1, padding: '12px', borderRadius: 6, border: 'none', backgroundColor: submittingQuery ? '#9e9e9e' : '#667eea', color: '#fff', fontWeight: 600, cursor: submittingQuery ? 'not-allowed' : 'pointer' }}>{submittingQuery ? 'Submitting...' : 'Submit Query'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Submission Modal */}
      {showFeedbackModal && (
        <div className="enhanced-modal-overlay">
          <div className="enhanced-modal">
            <div className="enhanced-modal-header">
              <h2>Submit Feedback</h2>
              <button className="enhanced-modal-close" onClick={() => { setShowFeedbackModal(false); setNewFeedback({ category: '', rating: 5, message: '' }); }}>×</button>
            </div>
            <div>
              <div className="enhanced-form-group">
                <label>Category</label>
                <select value={newFeedback.category} onChange={(e) => setNewFeedback({ ...newFeedback, category: e.target.value })}>
                  <option value="">Select a category</option>
                  <option value="General">General Feedback</option>
                  <option value="Bug Report">Bug Report</option>
                  <option value="Suggestion">Suggestion</option>
                  <option value="Compliment">Compliment</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="enhanced-form-group">
                <label>Rating</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      className={newFeedback.rating >= rating ? 'active' : ''}
                      onClick={() => setNewFeedback({ ...newFeedback, rating })}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>
              <div className="enhanced-form-group">
                <label>Your Feedback</label>
                <textarea value={newFeedback.message} onChange={(e) => setNewFeedback({ ...newFeedback, message: e.target.value })} placeholder="Share your thoughts with us..." rows={5} />
              </div>
              <div className="enhanced-modal-actions">
                <button className="enhanced-btn enhanced-btn-secondary" onClick={() => { setShowFeedbackModal(false); setNewFeedback({ category: '', rating: 5, message: '' }); }}>Cancel</button>
                <button className="enhanced-btn enhanced-btn-primary" onClick={async () => {
                  if (!newFeedback.message.trim()) {
                    showToast('Please enter your feedback', 'warning');
                    return;
                  }
                  setSubmittingFeedback(true);
                  try {
                    const response = await fetch('https://qms-sjuv.onrender.com/api/feedback', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        studentId,
                        studentName: name,
                        category: newFeedback.category || 'General',
                        rating: newFeedback.rating,
                        message: newFeedback.message
                      })
                    });
                    if (response.ok) {
                      showToast('Feedback submitted successfully!', 'success');
                      setShowFeedbackModal(false);
                      setNewFeedback({ category: '', rating: 5, message: '' });
                    } else {
                      showToast('Failed to submit feedback. Please try again.', 'error');
                    }
                  } catch (err) {
                    console.error('Error submitting feedback:', err);
                    showToast('Error connecting to server.', 'error');
                  }
                  setSubmittingFeedback(false);
                }} disabled={submittingFeedback}>{submittingFeedback ? 'Submitting...' : 'Submit Feedback'}</button>
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

        {activeTab === 'queries' && renderQueriesTab()}
        {activeTab === 'profile' && renderProfileTab()}
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
              {attemptedPapers[normalizeId(selectedPaper._id)] ? (
                <button disabled style={{ padding: '12px 24px', borderRadius: 6, border: 'none', backgroundColor: '#9e9e9e', color: '#fff', fontWeight: 600, cursor: 'not-allowed' }}>Already Attempted</button>
              ) : (
                <button onClick={() => startTest(selectedPaper)} style={{ padding: '12px 24px', borderRadius: 6, border: 'none', backgroundColor: '#1976d2', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Start Test</button>
              )}
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
              <span style={{ color: '#666' }}>{(() => {
                const answeredCount = Object.keys(selectedAnswers).length + 
                  Object.keys(textAnswers).filter(k => textAnswers[k] && textAnswers[k] !== '').length +
                  Object.keys(numericAnswers).filter(k => numericAnswers[k] !== undefined && numericAnswers[k] !== '').length;
                return answeredCount;
              })()} answered</span>
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
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 12 }}>
                        <textarea 
                          value={textAnswers[currentQuestionIndex] || ''} 
                          onChange={(e) => handleTextAnswerChange(currentQuestionIndex, e.target.value)} 
                          placeholder="Type your answer here or use 🎤 microphone..." 
                          rows={4} 
                          style={{ 
                            flex: 1, 
                            padding: '14px 16px', 
                            borderRadius: 8, 
                            border: '2px solid #e0e0e0', 
                            fontSize: '1em', 
                            fontFamily: 'inherit', 
                            resize: 'vertical', 
                            backgroundColor: '#fafafa', 
                            color: '#333' 
                          }} 
                        />
                        <button
                          onClick={toggleVoiceInput}
                          disabled={isVoiceRecording || !activeTest}
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: isVoiceRecording ? '#f44336' : '#4caf50',
                            color: 'white',
                            fontSize: '1.5em',
                            cursor: isVoiceRecording ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            transition: 'all 0.2s'
                          }}
                          title={isVoiceRecording ? 'Recording...' : 'Voice input'}
                        >
                          {isVoiceRecording ? '⏹️' : '🎤'}
                        </button>
                      </div>
                      {isVoiceRecording && (
                        <div style={{
                          padding: 8,
                          backgroundColor: '#ffebee',
                          borderRadius: 6,
                          textAlign: 'center',
                          fontWeight: 600,
                          color: '#c62828'
                        }}>
                          🔴 Recording... Speak now!
                        </div>
                      )}
                      <p style={{ marginTop: 8, fontSize: '0.85em', color: '#666' }}>
                        {textAnswers[currentQuestionIndex]?.length > 0 ? '✓ Answer entered (editable)' : 'Type or use voice input above'}
                      </p>

                      {/* Image Upload for text questions */}
                      <div style={{ marginTop: 16, padding: '16px', backgroundColor: '#f8f9fa', borderRadius: 8, border: '2px dashed #dee2e6' }}>
                        <label style={{ display: 'block', marginBottom: 12, fontWeight: 600, color: '#495057', fontSize: '0.95em' }}>
                          📷 Upload Supporting Image (<strong>4MB max</strong>)
                        </label>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleImageChange(currentQuestionIndex, e.target.files[0])}
                          style={{ width: '100%', padding: '12px', borderRadius: 6, border: '1px solid #ddd', backgroundColor: '#fff' }} 
                        />
                        {imageFiles[currentQuestionIndex] && (
                          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <img 
                              src={URL.createObjectURL(imageFiles[currentQuestionIndex])} 
                              alt="Preview" 
                              style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '2px solid #4caf50' }} 
                            />
                            <div>
                              <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: '#28a745' }}>✅ Image selected ({(imageFiles[currentQuestionIndex].size / 1024 / 1024).toFixed(1)} MB)</p>
                              <button 
                                onClick={() => removeImage(currentQuestionIndex)}
                                style={{ padding: '6px 12px', borderRadius: 4, border: 'none', backgroundColor: '#dc3545', color: '#fff', fontSize: '0.85em', cursor: 'pointer' }}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        )}
                        {!imageFiles[currentQuestionIndex] && (
                          <p style={{ marginTop: 8, fontSize: '0.85em', color: '#6c757d', fontStyle: 'italic' }}>Optional: Upload image/diagram to support your answer</p>
                        )}
                      </div>
                    </div>
                  ) : questionType === 'numeric' ? (
                    <div style={{ marginTop: 16 }}>
                      <input 
                        type={questionType === 'numeric' ? 'number' : 'text'} 
                        value={questionType === 'numeric' ? (numericAnswers[currentQuestionIndex] || '') : (textAnswers[currentQuestionIndex] || '')} 
                        onChange={(e) => questionType === 'numeric' ? 
                          handleNumericAnswerChange(currentQuestionIndex, e.target.value) : 
                          handleTextAnswerChange(currentQuestionIndex, e.target.value)
                        } 
                        placeholder={questionType === 'numeric' ? "Enter numeric answer" : "Type your answer here..."} 
                        style={{ width: '100%', padding: '14px 16px', borderRadius: 8, border: '2px solid #e0e0e0', fontSize: '1em', backgroundColor: '#fafafa', color: '#333' }} 
                      />
                      <p style={{ marginTop: 8, fontSize: '0.85em', color: '#666' }}>
                        {(questionType === 'numeric' ? (numericAnswers[currentQuestionIndex] !== undefined && numericAnswers[currentQuestionIndex] !== '') : 
                          (textAnswers[currentQuestionIndex] && textAnswers[currentQuestionIndex] !== '')) ? '✓ Answer entered' : 
                          `Please enter your ${questionType === 'numeric' ? 'number' : 'text'} answer`}
                      </p>

                      {/* Image Upload for text/numeric questions */}
                      <div style={{ marginTop: 16, padding: '16px', backgroundColor: '#f8f9fa', borderRadius: 8, border: '2px dashed #dee2e6' }}>
                        <label style={{ display: 'block', marginBottom: 12, fontWeight: 600, color: '#495057', fontSize: '0.95em' }}>
                          📷 Upload Supporting Image (<strong>4MB max</strong>)
                        </label>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleImageChange(currentQuestionIndex, e.target.files[0])}
                          style={{ width: '100%', padding: '12px', borderRadius: 6, border: '1px solid #ddd', backgroundColor: '#fff' }} 
                        />
                        {imageFiles[currentQuestionIndex] && (
                          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <img 
                              src={URL.createObjectURL(imageFiles[currentQuestionIndex])} 
                              alt="Preview" 
                              style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '2px solid #4caf50' }} 
                            />
                            <div>
                              <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: '#28a745' }}>✅ Image selected ({(imageFiles[currentQuestionIndex].size / 1024 / 1024).toFixed(1)} MB)</p>
                              <button 
                                onClick={() => removeImage(currentQuestionIndex)}
                                style={{ padding: '6px 12px', borderRadius: 4, border: 'none', backgroundColor: '#dc3545', color: '#fff', fontSize: '0.85em', cursor: 'pointer' }}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        )}
                        {!imageFiles[currentQuestionIndex] && (
                          <p style={{ marginTop: 8, fontSize: '0.85em', color: '#6c757d', fontStyle: 'italic' }}>Optional: Upload image/diagram to support your answer</p>
                        )}
                      </div>
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
                {activeTest.paper.questions?.map((_, idx) => {
                  // Check if any answer type exists for this question
                  const isAnswered = selectedAnswers[idx] !== undefined || 
                                    (textAnswers[idx] !== undefined && textAnswers[idx] !== '') ||
                                    (numericAnswers[idx] !== undefined && numericAnswers[idx] !== '');
                  return (
                    <button key={idx} onClick={() => setCurrentQuestionIndex(idx)} style={{ width: 40, height: 40, borderRadius: 8, border: `2px solid ${currentQuestionIndex === idx ? '#1976d2' : isAnswered ? '#4caf50' : '#e0e0e0'}`, backgroundColor: currentQuestionIndex === idx ? '#1976d2' : isAnswered ? '#e8f5e9' : '#fff', color: currentQuestionIndex === idx ? '#fff' : isAnswered ? '#2e7d32' : '#666', fontWeight: 600, cursor: 'pointer', fontSize: '0.9em' }}>{idx + 1}</button>
                  );
                })}
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

{showExitWarning && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3500 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, width: '90%', maxWidth: 480, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px', backgroundColor: '#f44336', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '2.5em', color: '#fff' }}>⛔</span></div>
            <h2 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '1.6em' }}>Do Not Exit!</h2>
            <div style={{ textAlign: 'left', backgroundColor: '#ffebee', borderRadius: 12, padding: 20, marginBottom: 24, borderLeft: '4px solid #f44336' }}>
              <p style={{ margin: '0 0 12px 0', color: '#333', fontSize: '1.05em', fontWeight: 600 }}>You are about to exit the test prematurely!</p>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#666', lineHeight: 1.8 }}><li>Your progress will be <strong>LOST</strong></li><li>You will need to start the test again</li><li>All answered questions will be discarded</li></ul>
            </div>
            <p style={{ margin: '0 0 24px 0', color: '#666', fontSize: '0.95em' }}>Please return to the test to complete it.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={returnToFullscreen} style={{ padding: '14px 28px', borderRadius: 8, border: 'none', backgroundColor: '#4caf50', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '1em' }}>Return to Test</button>
              <button onClick={() => { setShowExitWarning(false); closeTest(); }} style={{ padding: '14px 28px', borderRadius: 8, border: '1px solid #ddd', backgroundColor: '#fff', color: '#666', fontWeight: 600, cursor: 'pointer', fontSize: '1em' }}>I Still Want to Exit</button>
            </div>
          </div>
        </div>
      )}
      <StudentChatbot activeTab={activeTab} isTestActive={!!activeTest} />
    </div>
  );
}

export default StudentDashboard;



