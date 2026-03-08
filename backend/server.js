const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB Atlas (with database name)
mongoose.connect('mongodb+srv://solensarkar3938_db_user:lwPIoY6wx6dSuNkl@cluster0.exnkgdp.mongodb.net/qms');

// Attribute schema
const attributeSchema = new mongoose.Schema({
  name: String,
  status: String
});
const Attribute = mongoose.model('Attribute', attributeSchema);

// Value schema
const valueSchema = new mongoose.Schema({
  attributeId: mongoose.Schema.Types.ObjectId,
  valueName: String,
  status: String,
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  stream: {
    type: String,
    required: false
  },
  passkey: {
    type: String,
    required: false,
    default: ''
  }
});
const AttributeValue = mongoose.model('AttributeValue', valueSchema);


// Attribute APIs
app.get('/api/attributes', async (req, res) => {
  const attrs = await Attribute.find();
  res.json(attrs);
});
app.post('/api/attributes', async (req, res) => {
  const attr = new Attribute(req.body);
  await attr.save();
  res.json(attr);
});
app.put('/api/attributes/:id', async (req, res) => {
  const attr = await Attribute.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(attr);
});
app.delete('/api/attributes/:id', async (req, res) => {
  await Attribute.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// Value APIs
app.get('/api/values/:attributeId', async (req, res) => {
  const values = await AttributeValue.find({ attributeId: req.params.attributeId });
  res.json(values);
});
app.post('/api/values', async (req, res) => {
  console.log('POST /api/values body:', req.body);
  if ('stream' in req.body) {
    console.log('Stream field received:', req.body.stream);
  } else {
    console.log('Stream field NOT present in request body');
  }
  let body = { ...req.body };
  if (body.attributeId) {
    const attr = await Attribute.findById(body.attributeId);
    if (attr && attr.name && attr.name.toLowerCase() === 'topic' && body.subjectId) {
      body.subjectId = body.subjectId;
    }
  }
  const value = new AttributeValue(body);
  await value.save();
  console.log('Saved value in DB:', value);
  res.json(value);
});
app.put('/api/values/:id', async (req, res) => {
  console.log('PUT /api/values/:id - params:', req.params.id);
  console.log('PUT /api/values/:id - body:', req.body);
  const value = await AttributeValue.findByIdAndUpdate(req.params.id, req.body, { new: true });
  console.log('PUT /api/values/:id - result:', value);
  res.json(value);
});
app.delete('/api/values/:id', async (req, res) => {
  await AttributeValue.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});


// Question schema
const questionSchema = new mongoose.Schema({
  boardId: { type: mongoose.Schema.Types.ObjectId, required: false },
  classId: { type: mongoose.Schema.Types.ObjectId, required: false },
  subjectId: { type: mongoose.Schema.Types.ObjectId, required: false },
  topicId: { type: mongoose.Schema.Types.ObjectId, required: false },
  marks: { type: Number, required: false },
  type: { type: String, required: false },
  options: { type: [String], required: false },
  text: { type: String, required: false },
  answer: { type: String, required: false }
});
const Question = mongoose.model('Question', questionSchema);

// Question Paper schema
const questionPaperSchema = new mongoose.Schema({
  board: { type: String, required: false },
  boardId: { type: mongoose.Schema.Types.ObjectId, required: false },
  class: { type: String, required: false },
  classId: { type: mongoose.Schema.Types.ObjectId, required: false },
  subject: { type: String, required: false },
  subjectId: { type: mongoose.Schema.Types.ObjectId, required: false },
  difficulty: { type: String, required: false },
  totalMarks: { type: Number, required: false },
  totalQuestions: { type: Number, required: false },
  questions: { type: Array, required: false },
  createdAt: { type: Date, default: Date.now }
});
const QuestionPaper = mongoose.model('QuestionPaper', questionPaperSchema);

// Question Paper Permit schema
const questionPaperPermitSchema = new mongoose.Schema({
  questionPaperId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionPaper', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  timeLimit: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});
const QuestionPaperPermit = mongoose.model('QuestionPaperPermit', questionPaperPermitSchema);

// Question Paper Permit APIs
app.post('/api/question-paper-permits', async (req, res) => {
  try {
    const { questionPaperId, startDate, endDate, timeLimit } = req.body;
    const paper = await QuestionPaper.findById(questionPaperId);
    if (!paper) {
      return res.status(404).json({ error: 'Question paper not found' });
    }
    const permit = new QuestionPaperPermit({
      questionPaperId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      timeLimit
    });
    await permit.save();
    res.status(201).json(permit);
  } catch (err) {
    console.error('Error saving permit:', err);
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/question-paper-permits', async (req, res) => {
  try {
    const permits = await QuestionPaperPermit.find().populate('questionPaperId').sort({ createdAt: -1 });
    res.json(permits);
  } catch (err) {
    console.error('Error fetching permits:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/question-paper-permits/:questionPaperId', async (req, res) => {
  try {
    const permits = await QuestionPaperPermit.find({ questionPaperId: req.params.questionPaperId }).populate('questionPaperId');
    res.json(permits);
  } catch (err) {
    console.error('Error fetching permits:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add a question
app.post('/api/questions', async (req, res) => {
  try {
    const q = new Question(req.body);
    await q.save();
    res.json(q);
  } catch (err) {
    console.error('Error saving question:', err, '\nRequest body:', req.body);
    res.status(400).json({ error: err.message, details: err, body: req.body });
  }
});

// Get questions
app.get('/api/questions', async (req, res) => {
  const filter = {};
  if (req.query.classId) filter.classId = req.query.classId;
  if (req.query.subjectId) filter.subjectId = req.query.subjectId;
  const questions = await Question.find(filter);
  res.json(questions);
});

// Delete a question by ID
app.delete('/api/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('DELETE request received for question ID:', id);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('Invalid ObjectId format:', id);
      return res.status(400).json({ error: 'Invalid question ID format' });
    }
    
    const question = await Question.findByIdAndDelete(id);
    if (!question) {
      console.log('Question not found for ID:', id);
      return res.status(404).json({ error: 'Question not found' });
    }
    console.log('Question deleted successfully:', question._id);
    res.json({ message: 'Question deleted successfully', deletedQuestion: question });
  } catch (err) {
    console.error('Error deleting question:', err);
    res.status(500).json({ error: err.message });
  }
});

// Question Paper APIs
app.post('/api/question-papers', async (req, res) => {
  try {
    console.log('Received question paper data:', JSON.stringify(req.body, null, 2));
    
    let paperData = { ...req.body };
    if (paperData.questions && Array.isArray(paperData.questions)) {
      paperData.questions = paperData.questions.map(q => {
        return {
          _id: q._id,
          text: q.text,
          marks: q.marks,
          type: q.type,
          options: q.options,
          answer: q.answer,
          topicId: q.topicId,
          subjectId: q.subjectId,
          classId: q.classId,
          boardId: q.boardId
        };
      });
    }
    
    const paper = new QuestionPaper(paperData);
    await paper.save();
    console.log('Question paper saved successfully:', paper._id);
    res.status(201).json(paper);
  } catch (err) {
    console.error('Error saving question paper:', err);
    console.error('Error stack:', err.stack);
    res.status(400).json({ error: err.message, details: err.toString() });
  }
});

app.get('/api/question-papers', async (req, res) => {
  try {
    const papers = await QuestionPaper.find().sort({ createdAt: -1 });
    res.json(papers);
  } catch (err) {
    console.error('Error fetching question papers:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/question-papers/:id', async (req, res) => {
  try {
    const paper = await QuestionPaper.findById(req.params.id);
    if (!paper) {
      return res.status(404).json({ error: 'Question paper not found' });
    }
    res.json(paper);
  } catch (err) {
    console.error('Error fetching question paper:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/question-papers/:id', async (req, res) => {
  try {
    const paper = await QuestionPaper.findByIdAndDelete(req.params.id);
    if (!paper) {
      return res.status(404).json({ error: 'Question paper not found' });
    }
    res.json({ message: 'Question paper deleted successfully' });
  } catch (err) {
    console.error('Error deleting question paper:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== USER MANAGEMENT ====================

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
  status: { type: String, default: 'Active' },
  createdAt: { type: Date, default: Date.now }
});
const Admin = mongoose.model('Admin', adminSchema);

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNumber: { type: String, required: true, unique: true },
  email: { type: String },
  dateOfBirth: { type: String },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttributeValue' },
  boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttributeValue' },
  status: { type: String, default: 'Active' },
  totalScore: { type: Number, default: 0 },
  testsTaken: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});
const Student = mongoose.model('Student', studentSchema);

const testRecordSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  questionPaperId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionPaper', required: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  subjectName: { type: String },
  testDate: { type: Date, default: Date.now },
// Store detailed question results for review
  answers: { type: Array, default: [] }
});
const TestRecord = mongoose.model('TestRecord', testRecordSchema);

// Query schema for student queries
const querySchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  studentName: { type: String, required: true },
  rollNumber: { type: String, required: true },
  subject: { type: String },
  message: { type: String, required: true },
  status: { type: String, default: 'Pending' }, // Pending, Responded
  adminResponse: { type: String },
  createdAt: { type: Date, default: Date.now }
});
const Query = mongoose.model('Query', querySchema);

// Feedback schema for student feedback
const feedbackSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  studentName: { type: String, required: true },
  category: { type: String, default: 'General' }, // General, Website, Tests, Questions, Suggestions, Other
  rating: { type: Number, required: true, min: 1, max: 5 },
  message: { type: String, required: true },
  status: { type: String, default: 'New' }, // New, Reviewed, Addressed
  adminResponse: { type: String },
  createdAt: { type: Date, default: Date.now }
});
const Feedback = mongoose.model('Feedback', feedbackSchema);

// ==================== ADMIN APIs ====================

app.get('/api/admins', async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admins/:id', async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select('-password');
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admins/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email, status: 'Active' });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials or admin not found' });
    }
    if (admin.password !== password) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    res.json({ 
      message: 'Login successful', 
      admin: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admins', async (req, res) => {
  try {
    const admin = new Admin(req.body);
    await admin.save();
    res.status(201).json(admin);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/admins/:id', async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    const admin = await Admin.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    res.json(admin);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/admins/:id', async (req, res) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    res.json({ message: 'Admin deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admins/:id/status', async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    admin.status = admin.status === 'Active' ? 'Inactive' : 'Active';
    await admin.save();
    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== STUDENT APIs ====================

app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find()
      .populate('classId', 'valueName')
      .populate('boardId', 'valueName');
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('classId', 'valueName')
      .populate('boardId', 'valueName');
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function parseDate(dateStr) {
  if (!dateStr) return null;
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  
  const monthNameMatch = dateStr.match(/^(\d{1,2})-([A-Za-z]+)-(\d{4})$/);
  if (monthNameMatch) {
    const day = monthNameMatch[1];
    const monthName = monthNameMatch[2];
    const year = monthNameMatch[3];
    const monthIndex = monthNames.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
    if (monthIndex !== -1) {
      const month = String(monthIndex + 1).padStart(2, '0');
      return { day, month, year, formatted: `${day}-${month}-${year}` };
    }
  }
  
  const dashMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dashMatch) {
    const day = dashMatch[1].padStart(2, '0');
    const month = dashMatch[2].padStart(2, '0');
    const year = dashMatch[3];
    return { day, month, year, formatted: `${day}-${month}-${year}` };
  }
  
  return null;
}

function normalizeDateForComparison(dateStr1, dateStr2) {
  const parsed1 = parseDate(dateStr1);
  const parsed2 = parseDate(dateStr2);
  
  if (!parsed1 || !parsed2) {
    return dateStr1.toLowerCase() === dateStr2.toLowerCase();
  }
  
  return parsed1.formatted === parsed2.formatted;
}

app.post('/api/students/login', async (req, res) => {
  try {
    const { name, rollNumber, dateOfBirth } = req.body;
    
    console.log('Student login attempt:', { name, rollNumber, dateOfBirth });
    
    const student = await Student.findOne({
      rollNumber: rollNumber,
      status: 'Active'
    });
    
    console.log('Student found in DB:', student);
    
    if (!student) {
      return res.status(401).json({ error: 'Invalid credentials or student not found' });
    }
    
    if (name && student.name) {
      if (student.name.toLowerCase() !== name.toLowerCase()) {
        return res.status(401).json({ error: 'Invalid credentials or student not found' });
      }
    }
    
    if (dateOfBirth && student.dateOfBirth) {
      if (!normalizeDateForComparison(dateOfBirth, student.dateOfBirth)) {
        return res.status(401).json({ error: 'Invalid credentials or student not found' });
      }
    }
    
    let className = null;
    let boardName = null;
    
    if (student.classId) {
      const classValue = await AttributeValue.findById(student.classId);
      className = classValue ? classValue.valueName : null;
    }
    
    if (student.boardId) {
      const boardValue = await AttributeValue.findById(student.boardId);
      boardName = boardValue ? boardValue.valueName : null;
    }
    
    console.log('Login successful for student:', student.name);
    res.json({ 
      message: 'Login successful', 
      student: { 
        _id: student._id, 
        name: student.name, 
        rollNumber: student.rollNumber,
        dateOfBirth: student.dateOfBirth,
        classId: student.classId,
        className: className,
        boardId: student.boardId,
        boardName: boardName
      } 
    });
  } catch (err) {
    console.error('Student login error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.classId === "" || data.classId === null || data.classId === undefined) {
      delete data.classId;
    }
    if (data.boardId === "" || data.boardId === null || data.boardId === undefined) {
      delete data.boardId;
    }
    
    console.log("Creating student with data:", data);
    const student = new Student(data);
    await student.save();
    res.status(201).json(student);
  } catch (err) {
    console.error("Error creating student:", err);
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.classId === "" || data.classId === null || data.classId === undefined) {
      delete data.classId;
    }
    if (data.boardId === "" || data.boardId === null || data.boardId === undefined) {
      delete data.boardId;
    }
    
    const student = await Student.findByIdAndUpdate(req.params.id, data, { new: true })
      .populate('classId', 'valueName')
      .populate('boardId', 'valueName');
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/students/:id/status', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    student.status = student.status === 'Active' ? 'Inactive' : 'Active';
    await student.save();
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/students/:id/score', async (req, res) => {
  try {
    const { score, incrementTest } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    if (score !== undefined) {
      student.totalScore += score;
    }
    if (incrementTest) {
      student.testsTaken += 1;
    }
    await student.save();
    res.json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/students/class/:classId', async (req, res) => {
  try {
    const students = await Student.find({ classId: req.params.classId })
      .populate('classId', 'valueName')
      .populate('boardId', 'valueName');
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/students/board/:boardId', async (req, res) => {
  try {
    const students = await Student.find({ boardId: req.params.boardId })
      .populate('classId', 'valueName')
      .populate('boardId', 'valueName');
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== TEST RECORDS APIs ====================

app.get('/api/test-records/:studentId', async (req, res) => {
  try {
    const records = await TestRecord.find({ studentId: req.params.studentId })
      .sort({ testDate: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/test-records', async (req, res) => {
  try {
    const { studentId, questionPaperId, score, totalQuestions, correctAnswers, subjectName, answers } = req.body;
    
    const testRecord = new TestRecord({
      studentId,
      questionPaperId,
      score,
      totalQuestions,
      correctAnswers: correctAnswers,
      subjectName,
      testDate: new Date(),
      answers: answers || []
    });
    await testRecord.save();
    
    const student = await Student.findById(studentId);
    if (student) {
      student.totalScore += score;
      student.testsTaken += 1;
      await student.save();
    }
    
    res.status(201).json(testRecord);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get detailed test record with question results
app.get('/api/test-records/detail/:recordId', async (req, res) => {
  try {
    const record = await TestRecord.findById(req.params.recordId)
      .populate('studentId', 'name rollNumber')
      .populate('questionPaperId');
    
    if (!record) {
      return res.status(404).json({ error: 'Test record not found' });
    }
    
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE test record - allows admin to delete a student's attempt so they can retake
app.delete('/api/test-records/:id', async (req, res) => {
  try {
    const testRecord = await TestRecord.findById(req.params.id);
    if (!testRecord) {
      return res.status(404).json({ error: 'Test record not found' });
    }
    
    // Optionally: revert student's score
    const student = await Student.findById(testRecord.studentId);
    if (student) {
      student.totalScore = Math.max(0, student.totalScore - testRecord.score);
      student.testsTaken = Math.max(0, student.testsTaken - 1);
      await student.save();
    }
    
    await TestRecord.findByIdAndDelete(req.params.id);
    res.json({ message: 'Test record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check if student has already attempted a specific question paper
app.get('/api/test-records/check/:studentId/:questionPaperId', async (req, res) => {
  try {
    const { studentId, questionPaperId } = req.params;
    const existingRecord = await TestRecord.findOne({ 
      studentId, 
      questionPaperId 
    });
    res.json({ hasAttempted: !!existingRecord, record: existingRecord });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/seed-admin', async (req, res) => {
  try {
    const existingAdmin = await Admin.findOne({ email: 'admin@qms.com' });
    if (existingAdmin) {
      return res.json({ message: 'Admin already exists', admin: existingAdmin });
    }
    const admin = new Admin({
      name: 'Admin',
      email: 'admin@qms.com',
      password: 'admin123',
      role: 'admin',
      status: 'Active'
    });
    await admin.save();
    res.json({ message: 'Default admin created', admin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== QUERY APIs ====================

// Student submits a query
app.post('/api/queries', async (req, res) => {
  try {
    const { studentId, studentName, rollNumber, subject, message } = req.body;
    
    const query = new Query({
      studentId,
      studentName,
      rollNumber,
      subject,
      message,
      status: 'Pending'
    });
    await query.save();
    res.status(201).json(query);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get queries for a specific student
app.get('/api/queries/student/:studentId', async (req, res) => {
  try {
    const queries = await Query.find({ studentId: req.params.studentId })
      .sort({ createdAt: -1 });
    res.json(queries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all queries (for admin)
app.get('/api/queries', async (req, res) => {
  try {
    const queries = await Query.find().sort({ createdAt: -1 });
    res.json(queries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin responds to a query
app.put('/api/queries/:id/respond', async (req, res) => {
  try {
    const { adminResponse } = req.body;
    const query = await Query.findByIdAndUpdate(
      req.params.id,
      { 
        adminResponse,
        status: 'Responded'
      },
      { new: true }
    );
    if (!query) {
      return res.status(404).json({ error: 'Query not found' });
    }
    res.json(query);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a query
app.delete('/api/queries/:id', async (req, res) => {
  try {
    const query = await Query.findByIdAndDelete(req.params.id);
    if (!query) {
      return res.status(404).json({ error: 'Query not found' });
    }
    res.json({ message: 'Query deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== FEEDBACK APIs ====================

// Student submits feedback
app.post('/api/feedback', async (req, res) => {
  try {
    const { studentId, studentName, category, rating, message } = req.body;
    
    const feedback = new Feedback({
      studentId,
      studentName,
      category: category || 'General',
      rating,
      message,
      status: 'New'
    });
    await feedback.save();
    res.status(201).json(feedback);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get feedback for a specific student
app.get('/api/feedback/student/:studentId', async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ studentId: req.params.studentId })
      .sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all feedback (for admin)
app.get('/api/feedback', async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin responds to feedback
app.put('/api/feedback/:id/respond', async (req, res) => {
  try {
    const { adminResponse, status } = req.body;
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { 
        adminResponse,
        status: status || 'Reviewed'
      },
      { new: true }
    );
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    res.json(feedback);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete feedback
app.delete('/api/feedback/:id', async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    res.json({ message: 'Feedback deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(5000, () => console.log('Server running on port 5000'));
