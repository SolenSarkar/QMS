const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

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

// Schemas (same as original)
const attributeSchema = new mongoose.Schema({
  name: String,
  status: String
});
const Attribute = mongoose.model('Attribute', attributeSchema);

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

const questionPaperPermitSchema = new mongoose.Schema({
  questionPaperId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionPaper', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  timeLimit: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});
const QuestionPaperPermit = mongoose.model('QuestionPaperPermit', questionPaperPermitSchema);

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
      imageUrl: { type: String, default: null }
    }], 
    default: [] 
  }
});
const TestRecord = mongoose.model('TestRecord', testRecordSchema);

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

// FIXED parseDate function
function parseDate(dateStr) {
  if (!dateStr) return null;

  dateStr = dateStr.trim().toLowerCase();
  
  const monthMap = {
    'january': '01', 'february': '02', 'march': '03', 'april': '04', 'may': '05', 'june': '06',
    'july': '07', 'august': '08', 'september': '09', 'october': '10', 'november': '11', 'december': '12'
  };
  
  // Month name format: "30-October-2001" or "30 - October - 2001" 
  let match = dateStr.match(/^(\\d{1,2})\\s*-?\\s*([a-z]+)\\s*-?\\s*(\\d{4})$/i);
  if (match) {
    const day = match[1].padStart(2, '0');
    const monthName = match[2].toLowerCase().trim();
    const year = match[3];
    const month = monthMap[monthName];
    if (month) {
      return {day, month, year, formatted: `${day}-${month}-${year}` };
    }
  }
  
  // Numeric format: "30-10-2001" or "30 - 10 - 2001"
  match = dateStr.match(/^(\\d{1,2})\\s*-?\\s*(\\d{1,2})\\s*-?\\s*(\\d{4})$/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    return { day, month, year, formatted: `${day}-${month}-${year}` };
  }
  
  console.log(`parseDate failed on: "${dateStr}"`);
  return null;
}

// ... rest of APIs same as original server.js ...

// Attribute APIs (same)
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

// Value APIs (same)
app.get('/api/values/:attributeId', async (req, res) => {
  const values = await AttributeValue.find({ attributeId: req.params.attributeId });
  res.json(values);
});
app.post('/api/values', async (req, res) => {
  console.log('POST /api/values body:', req.body);
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
  const value = await AttributeValue.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(value);
});
app.delete('/api/values/:id', async (req, res) => {
  await AttributeValue.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// Question APIs (same as original)
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

app.get('/api/questions', async (req, res) => {
  try {
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
    const questions = await Question.find(filter);
    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions', details: error.message });
  }
});

app.delete('/api/questions/:id', async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json({ message: 'Question deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// FIXED Student login API
app.post('/api/students/login', async (req, res) => {
  try {
    const { name: rawName, rollNumber: rawRoll, dateOfBirth: rawDob } = req.body;
    
    const name = rawName ? rawName.toString().trim() : '';
    const rollNumber = rawRoll ? rawRoll.toString().trim() : '';
    const dateOfBirth = rawDob ? rawDob.toString().trim() : '';
    
    console.log('Student login attempt:', { name, rollNumber, dateOfBirth });
    
    const student = await Student.findOne({
      rollNumber: rollNumber,
      status: 'Active'
    });
    
    console.log('Student found:', student);
    
    if (!student) {
      return res.status(401).json({ error: 'Student not found or inactive' });
    }
    
    if (name && student.name.toLowerCase().trim() !== name.toLowerCase().trim()) {
      return res.status(401).json({ error: 'Name mismatch' });
    }
    
    if (dateOfBirth && student.dateOfBirth) {
      const parsedInput = parseDate(dateOfBirth);
      const parsedDb = parseDate(student.dateOfBirth);
      console.log('Parsed DOB input:', parsedInput, 'DB:', parsedDb);
      if (!parsedInput || !parsedDb || parsedInput.formatted !== parsedDb.formatted) {
        return res.status(401).json({ error: 'DOB mismatch' });
      }
    }
    
    // Get class and board names
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
    
    console.log('Login successful for:', student.name);
    res.json({ 
      message: 'Login successful', 
      student: { 
        _id: student._id, 
        name: student.name, 
        rollNumber: student.rollNumber,
        dateOfBirth: student.dateOfBirth,
        classId: student.classId,
        className,
        boardId: student.boardId,
        boardName
      } 
    });
  } catch (err) {
    console.error('Student login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add other APIs (students, admins, etc.) from original - abbreviated for brevity
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find().populate('classId', 'valueName').populate('boardId', 'valueName');
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(5000, () => console.log('Fixed server running on port 5000'));

