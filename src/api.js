// API Configuration
// Support both localhost and production Render backend URLs
// Both http://localhost:5000 and https://qms-sjuv.onrender.com work in all environments

// Define both backend URLs
const LOCAL_API_URL = 'http://localhost:5000';
const PROD_API_URL = 'https://qms-sjuv.onrender.com';

// Get the preferred API URL from environment variable, default to production
const getApiBaseUrl = () => {
  // Check for user preference in environment variable
  // Can be set to 'local' for local backend, 'production' or 'render' for Render backend
  const preferredApi = import.meta.env.VITE_PREFERRED_API;
  
  if (preferredApi === 'local') {
    console.log('Using local backend: http://localhost:5000');
    return LOCAL_API_URL;
  }
  
  if (preferredApi === 'production' || preferredApi === 'render') {
    console.log('Using production backend: https://qms-sjuv.onrender.com');
    return PROD_API_URL;
  }
  
  // Default to production Render URL for production builds
  if (import.meta.env.MODE === 'production') {
    console.log('Production mode - Using Render backend: https://qms-sjuv.onrender.com');
    return PROD_API_URL;
  }
  
  // Development mode - default to local but log both available
  console.log('Development mode - Defaulting to local backend: http://localhost:5000');
  console.log('Production backend also available: https://qms-sjuv.onrender.com');
  return LOCAL_API_URL;
};

const API_BASE_URL = getApiBaseUrl();

// Export both URLs for flexible usage
export const API_URLS = {
  LOCAL: LOCAL_API_URL,
  PRODUCTION: PROD_API_URL
};

export const API_ENDPOINTS = {
  // Attributes
  ATTRIBUTES: `${API_BASE_URL}/api/attributes`,
  
  // Values
  VALUES: (attributeId) => `${API_BASE_URL}/api/values/${attributeId}`,
  VALUES_ALL: `${API_BASE_URL}/api/values`,
  
  // Questions
  QUESTIONS: `${API_BASE_URL}/api/questions`,
  QUESTIONS_WITH_PARAMS: (classId, subjectId) => 
    `${API_BASE_URL}/api/questions?classId=${classId}&subjectId=${subjectId}`,
  QUESTION_BY_ID: (id) => `${API_BASE_URL}/api/questions/${id}`,
  
  // Question Papers
  QUESTION_PAPERS: `${API_BASE_URL}/api/question-papers`,
  QUESTION_PAPER_BY_ID: (id) => `${API_BASE_URL}/api/question-papers/${id}`,
  
  // Question Paper Permits
  QUESTION_PAPER_PERMITS: `${API_BASE_URL}/api/question-paper-permits`,
  QUESTION_PAPER_PERMIT_BY_PAPER: (questionPaperId) => 
    `${API_BASE_URL}/api/question-paper-permits/${questionPaperId}`,
  
  // Students
  STUDENTS: `${API_BASE_URL}/api/students`,
  STUDENT_BY_ID: (id) => `${API_BASE_URL}/api/students/${id}`,
  STUDENT_LOGIN: `${API_BASE_URL}/api/students/login`,
  STUDENTS_BY_CLASS: (classId) => `${API_BASE_URL}/api/students/class/${classId}`,
  STUDENTS_BY_BOARD: (boardId) => `${API_BASE_URL}/api/students/board/${boardId}`,
  
  // Admins
  ADMINS: `${API_BASE_URL}/api/admins`,
  ADMIN_BY_ID: (id) => `${API_BASE_URL}/api/admins/${id}`,
  ADMIN_LOGIN: `${API_BASE_URL}/api/admins/login`,
  SEED_ADMIN: `${API_BASE_URL}/api/seed-admin`,
  
// Test Records
  TEST_RECORDS: (studentId) => `${API_BASE_URL}/api/test-records/${studentId}`,
  TEST_SUMMARY: (studentId) => `${API_BASE_URL}/api/test-records-summary/${studentId}`,
  TEST_RECORD_DETAIL: (recordId) => `${API_BASE_URL}/api/test-records/detail/${recordId}`,
  TEST_RECORD_CHECK: (studentId, questionPaperId) => 
    `${API_BASE_URL}/api/test-records/check/${studentId}/${questionPaperId}`,
  TEST_RECORD_BY_ID: (id) => `${API_BASE_URL}/api/test-records/${id}`,
  
  // Queries
  QUERIES: `${API_BASE_URL}/api/queries`,
  QUERIES_BY_STUDENT: (studentId) => `${API_BASE_URL}/api/queries/student/${studentId}`,
  QUERY_BY_ID: (id) => `${API_BASE_URL}/api/queries/${id}`,
  QUERY_RESPOND: (id) => `${API_BASE_URL}/api/queries/${id}/respond`,
  
  // Feedback
  FEEDBACK: `${API_BASE_URL}/api/feedback`,
  FEEDBACK_BY_STUDENT: (studentId) => `${API_BASE_URL}/api/feedback/student/${studentId}`,
  
  // Health
  HEALTH: `${API_BASE_URL}/api/health`,
};

export default API_BASE_URL;

