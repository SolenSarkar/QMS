// API Configuration
// Use environment variable in production, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

