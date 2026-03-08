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
import ToastContainer from './Toast';

function Root() {
  const [page, setPage] = React.useState('main');
  const [studentName, setStudentName] = React.useState('');
  const [adminName, setAdminName] = React.useState('');

  React.useEffect(() => {
    if (page === 'main' || page === 'student-welcome') {
      document.body.classList.add('student-welcome-center');
    } else {
      document.body.classList.remove('student-welcome-center');
    }
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
        <ToastContainer />
        <AdminDashboard
          name={adminName}
          onLogout={() => {
            setPage('welcome');
            setStudentName('');
            setAdminName('');
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
        <ToastContainer />
        <AdminAttributeDashboard onHomeClick={() => setPage('admin-dashboard')} onAttributeMasterClick={() => setPage('attribute-master')} />
        <Footer />
      </>
    );
  }
  if (page === 'attribute-master') {
    return (
      <>
        <ToastContainer />
        <AttributeMaster
          onHomeClick={() => setPage('admin-dashboard')}
          onLogout={() => {
            setPage('welcome');
            setStudentName('');
          }}
        />
        <Footer />
      </>
    );
  }
  if (page === 'student-welcome') {
    return (
      <>
        <ToastContainer />
        <StudentWelcome name={studentName} onStart={() => setPage('student-dashboard')} onBack={() => setPage('welcome')} />
        <Footer />
      </>
    );
  }
  if (page === 'student-dashboard') {
    const studentData = JSON.parse(localStorage.getItem('qms_studentData') || '{}');
    return (
      <>
        <ToastContainer />
        <StudentDashboard 
          name={studentName}
          studentData={studentData}
          onProjectTitleClick={() => {
            setPage('main');
            setStudentName('');
          }}
          onLogout={() => {
            setPage('welcome');
            setStudentName('');
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

