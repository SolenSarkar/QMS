
import React, { useState, useEffect } from "react";

const AttributeValues = ({ onHomeClick }) => {

          // Stream selection for class 11/12
          const [selectedStream, setSelectedStream] = useState("");
          const [customStream, setCustomStream] = useState("");
          const streamOptions = [
            { value: "science", label: "Science" },
            { value: "commerce", label: "Commerce" },
            { value: "arts", label: "Arts" },
            { value: "other", label: "Other (specify)" }
          ];
          // Helper to get class name by id
          const getClassNameById = (id) => {
            const cls = classList.find(c => c._id === id);
            return cls ? (cls.valueName || cls.name || "") : "";
          };
        // Fetch class list for popup (for Subject/Topic)
        const [classList, setClassList] = useState([]);
        const fetchClassList = () => {
          const classAttr = attributes.find(a => a.name && a.name.toLowerCase() === "class");
          if (classAttr) {
            fetch(`http://localhost:5000/api/values/${classAttr._id}`)
              .then(res => res.json())
              .then(setClassList);
          } else {
            setClassList([]);
          }
        };
      // Fetch attributes from backend on mount
      useEffect(() => {
        fetch("http://localhost:5000/api/attributes")
          .then((res) => res.json())
          .then((data) => {
            setAttributes(data);
          });
      }, []);
    const [attributes, setAttributes] = useState([]);
    const [selectedAttribute, setSelectedAttribute] = useState("");
    const [values, setValues] = useState([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [newValue, setNewValue] = useState("");
    const [newStatus, setNewStatus] = useState("Active");
    const [showPopup, setShowPopup] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
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

  // For topic popup: subject list
  const [subjectList, setSubjectList] = useState([]);
  useEffect(() => {
    // Only fetch if topic is selected
    const attr = attributes.find(a => a._id === selectedAttribute);
    if (attr && attr.name && attr.name.toLowerCase() === 'topic') {
      const subjectAttr = attributes.find(a => a.name.toLowerCase() === 'subject');
      if (subjectAttr) {
        fetch(`http://localhost:5000/api/values/${subjectAttr._id}`)
          .then(res => res.json())
          .then(setSubjectList);
      }
    } else {
      setSubjectList([]);
    }
  }, [selectedAttribute, attributes]);

    useEffect(() => {
      if (!selectedAttribute) {
        setValues([]);
        return;
      }
      // If Subject, filter by class
      const attr = attributes.find(a => a._id === selectedAttribute);
      if (attr && attr.name.toLowerCase() === "subject" && selectedClass) {
        fetch(`http://localhost:5000/api/values/${selectedAttribute}`)
          .then(res => res.json())
          .then(data => {
            console.log('DEBUG: values received:', data);
            setValues(data.filter(v => v.classId === selectedClass));
          });
      } else {
        fetch(`http://localhost:5000/api/values/${selectedAttribute}`)
          .then(res => res.json())
          .then(data => {
            console.log('DEBUG: values received:', data);
            setValues(data);
          });
      }
    }, [selectedAttribute, selectedClass, attributes]);

  const handleAddValue = () => {
    if (!selectedAttribute || !newValue) return;
    const attr = attributes.find(a => a._id === selectedAttribute);
    // If Subject, require class selection
    if (attr && attr.name.toLowerCase() === "subject" && !selectedClass) {
      alert("Please select a class for the subject.");
      return;
    }
    // If Subject and class 11/12, require stream (case-insensitive, allow e.g. '11', '11th', '11TH')
    const className = getClassNameById(selectedClass).toLowerCase();
    const isClass11or12 = /(^|\D)11(\D|$)/.test(className) || /(^|\D)12(\D|$)/.test(className);
    if (attr && attr.name.toLowerCase() === "subject" && isClass11or12 && !selectedStream) {
      alert("Please select a stream for class 11 or 12.");
      return;
    }
    if (attr && attr.name.toLowerCase() === "subject" && isClass11or12 && selectedStream === "other" && !customStream.trim()) {
      alert("Please specify the stream name.");
      return;
    }
    const payload = {
      attributeId: selectedAttribute,
      valueName: newValue,
      status: newStatus,
    };
    if (attr && attr.name.toLowerCase() === "subject") {
      payload.classId = selectedClass;
      if (isClass11or12) {
        payload.stream = selectedStream === "other" ? customStream.trim() : selectedStream;
      }
    }
    fetch("http://localhost:5000/api/values", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        setValues((prev) => [...prev, data]);
        setShowPopup(false);
        setNewValue("");
        setNewStatus("Active");
        setSelectedStream("");
        setCustomStream("");
      });
  };

        const filteredAttributes = attributes.filter((attr) =>
          attr.name.toLowerCase().includes(searchTerm.toLowerCase())
        );


  const [showMenu, setShowMenu] = useState(null);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const valuesPerPage = 5;
  const totalPages = Math.ceil(values.length / valuesPerPage);
  const paginatedValues = values.slice((currentPage - 1) * valuesPerPage, currentPage * valuesPerPage);

  // Show Stream column in the grid when selected class contains '11' or '12' (case-insensitive)
  let showStreamColumn = false;
  const className = getClassNameById(selectedClass).toLowerCase();
  if (/11/.test(className) || /12/.test(className)) {
    showStreamColumn = true;
  }

  // Reset to first page when values change (e.g., attribute changes or add/delete)
  useEffect(() => {
    setCurrentPage(1);
  }, [values]);

  const handleToggleStatus = (id) => {
    const val = values.find(v => v._id === id);
    if (!val) return;
    const updatedStatus = val.status === "Active" ? "Inactive" : "Active";
    fetch(`http://localhost:5000/api/values/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...val, status: updatedStatus })
    })
      .then(res => res.json())
      .then(updated => {
        setValues(vals => vals.map(v => v._id === id ? updated : v));
      });
  };

  const handleDelete = (id) => {
    fetch(`http://localhost:5000/api/values/${id}`, {
      method: "DELETE"
    })
      .then(res => res.json())
      .then(() => {
        setValues(vals => vals.filter(val => val._id !== id));
        setShowMenu(null);
      });
  };

        return (
          <div className="attribute-master-page" style={{ position: 'relative', minHeight: '100vh'}}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 }}>
                <button className="back-button" style={{ marginBottom: 10 }} onClick={onHomeClick}>
                  <span style={{ fontSize: 20, marginRight: 6 }}>&#8592;</span> Back
                </button>
              <h2 style={{ color: '#ffffff', fontWeight: '800', fontSize: '1.8em', margin: 0 }}>Attribute Values</h2>
            </div>
            <div className="attribute-table-container">
              <div style={{ margin: 10 }}>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search attribute..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ marginRight: 10, padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', fontSize: '1em', minWidth: 180 }}
                />
                <select
                  className="dropdown-select"
                  value={selectedAttribute}
                  onChange={(e) => setSelectedAttribute(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', fontSize: '1em', minWidth: 180 }}
                >
                  <option value="">Select Attribute</option>
                  {filteredAttributes.map((attr) => (
                    <option key={attr._id} value={attr._id}>
                      {attr.name}
                    </option>
                  ))}
                </select>
                <button
                  className="cta-button"
                  onClick={() => {
                    fetchClassList();
                    setShowPopup(true);
                  }}
                  disabled={!selectedAttribute}
                  style={{ marginLeft: 10 }}
                >
                  + Add Value
                </button>
              </div>
              <table className="attribute-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Value</th>
                    {showStreamColumn && <th>Stream</th>}
                    <th>Status</th>
                    <th>Edit</th>
                    <th>...</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedValues.map((val) => (
                    <tr key={val._id}>
                      <td>{formatId(val._id)}</td>
                      <td>{val.valueName}</td>
                      {showStreamColumn && <td>{val.stream ? (val.stream.charAt(0).toUpperCase() + val.stream.slice(1)) : ''}</td>}
                      <td>
                        <span className={val.status === "Active" ? "status-active" : "status-inactive"}>
                          {val.status}
                        </span>
                      </td>
                      <td>
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={val.status === "Active"}
                            onChange={() => handleToggleStatus(val._id)}
                          />
                          <span className="slider round"></span>
                        </label>
                      </td>
                      <td style={{ position: 'relative' }}>
                        <span
                          style={{ fontWeight: 'bold', fontSize: 18, cursor: 'pointer' }}
                          onClick={() => setShowMenu(showMenu === val._id ? null : val._id)}
                        >
                          ⋮
                        </span>
                        {showMenu === val._id && (
                          <div className="attr-menu">
                            <button className="delete-btn" onClick={() => handleDelete(val._id)}>Delete</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16 }}>
                  <button
                    className="cta-button"
                    style={{ padding: '4px 12px' }}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Prev
                  </button>
                  <span style={{ color: '#fff', fontWeight: 500 }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="cta-button"
                    style={{ padding: '4px 12px' }}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
            {showPopup && (
              <div className="popup-overlay">
                <div className="popup-form">
                  <div className="popup-header">
                    <span className="popup-title">Add Value</span>
                    <button className="popup-close" onClick={() => setShowPopup(false)}>&times;</button>
                  </div>
                  <div className="popup-body">
                    {/* If Subject, show class dropdown. If Topic, show subject dropdown. */}
                    {(() => {
                      const attr = attributes.find(a => a._id === selectedAttribute);
                      if (attr && attr.name.toLowerCase() === "subject") {
                        const className = getClassNameById(selectedClass).toLowerCase();
                        const isClass11or12 = /(^|\D)11(\D|$)/.test(className) || /(^|\D)12(\D|$)/.test(className);
                        return (
                          <>
                            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Class</label>
                            <select
                              value={selectedClass}
                              onChange={e => {
                                setSelectedClass(e.target.value);
                                setSelectedStream("");
                              }}
                              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', marginBottom: 16 }}
                            >
                              <option value="">Select Class</option>
                              {classList.map(cls => (
                                <option key={cls._id} value={cls._id}>{cls.valueName}</option>
                              ))}
                            </select>
                            {/* Only show stream dropdown for class 11/12 */}
                            {selectedClass && isClass11or12 && (
                              <>
                                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Stream</label>
                                <select
                                  value={selectedStream}
                                  onChange={e => {
                                    setSelectedStream(e.target.value);
                                    if (e.target.value !== "other") setCustomStream("");
                                  }}
                                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', marginBottom: 8 }}
                                >
                                  <option value="">Select Stream</option>
                                  {streamOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                                {selectedStream === "other" && (
                                  <input
                                    type="text"
                                    value={customStream}
                                    onChange={e => setCustomStream(e.target.value)}
                                    placeholder="Enter stream name"
                                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', marginBottom: 16 }}
                                  />
                                )}
                              </>
                            )}
                          </>
                        );
                      }
                      if (attr && attr.name.toLowerCase() === "topic") {
                        // Sort subjects by class name (ascending)
                        const sortedSubjects = [...subjectList].sort((a, b) => {
                          let classA = '', classB = '';
                          if (a.classId) {
                            const clsA = classList.find(c => c._id === a.classId);
                            if (clsA) classA = clsA.valueName || clsA.name || '';
                          }
                          if (b.classId) {
                            const clsB = classList.find(c => c._id === b.classId);
                            if (clsB) classB = clsB.valueName || clsB.name || '';
                          }
                          // Try to compare as numbers if possible, else as strings
                          const numA = parseInt(classA);
                          const numB = parseInt(classB);
                          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
                          return classA.localeCompare(classB);
                        });
                        return (
                          <>
                            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Subject</label>
                            <select
                              value={selectedClass}
                              onChange={e => setSelectedClass(e.target.value)}
                              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', marginBottom: 16 }}
                            >
                              <option value="">Select Subject</option>
                              {sortedSubjects.map(sub => {
                                // Find class name for this subject's classId
                                let className = '';
                                if (sub.classId) {
                                  const cls = classList.find(c => c._id === sub.classId);
                                  if (cls) className = cls.valueName || cls.name || '';
                                }
                                return (
                                  <option key={sub._id} value={sub._id}>
                                    {sub.valueName}{className ? ` (${className})` : ''}
                                  </option>
                                );
                              })}
                            </select>
                          </>
                        );
                      }
                      return null;
                    })()}
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Value Name</label>
                    <input
                      type="text"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder="Enter value name"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', marginBottom: 16 }}
                    />
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', marginBottom: 24 }}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="popup-actions">
                    <button className="cta-button" style={{ marginRight: 12 }} onClick={() => setShowPopup(false)}>Cancel</button>
                    <button className="cta-button" onClick={handleAddValue}>Add Value</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      };

export default AttributeValues;