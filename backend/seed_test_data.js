const mongoose = require('mongoose');

// Connect (same as server)
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://solensarkar3938_db_user:lwPIoY6wx6dSuNkl@cluster0.exnkgdp.mongodb.net/qms';
mongoose.connect(mongoUri);

// Schemas
const questionPaperPermitSchema = new mongoose.Schema({
  questionPaperId: mongoose.Schema.Types.ObjectId,
  startDate: Date,
  endDate: Date,
  timeLimit: Number
});
const QuestionPaperPermit = mongoose.model('QuestionPaperPermit', questionPaperPermitSchema);

// Add missing schemas
const studentSchema = new mongoose.Schema({
  name: String,
  rollNumber: String,
  classId: mongoose.Schema.Types.ObjectId,
  status: String
});
const Student = mongoose.model('Student', studentSchema);

const questionPaperSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  class: String,
  subject: String
});
const QuestionPaper = mongoose.model('QuestionPaper', questionPaperSchema);

const testRecordSchema = new mongoose.Schema({
  studentId: mongoose.Schema.Types.ObjectId,
  questionPaperId: mongoose.Schema.Types.ObjectId,
  score: Number,
  totalQuestions: Number,
  correctAnswers: Number,
  subjectName: String,
  testDate: Date,
  answers: Array
});
const TestRecord = mongoose.model('TestRecord', testRecordSchema);

async function seedData() {
  console.log('🌱 === SEEDING TEST DATA ===');
  console.log('DB connected:', mongoose.connection.readyState === 1 ? '✅' : '❌');

  const now = new Date();
  const mathPaperId = '69a872abdd849f8f5345b5a6'; // Class 7 Math
  
  // Get SOLEN(05)
  const solenStudent = await Student.findOne({rollNumber: '05', status: 'Active'});
  if (!solenStudent) {
    console.log('❌ Student SOLEN(05) not found');
    mongoose.connection.close();
    return;
  }
  const solenStudentId = solenStudent._id;
  
  console.log('Using:');
  console.log(`   Math Paper ID: ${mathPaperId}`);
  console.log(`   Student SOLEN(05) ID: ${solenStudentId}`);


  // 1. ACTIVE PERMIT (now → +2 days, 60min)
  const existingActive = await QuestionPaperPermit.findOne({
    questionPaperId: mathPaperId,
    startDate: { $lte: now },
    endDate: { $gte: now }
  });
  
  if (!existingActive) {
    const permit = new QuestionPaperPermit({
      questionPaperId: mathPaperId,
      startDate: new Date(now.getTime() - 24*60*60*1000), // yesterday
      endDate: new Date(now.getTime() + 2*24*60*60*1000),  // +2 days  
      timeLimit: 60
    });
    await permit.save();
    console.log('✅ Added ACTIVE permit:', permit._id);
  } else {
    console.log('ℹ️ Active permit already exists');
  }

  // 2. TEST RECORD for SOLEN(05)
  const existingTest = await TestRecord.findOne({ 
    studentId: solenStudentId, 
    questionPaperId: mathPaperId 
  });
  
  if (!existingTest) {
    const testRecord = new TestRecord({
      studentId: solenStudentId,
      questionPaperId: mathPaperId,
      score: 14,
      totalQuestions: 20,
      correctAnswers: 14,
      subjectName: 'Mathematics',
      testDate: new Date(Date.now() - 24*60*60*1000), // yesterday
      answers: [] // minimal
    });
    await testRecord.save();
    console.log('✅ Added test record:', testRecord._id);
  } else {
    console.log('ℹ️ Test record already exists');
  }

  console.log('\n🎉 SEED COMPLETE! Restart frontend → check StudentDashboard');
  console.log('Papers should show, TestCard: Total:1 Completed:1');
  
  mongoose.connection.close();
}

seedData().catch(err => {
  console.error('❌ Seed error:', err);
  mongoose.connection.close();
});

