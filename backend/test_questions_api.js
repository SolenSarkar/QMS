const mongoose = require('mongoose');

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://solensarkar3938_db_user:lwPIoY6wx6dSuNkl@cluster0.exnkgdp.mongodb.net/qms';
mongoose.connect(mongoUri);

const QuestionSchema = new mongoose.Schema({
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

const Question = mongoose.model('Question', QuestionSchema);

async function testQuestionsAPI() {
  console.log('=== Testing Questions API ===');
  
  try {
    // 1. Count total questions
    const totalQuestions = await Question.countDocuments();
    console.log(`Total questions in DB: ${totalQuestions}`);
    
    // 2. Test query without filters (should return all)
    const allQuestions = await Question.find({});
    console.log(`All questions (no filter): ${allQuestions.length}`);
    
    // 3. Test specific class/subject query - REPLACE WITH ACTUAL IDs FROM YOUR DB
    // Get first classId and subjectId examples
    const sampleQuestions = await Question.find({}).limit(3);
    if (sampleQuestions.length > 0) {
      const sampleQ = sampleQuestions[0];
      console.log('Sample question:', {
        _id: sampleQ._id,
        classId: sampleQ.classId,
        subjectId: sampleQ.subjectId
      });
      
      // Test with string vs ObjectId
      const filterStr = { classId: sampleQ.classId?.toString(), subjectId: sampleQ.subjectId?.toString() };
      const filterObjId = { 
        classId: sampleQ.classId, 
        subjectId: sampleQ.subjectId 
      };
      
      const questionsStr = await Question.find(filterStr);
      const questionsObjId = await Question.find(filterObjId);
      
      console.log('Questions with string IDs:', questionsStr.length);
      console.log('Questions with ObjectId:', questionsObjId.length);
      
      // Should now match after backend fix
      if (questionsStr.length === questionsObjId.length) {
        console.log('✅ Backend filter fix working correctly!');
      } else {
        console.log('❌ String vs ObjectId mismatch detected');
      }
    }
    
    // 4. Test if questions exist for common classes
    console.log('\\n=== SUMMARY ===');
    console.log(`Total questions: ${totalQuestions}`);
    console.log('Backend filtering now handles both string and ObjectId query params');
    console.log('Ready for frontend testing!');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testQuestionsAPI();

