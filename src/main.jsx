import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import Welcome from './Welcome';
import StudentWelcome from './StudentWelcome';
import StudentDashboard from './StudentDashboard';
import AdminDashboard from './AdminDashboard';
import AdminAttributeDashboard from './AdminAttributeDashboard';
import AttributeMaster from './AttributeMaster';
import Footer from './Footer';


function Root() {
  // Always start on main landing page (App.jsx)
  React.useEffect(() => {
    localStorage.removeItem('qms_page');
    localStorage.removeItem('qms_studentName');
  }, []);
  const [page, setPage] = React.useState('main');
  const [studentName, setStudentName] = React.useState('');
  const [adminName, setAdminName] = React.useState('');

  // Persist state to localStorage on change
  React.useEffect(() => {
    localStorage.setItem('qms_page', page);
  }, [page]);
  React.useEffect(() => {
    localStorage.setItem('qms_studentName', studentName);
  }, [studentName]);

  console.log('Current page:', page);
  React.useEffect(() => {
    if (page === 'main' || page === 'student-welcome') {
      document.body.classList.add('student-welcome-center');
    } else {
      document.body.classList.remove('student-welcome-center');
    }
    // Remove flex from #root for admin pages
    const root = document.getElementById('root');
    if (root) {
      if (page === 'main' || page === 'student-welcome') {
        root.style.display = 'flex';
        root.style.flexDirection = 'column';
        root.style.alignItems = 'center';
        root.style.justifyContent = 'center';
      } else {
        root.style.display = '';
        root.style.flexDirection = '';
        root.style.alignItems = '';
        root.style.justifyContent = '';
      }
    }
  }, [page]);
  if (page === 'main') {
    return <App onGetStarted={() => setPage('welcome')} />;
  }
  if (page === 'welcome') {
    return <Welcome
      onStudentSignIn={(name, studentData) => { 
        setStudentName(name); 
        // Store student data in localStorage for persistence
        if (studentData) {
          localStorage.setItem('qms_studentData', JSON.stringify(studentData));
        }
        setPage('student-welcome'); 
      }}
      onAdminSignIn={email => { setAdminName(email); setPage('admin-dashboard'); }}
      onSignIn={() => {}}
      onBack={() => setPage('main')}
    />;
  }
  if (page === 'admin-dashboard') {
    return (
      <>
        <AdminDashboard
          name={adminName}
          onLogout={() => {
            setPage('welcome');
            setStudentName('');
            setAdminName('');
            localStorage.removeItem('qms_page');
            localStorage.removeItem('qms_studentName');
          }}
          onDashboardClick={() => setPage('admin-attribute-dashboard')}
          onHomeClick={() => setPage('admin-dashboard')}
        />
        <Footer />
      </>
    );
  }
  if (page === 'admin-attribute-dashboard') {
    return (
      <>
        <AdminAttributeDashboard onHomeClick={() => setPage('admin-dashboard')} onAttributeMasterClick={() => setPage('attribute-master')} />
        <Footer />
      </>
    );
  }
  if (page === 'attribute-master') {
    return (
      <>
        <AttributeMaster
          onHomeClick={() => setPage('admin-dashboard')}
          onLogout={() => {
            setPage('welcome');
            setStudentName('');
            localStorage.removeItem('qms_page');
            localStorage.removeItem('qms_studentName');
          }}
        />
        <Footer />
      </>
    );
  }
  if (page === 'student-welcome') {
    return (
      <>
        <StudentWelcome name={studentName} onStart={() => setPage('student-dashboard')} onBack={() => setPage('welcome')} />
        <Footer />
      </>
    );
  }
  if (page === 'student-dashboard') {
    const studentData = JSON.parse(localStorage.getItem('qms_studentData') || '{}');
    return (
      <>
        <StudentDashboard 
          name={studentName}
          studentData={studentData}
          onProjectTitleClick={() => {
            setPage('main');
            setStudentName('');
            localStorage.removeItem('qms_page');
            localStorage.removeItem('qms_studentName');
            localStorage.removeItem('qms_studentData');
          }}
          onLogout={() => {
            setPage('welcome');
            setStudentName('');
            localStorage.removeItem('qms_page');
            localStorage.removeItem('qms_studentName');
            localStorage.removeItem('qms_studentData');
          }}
        />
        <Footer />
      </>
    );
  }
  return null;
}


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
