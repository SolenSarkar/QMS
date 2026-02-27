import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

export default function SettingsPage({ onHomeClick }) {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [passkeys, setPasskeys] = useState({});
  const [visiblePasskeys, setVisiblePasskeys] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorCount, setErrorCount] = useState(0);

  // Normalize ID to string
  const normalizeId = (id) => {
    if (!id) return "";
    if (typeof id === 'string') return id;
    if (id.$oid) return id.$oid;
    return String(id);
  };

  // Fetch all data
  const fetchAllData = useCallback(() => {
    fetch("http://localhost:5000/api/attributes")
      .then(res => res.json())
      .then(attrs => {
        // Find class attribute
        let classAttr = attrs.find(a => a.name && a.name.toLowerCase() === "class");
        if (!classAttr) classAttr = attrs.find(a => a.name === "Class");
        
        // Find subject attribute
        let subjectAttr = attrs.find(a => a.name && a.name.toLowerCase() === "subject");
        if (!subjectAttr) subjectAttr = attrs.find(a => a.name === "Subject");
        
        const classPromise = classAttr 
          ? fetch(`http://localhost:5000/api/values/${classAttr._id}`).then(r => r.json())
          : Promise.resolve([]);
          
        const subjectPromise = subjectAttr 
          ? fetch(`http://localhost:5000/api/values/${subjectAttr._id}`).then(r => r.json())
          : Promise.resolve([]);
        
        Promise.all([classPromise, subjectPromise])
          .then(([classesData, subjectsData]) => {
            const activeClasses = classesData.filter(v => v.status === 'Active');
            const activeSubjects = subjectsData.filter(v => v.status === 'Active');
            
            setClasses(activeClasses);
            setSubjects(activeSubjects);
            
            // Set default selected class
            if (activeClasses.length > 0 && !selectedClass) {
              setSelectedClass(normalizeId(activeClasses[0]._id));
            }
            
            setLoading(false);
          });
      })
      .catch(err => {
        console.error("Error fetching data:", err);
        setLoading(false);
      });
  }, [selectedClass]);

  // Initial load
  useEffect(() => {
    fetchAllData();
  }, []);

  // Load passkeys when subjects or selectedClass changes
  useEffect(() => {
    if (subjects.length === 0) {
      setPasskeys({});
      setVisiblePasskeys({});
      return;
    }

    // Filter subjects based on selected class
    const filteredSubjects = subjects.filter(s => {
      if (!selectedClass) return true;
      
      const sClassId = normalizeId(s.classId);
      return sClassId === selectedClass;
    });

    const loadedPasskeys = {};
    const loadedVisibility = {};
    
    filteredSubjects.forEach(sub => {
      const subId = normalizeId(sub._id);
      // Handle passkey - ensure it's a string, not undefined
      let passkeyValue = "";
      if (sub.passkey !== undefined && sub.passkey !== null) {
        passkeyValue = String(sub.passkey);
      }
      loadedPasskeys[subId] = passkeyValue;
      // Show passkey as visible if it has a value
      loadedVisibility[subId] = passkeyValue.length > 0;
    });
    
    console.log("Loaded passkeys:", loadedPasskeys);
    setPasskeys(loadedPasskeys);
    setVisiblePasskeys(loadedVisibility);
  }, [subjects, selectedClass]);

  const getClassNameById = (classId) => {
    if (!classId) return "No Class";
    const classIdStr = normalizeId(classId);
    const cls = classes.find(c => normalizeId(c._id) === classIdStr);
    return cls ? cls.valueName : "Unknown Class";
  };

  const handlePasskeyChange = (subjectId, value) => {
    setPasskeys(prev => ({
      ...prev,
      [subjectId]: value
    }));
  };

  const togglePasskeyVisibility = (subjectId) => {
    setVisiblePasskeys(prev => ({
      ...prev,
      [subjectId]: !prev[subjectId]
    }));
  };

  const handleSavePasskeys = async () => {
    setSaving(true);
    setMessage("");
    setErrorCount(0);

    // Get filtered subjects
    const filteredSubjects = subjects.filter(s => {
      if (!selectedClass) return true;
      const sClassId = normalizeId(s.classId);
      return sClassId === selectedClass;
    });

    let successCount = 0;
    let errorCountVar = 0;

for (const subject of filteredSubjects) {
      const subId = normalizeId(subject._id);
      const passkey = passkeys[subId] || "";
      
      try {
        const res = await fetch(`http://localhost:5000/api/values/${subId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ passkey })
        });
        
        if (res.ok) {
          successCount++;
        } else {
          errorCountVar++;
        }
      } catch (err) {
        console.error("Error:", err);
        errorCountVar++;
      }
    }

    setErrorCount(errorCountVar);
    setSaving(false);
    
    if (errorCountVar > 0) {
      setMessage(`Saved ${successCount}, ${errorCountVar} failed`);
    } else {
      setMessage(`Successfully saved passkeys for ${successCount} subjects!`);
    }

    // Refresh data
    fetchAllData();

    setTimeout(() => setMessage(""), 5000);
  };

  if (loading) {
    return (
      <div className="settings-page" style={{ padding: 40, textAlign: 'center' }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  // Get filtered subjects for display
  const displaySubjects = subjects.filter(s => {
    if (!selectedClass) return true;
    const sClassId = normalizeId(s.classId);
    return sClassId === selectedClass;
  });

  // Count subjects with and without passkeys
  const subjectsWithPasskey = displaySubjects.filter(s => {
    const subId = normalizeId(s._id);
    const pk = passkeys[subId];
    return pk && pk.length > 0;
  }).length;
  const subjectsWithoutPasskey = displaySubjects.length - subjectsWithPasskey;

  return (
    <div className="settings-page" style={{ backgroundColor: '#f5f7fa', minHeight: '100vh', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ color: '#333', fontWeight: 800, fontSize: '1.8em', margin: 0 }}>Settings - Passkey Management</h2>
        <button className="back-button" style={{ position: 'static' }} onClick={onHomeClick}>
          <span style={{ fontSize: 20, marginRight: 6 }}>←</span> Back
        </button>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontWeight: 600, marginRight: 12, color: '#333' }}>Select Class:</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: 8, border: '1.5px solid #ccc', fontSize: '1em', minWidth: 200 }}
          >
            <option value="">All Subjects</option>
            {classes.map(cls => (
              <option key={cls._id} value={normalizeId(cls._id)}>{cls.valueName}</option>
            ))}
          </select>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <div style={{ 
            flex: 1, 
            padding: 16, 
            backgroundColor: '#e8f5e9', 
            borderRadius: 8,
            border: '1px solid #4caf50'
          }}>
            <div style={{ fontSize: '2em', fontWeight: 700, color: '#4caf50' }}>{subjectsWithPasskey}</div>
            <div style={{ color: '#2e7d32', fontWeight: 500 }}>Subjects with Passkey</div>
          </div>
          <div style={{ 
            flex: 1, 
            padding: 16, 
            backgroundColor: '#fff3e0', 
            borderRadius: 8,
            border: '1px solid #ff9800'
          }}>
            <div style={{ fontSize: '2em', fontWeight: 700, color: '#ff9800' }}>{subjectsWithoutPasskey}</div>
            <div style={{ color: '#ef6c00', fontWeight: 500 }}>Subjects without Passkey</div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <h3 style={{ color: '#333', marginBottom: 16 }}>Subject Passkeys</h3>
          <p style={{ color: '#666', marginBottom: 20, fontSize: '0.95em' }}>
            Set passkeys for each subject. Students will need to enter the passkey to access questions for that subject.
            Leave blank to make the subject accessible without a passkey. Previously saved passkeys are shown by default.
          </p>
        </div>

        {displaySubjects.length === 0 ? (
          <div style={{ color: '#888', fontStyle: 'italic' }}>No subjects found. Create subjects in Attribute Values page first.</div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {displaySubjects.map(subject => {
              const subId = normalizeId(subject._id);
              const hasPasskey = passkeys[subId] && passkeys[subId].length > 0;
              const subjectClassName = getClassNameById(subject.classId);
              return (
                <div key={subject._id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 16, 
                  padding: 16, 
                  backgroundColor: hasPasskey ? '#e8f5e9' : '#f8f9fa', 
                  borderRadius: 8,
                  border: `1px solid ${hasPasskey ? '#4caf50' : '#e0e0e0'}`
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#333' }}>
                      {subject.valueName}
                    </div>
                    <div style={{ fontSize: '0.8em', color: '#666' }}>
                      Class: {subjectClassName}
                    </div>
                  </div>
                  <div style={{ flex: 1.5, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type={visiblePasskeys[subId] ? "text" : "password"}
                      value={passkeys[subId] || ""}
                      onChange={(e) => handlePasskeyChange(subId, e.target.value)}
                      placeholder={hasPasskey ? "" : "Enter passkey"}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 6,
                        border: `1.5px solid ${hasPasskey ? '#4caf50' : '#ccc'}`,
                        fontSize: '1em',
                        backgroundColor: '#fff'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasskeyVisibility(subId)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 6,
                        border: '1.5px solid #ccc',
                        background: visiblePasskeys[subId] ? '#4c6fff' : '#f0f0f0',
                        color: visiblePasskeys[subId] ? '#fff' : '#333',
                        cursor: 'pointer',
                        fontSize: '1.1em',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title={visiblePasskeys[subId] ? "Hide passkey" : "View passkey"}
                    >
                      {visiblePasskeys[subId] ? "🙈" : "👁️"}
                    </button>
                  </div>
                  <div style={{ 
                    width: 120, 
                    textAlign: 'center',
                    fontSize: '0.9em',
                    fontWeight: 600,
                    padding: '6px 12px',
                    borderRadius: 20,
                    backgroundColor: hasPasskey ? '#4caf50' : '#e0e0e0',
                    color: hasPasskey ? '#fff' : '#666'
                  }}>
                    {hasPasskey ? '🔒 Protected' : '🔓 Open'}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {displaySubjects.length > 0 && (
          <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={handleSavePasskeys}
              disabled={saving}
              style={{
                padding: '12px 32px',
                borderRadius: 8,
                border: 'none',
                background: saving ? '#ccc' : 'linear-gradient(90deg, #4c6fff 0%, #6c5ce7 100%)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1.05em',
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(76, 111, 255, 0.3)'
              }}
            >
              {saving ? 'Saving...' : 'Save All Passkeys'}
            </button>
            {message && (
              <span style={{ color: errorCount > 0 ? '#f44336' : '#4caf50', fontWeight: 600 }}>{message}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
