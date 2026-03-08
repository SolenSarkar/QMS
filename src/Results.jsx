import React, { useState, useEffect } from "react";
import "./App.css";

export default function Results({ onHomeClick }) {
  const [students, setStudents] = useState([]);
  const [allTestRecords, setAllTestRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [classes, setClasses] = useState([]);

  // Fetch classes for filter dropdown
  useEffect(() => {
    fetch("/api/attributes")
      .then(res => res.json())
      .then(attrs => {
        const classAttr = attrs.find(a => a.name.toLowerCase() === "class");
        if (classAttr) {
          fetch(`/api/values/${classAttr._id}`)
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
        const studentsRes = await fetch("/api/students");
        const studentsData = await studentsRes.json();
        
        if (Array.isArray(studentsData) && studentsData.length > 0) {
          setStudents(studentsData);
          
          // Fetch test records for each student
          const allRecords = [];
          for (const student of studentsData) {
            try {
              const recordsRes = await fetch(`/api/test-records/${student._id}`);
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
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ color: '#888' }}>Loading results...</div>
                </td>
              </tr>
            ) : filteredResults.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: 40 }}>
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
                  <td style={{ fontWeight: 600, color: '#1976d2' }}>{record.studentName}</td>
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

