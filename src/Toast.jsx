import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

// Global state for toast notifications
let toastCallback = null;

export const showToast = (message, type = 'info', duration = 3000) => {
  if (toastCallback) {
    toastCallback({ message, type, duration, id: Date.now() });
  }
};

function Toast({ toasts, removeToast }) {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '350px'
    }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            padding: '14px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'slideIn 0.3s ease-out',
            backgroundColor: toast.type === 'success' ? '#4caf50' : 
                           toast.type === 'error' ? '#f44336' : 
                           toast.type === 'warning' ? '#ff9800' : '#2196f3',
            color: '#fff',
            fontWeight: 500,
            fontSize: '0.95em'
          }}
        >
          <span style={{ fontSize: '1.2em' }}>
            {toast.type === 'success' ? '✓' : 
             toast.type === 'error' ? '✕' : 
             toast.type === 'warning' ? '⚠' : 'ℹ'}
          </span>
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '1.2em',
              padding: 0,
              lineHeight: 1,
              opacity: 0.8
            }}
          >
            ×
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ message, type, duration, id }) => {
    setToasts(prev => [...prev, { message, type, duration, id }]);
    
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Register the callback
  useEffect(() => {
    toastCallback = addToast;
    return () => {
      toastCallback = null;
    };
  }, [addToast]);

  return <Toast toasts={toasts} removeToast={removeToast} />;
}

