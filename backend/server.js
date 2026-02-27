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

// Value schema (add subjectId for topic dependency, classId, stream, and passkey)
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

// Get questions (optionally filter by classId and subjectId)
app.get('/api/questions', async (req, res) => {
  const filter = {};
  if (req.query.classId) filter.classId = req.query.classId;
  if (req.query.subjectId) filter.subjectId = req.query.subjectId;
  const questions = await Question.find(filter);
  res.json(questions);
});

// ==================== USER MANAGEMENT ====================

// Admin Schema
const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
  status: { type: String, default: 'Active' },
  createdAt: { type: Date, default: Date.now }
});
const Admin = mongoose.model('Admin', adminSchema);

// Student Schema
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

// Test Record Schema (for storing test history with dates)
const testRecordSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  subjectName: { type: String },
  testDate: { type: Date, default: Date.now }
});
const TestRecord = mongoose.model('TestRecord', testRecordSchema);

// ==================== ADMIN APIs ====================

// Get all admins
app.get('/api/admins', async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get admin by ID
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

// Admin login
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

// Create admin
app.post('/api/admins', async (req, res) => {
  try {
    const admin = new Admin(req.body);
    await admin.save();
    res.status(201).json(admin);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update admin
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

// Delete admin
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

// Toggle admin status
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

// Get all students
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

// Get student by ID
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

// Student login
app.post('/api/students/login', async (req, res) => {
  try {
    const { name, rollNumber, dateOfBirth } = req.body;
    const student = await Student.findOne({ 
      name, 
      rollNumber, 
      dateOfBirth,
      status: 'Active' 
    });
    if (!student) {
      return res.status(401).json({ error: 'Invalid credentials or student not found' });
    }
    res.json({ 
      message: 'Login successful', 
      student: { 
        _id: student._id, 
        name: student.name, 
        rollNumber: student.rollNumber,
        classId: student.classId,
        boardId: student.boardId
      } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create student
app.post('/api/students', async (req, res) => {
  try {
    // Filter out empty strings for optional ObjectId fields
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

// Update student
app.put('/api/students/:id', async (req, res) => {
  try {
    // Filter out empty strings for optional ObjectId fields
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

// Delete student
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

// Toggle student status
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

// Update student score
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

// Get students by class
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

// Get students by board
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

// Get test records for a student
app.get('/api/test-records/:studentId', async (req, res) => {
  try {
    const records = await TestRecord.find({ studentId: req.params.studentId })
      .sort({ testDate: -1 }); // Most recent first
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new test record
app.post('/api/test-records', async (req, res) => {
  try {
    const { studentId, score, totalQuestions, correctAnswers, subjectName } = req.body;
    
    // Create the test record
    const testRecord = new TestRecord({
      studentId,
      score,
      totalQuestions,
      correctAnswers,
      subjectName,
      testDate: new Date()
    });
    await testRecord.save();
    
    // Update student's total score and tests taken
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

// Seed default admin (run once)
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

app.listen(5000, () => console.log('Server running on port 5000'));
