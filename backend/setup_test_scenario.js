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

const studentSchema = new mongoose.Schema({
  name: String,
  rollNumber: String,
  classId: mongoose.Schema.Types.ObjectId,
  status: String
});
const Student = mongoose.model('Student', studentSchema);

const questionPaperSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  classId: mongoose.Schema.Types.ObjectId,
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

async function setupScenario() {
  console.log('🌱 === SETTING UP TEST SCENARIO ===');
  console.log('DB connected:', mongoose.connection.readyState === 1 ? '✅' : '❌');

  const now = new Date();
  const mathPaperId = '69a872abdd849f8f5345b5a6'; // Class 7 Math
  const englishPaperId = '69e488486b1d7b2bf653499f'; // Class 7 English
  
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
  console.log(`   English Paper ID: ${englishPaperId}`);
  console.log(`   Student SOLEN(05) ID: ${solenStudentId}`);

  // 1. ACTIVE PERMIT for Math (ensure it exists)
  const existingMathPermit = await QuestionPaperPermit.findOne({
    questionPaperId: mathPaperId,
    startDate: { $lte: now },
    endDate: { $gte: now }
  });
  
  if (!existingMathPermit) {
    const permit = new QuestionPaperPermit({
      questionPaperId: mathPaperId,
      startDate: new Date(now.getTime() - 24*60*60*1000), // yesterday
      endDate: new Date(now.getTime() + 2*24*60*60*1000),  // +2 days  
      timeLimit: 60
    });
    await permit.save();
    console.log('✅ Added ACTIVE permit for Math:', permit._id);
  } else {
    console.log('ℹ️ Active permit for Math already exists');
  }

  // 2. ACTIVE PERMIT for English (create if not exists)
  const existingEnglishPermit = await QuestionPaperPermit.findOne({
    questionPaperId: englishPaperId,
    startDate: { $lte: now },
    endDate: { $gte: now }
  });
  
  if (!existingEnglishPermit) {
    const permit = new QuestionPaperPermit({
      questionPaperId: englishPaperId,
      startDate: new Date(now.getTime() - 24*60*60*1000), // yesterday
      endDate: new Date(now.getTime() + 2*24*60*60*1000),  // +2 days  
      timeLimit: 60
    });
    await permit.save();
    console.log('✅ Added ACTIVE permit for English:', permit._id);
  } else {
    console.log('ℹ️ Active permit for English already exists');
  }

  // 3. Clean up extra test records for SOLEN(05) - keep only 1 for Math
  const existingTests = await TestRecord.find({ 
    studentId: solenStudentId 
  }).sort({ testDate: -1 });
  
  console.log(`   Found ${existingTests.length} existing test records for SOLEN(05)`);
  
  // Keep only the most recent test record for Math, delete others
  let mathRecordKept = false;
  for (const test of existingTests) {
    const paperId = test.questionPaperId.toString();
    if (paperId === mathPaperId && !mathRecordKept) {
      mathRecordKept = true;
      console.log('ℹ️ Keeping test record for Math:', test._id);
    } else {
      await TestRecord.findByIdAndDelete(test._id);
      console.log('🗑️ Deleted extra test record:', test._id);
    }
  }
  
  // 4. Create test record for Math if none exists
  if (!mathRecordKept) {
    const testRecord = new TestRecord({
      studentId: solenStudentId,
      questionPaperId: mathPaperId,
      score: 14,
      totalQuestions: 20,
      correctAnswers: 14,
      subjectName: 'Mathematics',
      testDate: new Date(Date.now() - 24*60*60*1000), // yesterday
      answers: []
    });
    await testRecord.save();
    console.log('✅ Added test record for Math:', testRecord._id);
  }

  // 5. Verify final state
  const finalPermits = await QuestionPaperPermit.find({
    startDate: { $lte: now },
    endDate: { $gte: now }
  });
  const finalRecords = await TestRecord.find({ studentId: solenStudentId });
  
  console.log('\n📊 FINAL STATE:');
  console.log(`   Active Permits (Available): ${finalPermits.length}`);
  console.log(`   Test Records (Completed): ${finalRecords.length}`);
  console.log(`   Pending: ${Math.max(0, finalPermits.length - finalRecords.length)}`);
  console.log('\n🎉 SCENARIO SETUP COMPLETE!');
  console.log('Expected TestCard: Available: 2 | Completed: 1 | Pending: 1');
  
  mongoose.connection.close();
}

setupScenario().catch(err => {
  console.error('❌ Setup error:', err);
  mongoose.connection.close();
});

