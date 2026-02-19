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

// Value schema (add subjectId for topic dependency, classId, and stream for class 11/12 subjects)
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
  // Enhanced debug log: print the request body and stream field
  console.log('POST /api/values body:', req.body);
  if ('stream' in req.body) {
    console.log('Stream field received:', req.body.stream);
  } else {
    console.log('Stream field NOT present in request body');
  }
  // If adding a topic, ensure subjectId is set if provided
  let body = { ...req.body };
  // Find attribute name for this attributeId
  if (body.attributeId) {
    const attr = await Attribute.findById(body.attributeId);
    if (attr && attr.name && attr.name.toLowerCase() === 'topic' && body.subjectId) {
      // Ensure subjectId is set for topic
      body.subjectId = body.subjectId;
    }
  }
  const value = new AttributeValue(body);
  await value.save();
  // Log the saved value to verify stream is stored
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


// Question schema
const questionSchema = new mongoose.Schema({
  boardId: { type: mongoose.Schema.Types.ObjectId, required: false },
  classId: { type: mongoose.Schema.Types.ObjectId, required: false },
  subjectId: { type: mongoose.Schema.Types.ObjectId, required: false },
  topicId: { type: mongoose.Schema.Types.ObjectId, required: false },
  marks: { type: Number, required: false },
  type: { type: String, required: false }, // 'single', 'multiple', 'text', 'numeric'
  options: { type: [String], required: false }, // for choice questions
  text: { type: String, required: false }, // question text
  answer: { type: String, required: false } // answer text or value
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

app.listen(5000, () => console.log('Server running on port 5000'));
