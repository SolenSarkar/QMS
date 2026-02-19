import React from 'react';
import './App.css';

function SidePanel({ items = [], onItemClick }) {
  return (
    <aside className="admin-side-nav">
      <ul>
        {items.map((item, idx) => (
          <li key={item} style={{ cursor: 'pointer', fontWeight: idx === 0 ? 600 : 400 }} onClick={() => onItemClick && onItemClick(item)}>{item}</li>
        ))}
      </ul>
    </aside>
  );
}

export default SidePanel;
