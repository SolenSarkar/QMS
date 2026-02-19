
import React, { useState, useEffect } from "react";
import "./App.css";

export default function AttributeMaster({ onHomeClick }) {
	const [attributes, setAttributes] = useState([]);
		// Fetch attributes from backend
		useEffect(() => {
			fetch("http://localhost:5000/api/attributes")
				.then((res) => res.json())
				.then((data) => setAttributes(data));
		}, []);
	const [showMenu, setShowMenu] = useState(null);
	const [showPopup, setShowPopup] = useState(false);
	const [newAttr, setNewAttr] = useState("");
	const [newStatus, setNewStatus] = useState("Active");

	const handleAdd = () => {
		if (
			newAttr.trim() &&
			!attributes.some(a => a.name.toLowerCase() === newAttr.trim().toLowerCase())
		) {
			fetch("http://localhost:5000/api/attributes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: newAttr.trim(), status: newStatus })
			})
				.then((res) => res.json())
				.then((data) => {
					setAttributes((prev) => [...prev, data]);
					setNewAttr("");
					setNewStatus("Active");
					setShowPopup(false);
				});
		}
	};

	const handleToggleStatus = (id) => {
		const attr = attributes.find(a => (a._id || a.id) === id);
		if (!attr) return;
		const updatedStatus = attr.status === "Active" ? "Inactive" : "Active";
		fetch(`http://localhost:5000/api/attributes/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ ...attr, status: updatedStatus })
		})
			.then(res => res.json())
			.then(updated => {
				setAttributes(attrs => attrs.map(a => (a._id || a.id) === id ? updated : a));
			});
	};

	const handleDelete = (id) => {
		fetch(`http://localhost:5000/api/attributes/${id}`, {
			method: "DELETE"
		})
			.then(res => res.json())
			.then(() => {
				setAttributes(attrs => attrs.filter(attr => (attr._id || attr.id) !== id));
				setShowMenu(null);
			});
	};

	const formatId = (id) => {
		// Accept both MongoDB _id and numeric id for compatibility
		if (typeof id === 'number') {
			return `ATR${id.toString().padStart(3, '0')}`;
		}
		if (typeof id === 'string' && id.length >= 6) {
			return `ATR${id.slice(-6).toUpperCase()}`;
		}
		return id;
	};

	return (
		   <div className="attribute-master-page" style={{ position: 'relative', minHeight: '100vh'}}>
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
					<span style={{ fontSize: 20, marginRight: 6 }}>&#8592;</span> Back
				</button>
				<h2 style={{ color: '#ffffff', fontWeight: '800', fontSize: '1.8em', margin: 0 }}>Attribute Master</h2>
			</div>
			<div className="attribute-table-container">
				<table className="attribute-table">
					<thead>
						<tr>
							<th>ID</th>
							<th>Attribute Name</th>
							<th>Status</th>
							<th>Edit</th>
							<th>...</th>
						</tr>
					</thead>
					<tbody>
						{attributes.map(attr => (
							<tr key={attr._id || attr.id}>
								<td>{formatId(attr._id || attr.id)}</td>
								<td>{attr.name}</td>
								<td>
									<span className={attr.status === "Active" ? "status-active" : "status-inactive"}>
										{attr.status}
									</span>
								</td>
								<td>
									<label className="switch">
										<input
											type="checkbox"
											checked={attr.status === "Active"}
											onChange={() => handleToggleStatus(attr._id || attr.id)}
										/>
										<span className="slider round"></span>
									</label>
								</td>
								<td style={{ position: 'relative' }}>
									<span
										style={{ fontWeight: 'bold', fontSize: 18, cursor: 'pointer' }}
										onClick={() => setShowMenu(showMenu === (attr._id || attr.id) ? null : (attr._id || attr.id))}
									>
										⋮
									</span>
									{showMenu === (attr._id || attr.id) && (
										<div className="attr-menu">
											<button className="delete-btn" onClick={() => handleDelete(attr._id || attr.id)}>Delete</button>
										</div>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 24 }}>
				<button className="cta-button" onClick={() => setShowPopup(true)}> + Add Attribute</button>
			</div>

			{showPopup && (
				<div className="popup-overlay">
					<div className="popup-form">
						<div className="popup-header">
							<span className="popup-title">Add Attribute</span>
							<button className="popup-close" onClick={() => setShowPopup(false)}>&times;</button>
						</div>
						<div className="popup-body">
							<label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Attribute Name</label>
							<input
								type="text"
								value={newAttr}
								onChange={e => setNewAttr(e.target.value)}
								placeholder="Enter attribute name"
								style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', marginBottom: 16 }}
							/>
							<label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Status</label>
							<select
								value={newStatus}
								onChange={e => setNewStatus(e.target.value)}
								style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', marginBottom: 24 }}
							>
								<option value="Active">Active</option>
								<option value="Inactive">Inactive</option>
							</select>
						</div>
						<div className="popup-actions">
							<button className="cta-button" style={{ marginRight: 12 }} onClick={() => setShowPopup(false)}>Cancel</button>
							<button className="cta-button" onClick={handleAdd}>Add Attribute</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
