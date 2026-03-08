import React from 'react';
import './App.css';

function SidePanel({ items = [], onItemClick, performanceData = null }) {
  // Calculate average score from performance data
  const getAverageScore = () => {
    if (!performanceData || !performanceData.subjects || performanceData.subjects.length === 0) {
      return 0;
    }
    const totalPercentage = performanceData.subjects.reduce((sum, sub) => sum + (sub.percentage || 0), 0);
    return (totalPercentage / performanceData.subjects.length).toFixed(1);
  };

  // Get best subjects (above 70%)
  const getBestSubjects = () => {
    if (!performanceData || !performanceData.subjects) return [];
    return performanceData.subjects.filter(sub => (sub.percentage || 0) >= 70);
  };

  const averageScore = getAverageScore();
  const bestSubjects = getBestSubjects();

  return (
    <aside className="admin-side-nav">
      <ul>
        {items.map((item, idx) => (
          <li key={item} style={{ cursor: 'pointer', fontWeight: idx === 0 ? 600 : 400 }} onClick={() => onItemClick && onItemClick(item)}>{item}</li>
        ))}
      </ul>
      
      {/* Performance Section */}
      {performanceData && performanceData.subjects && performanceData.subjects.length > 0 && (
        <div className="performance-section" style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <h4 style={{ 
            margin: '0 0 12px 0', 
            color: '#333', 
            fontSize: '14px',
            fontWeight: 600,
            borderBottom: '1px solid #ddd',
            paddingBottom: '8px'
          }}>
            📊 Performance
          </h4>
          
          {/* Average Score */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '6px'
            }}>
              <span style={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>Average Score</span>
              <span style={{ 
                fontSize: '18px', 
                fontWeight: 700, 
                color: averageScore >= 70 ? '#4caf50' : averageScore >= 50 ? '#ff9800' : '#f44336'
              }}>
                {averageScore}%
              </span>
            </div>
            {/* Overall Progress Bar */}
            <div style={{ 
              width: '100%', 
              height: '8px', 
              backgroundColor: '#e0e0e0', 
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${averageScore}%`, 
                height: '100%', 
                backgroundColor: averageScore >= 70 ? '#4caf50' : averageScore >= 50 ? '#ff9800' : '#f44336',
                borderRadius: '4px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* Subject-wise Percentage Bars */}
          <div style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', color: '#666', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
              Subject Scores
            </span>
            {performanceData.subjects.map((subject, index) => (
              <div key={index} style={{ marginBottom: '8px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '3px'
                }}>
                  <span style={{ 
                    fontSize: '11px', 
                    color: '#444',
                    fontWeight: subject.percentage >= 70 ? 600 : 400,
                    maxWidth: '80px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }} title={subject.name}>
                    {subject.name}
                  </span>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 600,
                    color: subject.percentage >= 70 ? '#4caf50' : subject.percentage >= 50 ? '#ff9800' : '#f44336'
                  }}>
                    {subject.percentage.toFixed(1)}%
                  </span>
                </div>
                <div style={{ 
                  width: '100%', 
                  height: '6px', 
                  backgroundColor: '#e0e0e0', 
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: `${subject.percentage}%`, 
                    height: '100%', 
                    backgroundColor: subject.percentage >= 70 ? '#4caf50' : subject.percentage >= 50 ? '#ff9800' : '#f44336',
                    borderRadius: '3px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Best Subjects Badge */}
          {bestSubjects.length > 0 && (
            <div style={{ 
              padding: '8px', 
              backgroundColor: '#e8f5e9', 
              borderRadius: '6px',
              border: '1px solid #4caf50'
            }}>
              <span style={{ fontSize: '10px', color: '#2e7d32', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                🏆 Best Performers
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {bestSubjects.map((subject, index) => (
                  <span key={index} style={{ 
                    fontSize: '10px', 
                    backgroundColor: '#4caf50', 
                    color: '#fff', 
                    padding: '2px 6px', 
                    borderRadius: '10px',
                    fontWeight: 500
                  }}>
                    {subject.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

export default SidePanel;
