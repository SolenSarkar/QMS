require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
  origin: "*"
}));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB Atlas (with database name)
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://solensarkar3938_db_user:lwPIoY6wx6dSuNkl@cluster0.exnkgdp.mongodb.net/qms';
mongoose.connect(mongoUri);

// Multer setup for image uploads
// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// NEW: Student answer uploads directory
const studentAnswersDir = path.join(__dirname, 'uploads/student-answers');
if (!fs.existsSync(studentAnswersDir)) {
  fs.mkdirSync(studentAnswersDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'question-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for question images
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'), false);
    }
  }
});

// NEW: Multer for student answer images (4MB limit)
const studentAnswerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const studentId = req.body.studentId || req.params.studentId || 'unknown';
    const studentDir = path.join(studentAnswersDir, studentId);
    fs.mkdirSync(studentDir, { recursive: true });
    cb(null, studentDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `answer-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const studentAnswerUpload = multer({
  storage: studentAnswerStorage,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed for answers'), false);
    }
  }
});

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
  answer: { type: String, required: false },
  imageUrl: { type: String, required: false }
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

app.delete('/api/question-paper-permits/:id', async (req, res) => {
  try {
    const permit = await QuestionPaperPermit.findByIdAndDelete(req.params.id);
    if (!permit) {
      return res.status(404).json({ error: 'Permit not found' });
    }
    res.json({ message: 'Permit deleted successfully' });
  } catch (err) {
    console.error('Error deleting permit:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add a question (JSON or FormData with image)
app.post('/api/questions', upload.single('image'), async (req, res) => {
  try {
    console.log('Creating question with data:', req.body);
    
    const questionData = {
      boardId: req.body.boardId ? new mongoose.Types.ObjectId(req.body.boardId) : null,
      classId: req.body.classId ? new mongoose.Types.ObjectId(req.body.classId) : null,
      subjectId: req.body.subjectId ? new mongoose.Types.ObjectId(req.body.subjectId) : null,
      topicId: req.body.topicId ? new mongoose.Types.ObjectId(req.body.topicId) : null,
      marks: parseInt(req.body.marks),
      type: req.body.type,
      options: req.body.options ? JSON.parse(req.body.options) : [],
      text: req.body.text,
      answer: req.body.answer,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl || null
    };
    
    console.log('Question data prepared:', questionData);
    const q = new Question(questionData);
    await q.save();
    console.log('Question saved successfully:', q._id);
    res.json(q);
  } catch (err) {
    console.error('Error saving question:', err);
    res.status(400).json({ error: err.message });
  }
});


// Get questions - FIXED: Handle ObjectId/string query param matching
app.get('/api/questions', async (req, res) => {
  try {
    console.log('Questions query params:', req.query);
    
    const filter = {};
    
    if (req.query.classId) {
      const classId = mongoose.Types.ObjectId.isValid(req.query.classId) 
        ? new mongoose.Types.ObjectId(req.query.classId)
        : req.query.classId;
      filter.classId = classId;
    }
    
    if (req.query.subjectId) {
      const subjectId = mongoose.Types.ObjectId.isValid(req.query.subjectId)
        ? new mongoose.Types.ObjectId(req.query.subjectId)
        : req.query.subjectId;
      filter.subjectId = subjectId;
    }
    
    console.log('Questions filter applied:', filter);
    const questions = await Question.find(filter);
    console.log(`Found ${questions.length} questions matching filter`);
    
    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions', details: error.message });
  }
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
          boardId: q.boardId,
          imageUrl: q.imageUrl
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
  answers: { 
    type: [{
      questionText: String,
      options: [String],
      selectedAnswer: mongoose.Schema.Types.Mixed,
      correctAnswer: mongoose.Schema.Types.Mixed,
      isCorrect: Boolean,
      marks: Number,
      imageUrl: { type: String, default: null }  // NEW: Student answer image
    }], 
    default: [] 
  }
});
const TestRecord = mongoose.model('TestRecord', testRecordSchema);

// Query schema for student queries
const querySchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  studentName: { type: String, required: true },
  rollNumber: { type: String, required: true },
  subject: { type: String },
  message: { type: String, required: true },
  status: { type: String, default: 'Pending' },
  adminResponse: { type: String },
  createdAt: { type: Date, default: Date.now }
});
const Query = mongoose.model('Query', querySchema);

// Feedback schema for student feedback
const feedbackSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  studentName: { type: String, required: true },
  category: { type: String, default: 'General' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  message: { type: String, required: true },
  status: { type: String, default: 'New' },
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

// Helper function for ObjectId validation
function validateObjectId(id, modelName = 'ID') {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(`Invalid ${modelName} format`);
    error.status = 400;
    throw error;
  }
  return id;
}

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
    const studentId = validateObjectId(req.params.id, 'student ID');
    const student = await Student.findById(studentId)
      .populate('classId', 'valueName')
      .populate('boardId', 'valueName');
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (err) {
    if (err.status === 400) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

function parseDate(dateStr) {
  if (!dateStr) return null;
  
  dateStr = dateStr.trim().toLowerCase().replace(/[\s]+/g, '-');
  
  const monthMapFull = {
    'january': '01', 'february': '02', 'march': '03', 'april': '04', 'may': '05', 'june': '06',
    'july': '07', 'august': '08', 'september': '09', 'october': '10', 'november': '11', 'december': '12'
  };
  
  const monthMapShort = {
    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
    'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
  };
  
  const monthMap = { ...monthMapFull, ...monthMapShort };
  
  // Full month name: "30-october-2001"
  let match = dateStr.match(/^(\d{1,2})-(january|february|march|april|may|june|july|august|september|october|november|december)-(\d{4})$/i);
  if (match) {
    const day = match[1].padStart(2, '0');
    const monthName = match[2].toLowerCase().trim();
    const year = match[3];
    const month = monthMap[monthName];
    if (month) {
      const result = {day, month, year, formatted: `${day}-${month}-${year}` };
      console.log(`parseDate FULL "${dateStr}" → `, result);
      return result;
    }
  }
  
  // Short month name: "30-oct-2001"
  match = dateStr.match(/^(\d{1,2})-(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)-(\d{4})$/i);
  if (match) {
    const day = match[1].padStart(2, '0');
    const monthName = match[2].toLowerCase().trim();
    const year = match[3];
    const month = monthMap[monthName];
    if (month) {
      const result = {day, month, year, formatted: `${day}-${month}-${year}` };
      console.log(`parseDate SHORT "${dateStr}" → `, result);
      return result;
    }
  }
  
  // Numeric: "30-10-2001"
  match = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    const result = { day, month, year, formatted: `${day}-${month}-${year}` };
    console.log(`parseDate NUMERIC "${dateStr}" → `, result);
    return result;
  }
  
  console.log(`parseDate FAILED on: "${dateStr}"`);
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

app.get('/api/students/login', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed', message: 'Login endpoint requires POST method. Use POST to login.' });
});

app.post('/api/students/login', async (req, res) => {
  console.log('=== STUDENT LOGIN ATTEMPT ===');
  console.log('Raw request body:', req.body);
  try {
    const { name: rawName, rollNumber: rawRoll, dateOfBirth: rawDob } = req.body;
    
    const name = rawName ? rawName.toString().trim() : '';
    const rollNumber = rawRoll ? rawRoll.toString().trim() : '';
    const dateOfBirth = rawDob ? rawDob.toString().trim() : '';
    
    console.log('Student login attempt (trimmed):', { name, rollNumber, dateOfBirth });
    
    const student = await Student.findOne({
      rollNumber: rollNumber,
      status: 'Active'
    });
    
    console.log('Student found in DB:', student);
    
    if (!student) {
      return res.status(401).json({ error: 'Invalid credentials or student not found' });
    }
    
    if (name && student.name) {
      if (student.name.toLowerCase().trim() !== name.toLowerCase()) {
        return res.status(401).json({ error: 'Invalid credentials or student not found' });
      }
    }
    
    if (dateOfBirth && student.dateOfBirth) {
      const parsedInput = parseDate(dateOfBirth);
      const parsedDb = parseDate(student.dateOfBirth);
      console.log('🔍 DOB DEBUG:', { inputRaw: dateOfBirth, dbRaw: student.dateOfBirth });
      console.log('🔍 DOB PARSED:', { input: parsedInput?.formatted, db: parsedDb?.formatted });
      if (!parsedInput || !parsedDb || parsedInput.formatted !== parsedDb.formatted) {
        console.log('❌ DOB MISMATCH - rejecting login');
        return res.status(401).json({ error: 'Invalid DOB. Expected format: DD-MMM-YYYY (e.g., 30-October-2001)' });
      }
      console.log('✅ DOB MATCH - continuing login');
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
    const studentId = validateObjectId(req.params.id, 'student ID');
    const data = { ...req.body };
    if (data.classId === "" || data.classId === null || data.classId === undefined) {
      delete data.classId;
    }
    if (data.boardId === "" || data.boardId === null || data.boardId === undefined) {
      delete data.boardId;
    }
    
    const student = await Student.findByIdAndUpdate(studentId, data, { new: true })
      .populate('classId', 'valueName')
      .populate('boardId', 'valueName');
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (err) {
    if (err.status === 400) {
      return res.status(400).json({ error: err.message });
    }
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    const studentId = validateObjectId(req.params.id, 'student ID');
    const student = await Student.findByIdAndDelete(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    if (err.status === 400) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/students/:id/status', async (req, res) => {
  try {
    const studentId = validateObjectId(req.params.id, 'student ID');
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    student.status = student.status === 'Active' ? 'Inactive' : 'Active';
    await student.save();
    res.json(student);
  } catch (err) {
    if (err.status === 400) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/students/:id/score', async (req, res) => {
  try {
    const studentId = validateObjectId(req.params.id, 'student ID');
    const { score, incrementTest } = req.body;
    const student = await Student.findById(studentId);
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
    if (err.status === 400) {
      return res.status(400).json({ error: err.message });
    }
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

// NEW: Test records summary for TestCard
app.get('/api/test-records-summary/:studentId', async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Count available tests: active permits for unique question papers in the student's class
    let totalAvailable = 0;
    let uniquePaperIds = new Set();
    if (student.classId) {
      // Get class name for fallback matching (papers may have only string 'class' field)
      const classValue = await AttributeValue.findById(student.classId);
      const className = classValue ? classValue.valueName : null;
      
      const paperQuery = className 
        ? { $or: [{ classId: student.classId }, { class: className }] }
        : { classId: student.classId };
        
      const papers = await QuestionPaper.find(paperQuery);
      const paperObjectIds = papers.map(p => p._id);

      const now = new Date();
      const permits = await QuestionPaperPermit.find({
        questionPaperId: { $in: paperObjectIds },
        startDate: { $lte: now },
        endDate: { $gte: now }
      });

      // Count unique question papers to avoid duplicate permits inflating the count
      permits.forEach(permit => {
        const pid = permit.questionPaperId ? permit.questionPaperId.toString() : null;
        if (pid) uniquePaperIds.add(pid);
      });
      totalAvailable = uniquePaperIds.size;
    }

    // Count completed tests ONLY for papers with active permits
    const testsTaken = await TestRecord.countDocuments({
      studentId: req.params.studentId,
      questionPaperId: { $in: Array.from(uniquePaperIds) }
    });

    const pending = Math.max(0, totalAvailable - testsTaken);
    const summary = {
      total: totalAvailable,
      completed: testsTaken,
      pending: pending
    };
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/test-records', studentAnswerUpload.array('answerImages'), async (req, res) => {
  try {
    let testData = {};
    let hasImages = req.files && req.files.length > 0;
    
    if (hasImages) {
      // FormData submission with images
      testData.studentId = req.body.studentId;
      testData.questionPaperId = req.body.questionPaperId;
      testData.score = parseInt(req.body.score);
      testData.totalQuestions = parseInt(req.body.totalQuestions);
      testData.correctAnswers = parseInt(req.body.correctAnswers);
      testData.subjectName = req.body.subjectName;
      
      // Parse answers JSON and match images
      const answersJson = JSON.parse(req.body.answersData);
      testData.answers = answersJson.map((answer, index) => {
        const imageFile = req.files.find(f => f.fieldname === `answerImage_${index}`);
        if (imageFile) {
          answer.imageUrl = `/uploads/student-answers/${testData.studentId}/${imageFile.filename}`;
        }
        return answer;
      });
    } else {
      // Regular JSON submission (backward compatibility)
      testData = req.body;
    }
    
    const testRecord = new TestRecord({
      ...testData,
      testDate: new Date()
    });
    await testRecord.save();
    
    const student = await Student.findById(testData.studentId);
    if (student) {
      student.totalScore += testData.score;
      student.testsTaken += 1;
      await student.save();
    }
    
    res.status(201).json(testRecord);
  } catch (err) {
    console.error('Test record save error:', err);
    res.status(400).json({ error: err.message });
  }
});

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

app.delete('/api/test-records/:id', async (req, res) => {
  try {
    const testRecord = await TestRecord.findById(req.params.id);
    if (!testRecord) {
      return res.status(404).json({ error: 'Test record not found' });
    }
    
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

app.get('/api/queries/student/:studentId', async (req, res) => {
  try {
    const queries = await Query.find({ studentId: req.params.studentId })
      .sort({ createdAt: -1 });
    res.json(queries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/queries', async (req, res) => {
  try {
    const queries = await Query.find().sort({ createdAt: -1 });
    res.json(queries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

app.get('/api/feedback/student/:studentId', async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ studentId: req.params.studentId })
      .sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/feedback', async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

// ==================== STATIC FILES & SPA ROUTING ====================

// Serve static files from the dist folder (production build)
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Catch-all route: serve index.html for any non-API GET request (SPA routing)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
