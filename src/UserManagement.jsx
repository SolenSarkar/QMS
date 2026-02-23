import React, { useState, useEffect } from "react";
import "./App.css";

export default function UserManagement({ onHomeClick }) {
  const [activeTab, setActiveTab] = useState("students"); // 'students' or 'admins'
  const [students, setStudents] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    rollNumber: "",
    dateOfBirth: "",
    classId: "",
    boardId: "",
    status: "Active"
  });

  // Dropdown data
  const [classes, setClasses] = useState([]);
  const [boards, setBoards] = useState([]);

  // Fetch classes and boards
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
      });
  }, []);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      if (activeTab === "students") {
        const res = await fetch("http://localhost:5000/api/students");
        const data = await res.json();
        setStudents(data);
      } else {
        const res = await fetch("http://localhost:5000/api/admins");
        const data = await res.json();
        setAdmins(data);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  // Format ID
  const formatId = (id) => {
    if (typeof id === 'string' && id.length >= 6) {
      return `USR${id.slice(-6).toUpperCase()}`;
    }
    return id;
  };

  // Handle form change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Open popup for add/edit
  const openPopup = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name || "",
        email: user.email || "",
        password: "",
        rollNumber: user.rollNumber || "",
        dateOfBirth: user.dateOfBirth || "",
        classId: user.classId?._id || user.classId || "",
        boardId: user.boardId?._id || user.boardId || "",
        status: user.status || "Active"
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: "",
        email: "",
        password: "",
        rollNumber: "",
        dateOfBirth: "",
        classId: "",
        boardId: "",
        status: "Active"
      });
    }
    setShowPopup(true);
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare data - filter out empty strings for optional fields
      const prepareData = (data) => {
        const filtered = {};
        for (const [key, value] of Object.entries(data)) {
          if (value !== "" && value !== null && value !== undefined) {
            filtered[key] = value;
          }
        }
        return filtered;
      };

      const preparedData = prepareData(formData);
      console.log("Submitting data:", preparedData);

      if (activeTab === "students") {
        if (editingUser) {
          // Update student
          const { password, ...updateData } = preparedData;
          const res = await fetch(`http://localhost:5000/api/students/${editingUser._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateData)
          });
          if (!res.ok) {
            const err = await res.json();
            alert(`Error updating student: ${err.error || 'Unknown error'}`);
            return;
          }
        } else {
          // Create student
          const res = await fetch("http://localhost:5000/api/students", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(preparedData)
          });
          if (!res.ok) {
            const err = await res.json();
            alert(`Error creating student: ${err.error || 'Unknown error'}`);
            return;
          }
          const data = await res.json();
          console.log("Student created:", data);
        }
      } else {
        if (editingUser) {
          // Update admin
          const { password, ...updateData } = preparedData;
          const res = await fetch(`http://localhost:5000/api/admins/${editingUser._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateData)
          });
          if (!res.ok) {
            const err = await res.json();
            alert(`Error updating admin: ${err.error || 'Unknown error'}`);
            return;
          }
        } else {
          // Create admin
          const res = await fetch("http://localhost:5000/api/admins", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...preparedData, role: "admin" })
          });
          if (!res.ok) {
            const err = await res.json();
            alert(`Error creating admin: ${err.error || 'Unknown error'}`);
            return;
          }
        }
      }
      setShowPopup(false);
      fetchUsers();
    } catch (err) {
      console.error("Error saving user:", err);
      alert("Error saving user. Please try again.");
    }
  };

  // Toggle status
  const toggleStatus = async (id) => {
    try {
      if (activeTab === "students") {
        await fetch(`http://localhost:5000/api/students/${id}/status`, { method: "PUT" });
      } else {
        await fetch(`http://localhost:5000/api/admins/${id}/status`, { method: "PUT" });
      }
      fetchUsers();
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

  // Delete user
  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      if (activeTab === "students") {
        await fetch(`http://localhost:5000/api/students/${id}`, { method: "DELETE" });
      } else {
        await fetch(`http://localhost:5000/api/admins/${id}`, { method: "DELETE" });
      }
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  return (
    <div className="user-management-page" style={{ position: 'relative', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 }}>
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
        <h2 style={{ color: '#ffffff', fontWeight: '800', fontSize: '1.8em', margin: 0 }}>User Management</h2>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => setActiveTab("students")}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            border: 'none',
            background: activeTab === "students" ? '#4c6fff' : '#ddd',
            color: activeTab === "students" ? '#fff' : '#333',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '1em'
          }}
        >
          Students
        </button>
        <button
          onClick={() => setActiveTab("admins")}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            border: 'none',
            background: activeTab === "admins" ? '#4c6fff' : '#ddd',
            color: activeTab === "admins" ? '#fff' : '#333',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '1em'
          }}
        >
          Admins
        </button>
        <button
          className="cta-button"
          style={{ marginLeft: 'auto' }}
          onClick={() => openPopup()}
        >
          + Add {activeTab === "students" ? "Student" : "Admin"}
        </button>
      </div>

      {/* User Table */}
      <div className="attribute-table-container">
        <table className="attribute-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              {activeTab === "students" ? (
                <>
                  <th>Roll Number</th>
                  <th>Class</th>
                  <th>Board</th>
                  <th>Score</th>
                  <th>Tests</th>
                </>
              ) : (
                <th>Email</th>
              )}
              <th>Status</th>
              <th>Edit</th>
              <th>...</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: 20 }}>Loading...</td>
              </tr>
            ) : activeTab === "students" ? (
              students.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: 20 }}>No students found</td>
                </tr>
              ) : (
                students.map(student => (
                  <tr key={student._id}>
                    <td>{formatId(student._id)}</td>
                    <td>{student.name}</td>
                    <td>{student.rollNumber}</td>
                    <td>{student.classId?.valueName || '-'}</td>
                    <td>{student.boardId?.valueName || '-'}</td>
                    <td>{student.totalScore || 0}</td>
                    <td>{student.testsTaken || 0}</td>
                    <td>
                      <span className={student.status === "Active" ? "status-active" : "status-inactive"}>
                        {student.status}
                      </span>
                    </td>
                    <td>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={student.status === "Active"}
                          onChange={() => toggleStatus(student._id)}
                        />
                        <span className="slider round"></span>
                      </label>
                    </td>
                    <td style={{ position: 'relative' }}>
                      <span
                        style={{ fontWeight: 'bold', fontSize: 18, cursor: 'pointer' }}
                        onClick={() => openPopup(student)}
                      >
                        ⋮
                      </span>
                    </td>
                  </tr>
                ))
              )
            ) : (
              admins.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: 20 }}>No admins found</td>
                </tr>
              ) : (
                admins.map(admin => (
                  <tr key={admin._id}>
                    <td>{formatId(admin._id)}</td>
                    <td>{admin.name}</td>
                    <td>{admin.email}</td>
                    <td>
                      <span className={admin.status === "Active" ? "status-active" : "status-inactive"}>
                        {admin.status}
                      </span>
                    </td>
                    <td>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={admin.status === "Active"}
                          onChange={() => toggleStatus(admin._id)}
                        />
                        <span className="slider round"></span>
                      </label>
                    </td>
                    <td style={{ position: 'relative' }}>
                      <span
                        style={{ fontWeight: 'bold', fontSize: 18, cursor: 'pointer' }}
                        onClick={() => openPopup(admin)}
                      >
                        ⋮
                      </span>
                    </td>
                  </tr>
                ))
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Popup Form */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-form">
            <div className="popup-header">
              <span className="popup-title">
                {editingUser ? `Edit ${activeTab === "students" ? "Student" : "Admin"}` : `Add ${activeTab === "students" ? "Student" : "Admin"}`}
              </span>
              <button className="popup-close" onClick={() => setShowPopup(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="popup-body">
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', marginBottom: 16 }}
                />

                {activeTab === "students" ? (
                  <>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Roll Number *</label>
                    <input
                      type="text"
                      name="rollNumber"
                      value={formData.rollNumber}
                      onChange={handleInputChange}
                      required
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', marginBottom: 16 }}
                    />

                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Date of Birth</label>
                    <input
                      type="text"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      placeholder="DD-Month-YYYY"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', marginBottom: 16 }}
                    />

                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Class</label>
                    <select
                      name="classId"
                      value={formData.classId}
                      onChange={handleInputChange}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', marginBottom: 16 }}
                    >
                      <option value="">Select Class</option>
                      {classes.map(cls => (
                        <option key={cls._id} value={cls._id}>{cls.valueName}</option>
                      ))}
                    </select>

                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Board</label>
                    <select
                      name="boardId"
                      value={formData.boardId}
                      onChange={handleInputChange}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', marginBottom: 16 }}
                    >
                      <option value="">Select Board</option>
                      {boards.map(board => (
                        <option key={board._id} value={board._id}>{board.valueName}</option>
                      ))}
                    </select>
                  </>
                ) : (
                  <>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', marginBottom: 16 }}
                    />

                    {!editingUser && (
                      <>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Password *</label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                          style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', marginBottom: 16 }}
                        />
                      </>
                    )}
                  </>
                )}

                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', marginBottom: 24 }}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="popup-actions">
                <button type="button" className="cta-button" style={{ marginRight: 12 }} onClick={() => setShowPopup(false)}>Cancel</button>
                <button type="submit" className="cta-button">{editingUser ? "Update" : "Add"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
