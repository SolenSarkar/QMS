const mongoose = require('mongoose');

// Same connection as server.js
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://solensarkar3938_db_user:lwPIoY6wx6dSuNkl@cluster0.exnkgdp.mongodb.net/qms';
mongoose.connect(mongoUri);

// Schemas (minimal for queries)
const valueSchema = new mongoose.Schema({
  attributeId: mongoose.Schema.Types.ObjectId,
  valueName: String,
  status: String,
  classId: mongoose.Schema.Types.ObjectId
});
const Value = mongoose.model('AttributeValue', valueSchema);

const questionPaperSchema = new mongoose.Schema({
  boardId: mongoose.Schema.Types.ObjectId,
  classId: mongoose.Schema.Types.ObjectId,
  subjectId: mongoose.Schema.Types.ObjectId,
  class: String,
  subject: String,
  difficulty: String,
  totalQuestions: Number,
  totalMarks: Number,
  questions: Array,
  createdAt: Date
});
const QuestionPaper = mongoose.model('QuestionPaper', questionPaperSchema);

const permitSchema = new mongoose.Schema({
  questionPaperId: mongoose.Schema.Types.ObjectId,
  startDate: Date,
  endDate: Date,
  timeLimit: Number,
  createdAt: Date
});
const QuestionPaperPermit = mongoose.model('QuestionPaperPermit', permitSchema);

const testRecordSchema = new mongoose.Schema({
  studentId: mongoose.Schema.Types.ObjectId,
  questionPaperId: mongoose.Schema.Types.ObjectId,
  score: Number,
  totalQuestions: Number
});
const TestRecord = mongoose.model('TestRecord', testRecordSchema);

const studentSchema = new mongoose.Schema({
  name: String,
  rollNumber: String,
  classId: mongoose.Schema.Types.ObjectId,
  status: String
});
const Student = mongoose.model('Student', studentSchema);

async function checkData() {
  console.log('🔍 === QMS DATA DIAGNOSTIC ===');
  console.log('Database connected:', mongoose.connection.readyState === 1 ? '✅ YES' : '❌ NO');

  // 1. Students (test ones)
  console.log('\n1️⃣ STUDENTS (Active):');
  const students = await Student.find({ status: 'Active' }).limit(5);
  students.forEach(s => {
    console.log(`   - ${s.name} (${s.rollNumber}) classId: ${s.classId}`);
  });

  // 2. Question Papers
  console.log('\n2️⃣ QUESTION PAPERS (total:', await QuestionPaper.countDocuments(), '):');
  const papers = await QuestionPaper.find().limit(3).populate('classId subjectId', 'valueName');
  papers.forEach(p => {
    console.log(`   - ${p.class} ${p.subject} (${p.difficulty}) id:${p._id} classId:${p.classId} created:${p.createdAt.toISOString().split('T')[0]}`);
  });

  // 3. Permits
  console.log('\n3️⃣ PERMITS (total:', await QuestionPaperPermit.countDocuments(), '):');
  const now = new Date();
  const permits = await QuestionPaperPermit.find({ 
    startDate: { $lte: now },
    endDate: { $gte: now } 
  }).populate('questionPaperId');
  console.log(`   Active now: ${permits.length}`);
  permits.forEach(p => {
    console.log(`   - Paper:${p.questionPaperId?.subject}-${p.questionPaperId?.class} ${p.startDate.toISOString()} → ${p.endDate.toISOString()}`);
  });

  // 4. Test Records
  console.log('\n4️⃣ TEST RECORDS (total:', await TestRecord.countDocuments(), '):');
  const records = await TestRecord.find().limit(3).populate('studentId questionPaperId', 'name rollNumber subject');
  records.forEach(r => {
    console.log(`   - Student:${r.studentId?.name}(${r.studentId?.rollNumber}) Paper:${r.questionPaperId?.subject} Score:${r.score}`);
  });

  mongoose.connection.close();
}

checkData().catch(console.error);

