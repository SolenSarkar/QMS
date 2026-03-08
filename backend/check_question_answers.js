const mongoose = require('mongoose');

async function checkQuestionAnswers() {
  await mongoose.connect('mongodb+srv://solensarkar3938_db_user:lwPIoY6wx6dSuNkl@cluster0.exnkgdp.mongodb.net/qms');
  console.log('Connected to MongoDB\n');

  // Define schemas
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

  // Get all questions with their type and answer
  console.log('=== Checking Question Types and Answers ===\n');
  const questions = await Question.find();
  
  console.log(`Total questions: ${questions.length}\n`);
  
  questions.forEach((q, idx) => {
    console.log("Question " + (idx + 1) + ":");
    console.log("  Type: " + q.type);
    console.log("  Answer: " + q.answer);
    console.log("  Answer type: " + typeof q.answer);
    
    // Check if answer looks like a valid letter
    if (q.type === 'single' || q.type === 'multiple') {
      if (q.answer && typeof q.answer === 'string') {
        const upperAnswer = q.answer.toUpperCase().trim();
        if (upperAnswer.length === 1 && upperAnswer >= 'A' && upperAnswer <= 'Z') {
          const index = upperAnswer.charCodeAt(0) - 65;
          console.log("  -> Answer " + upperAnswer + " converts to index " + index);
          if (q.options && q.options[index]) {
            console.log("  -> Option " + index + ": " + q.options[index]);
          } else {
            console.log("  -> ERROR: Index " + index + " is out of bounds for options (length: " + (q.options ? q.options.length : 0) + ")");
          }
        } else {
          console.log("  -> ERROR: Answer is not a valid single letter (A-Z)");
        }
      } else {
        console.log("  -> ERROR: Answer is not a valid string");
      }
    }
    console.log("");
  });

  // Also check question papers
  const questionPaperSchema = new mongoose.Schema({
    board: { type: String, required: false },
    class: { type: String, required: false },
    subject: { type: String, required: false },
    difficulty: { type: String, required: false },
    totalMarks: { type: Number, required: false },
    totalQuestions: { type: Number, required: false },
    questions: { type: Array, required: false },
    createdAt: { type: Date, default: Date.now }
  });
  const QuestionPaper = mongoose.model('QuestionPaper', questionPaperSchema);

  console.log('\n=== Checking Question Papers ===\n');
  const papers = await QuestionPaper.find();
  console.log(`Total question papers: ${papers.length}\n`);
  
  papers.forEach((paper, idx) => {
    console.log(`Paper ${idx + 1}: ${paper.subject} - ${paper.class}`);
    console.log(`  Questions: ${paper.questions?.length || 0}`);
    
    if (paper.questions && paper.questions.length > 0) {
      paper.questions.forEach((q, qIdx) => {
        console.log(`  Q${qIdx + 1}: type="${q.type}", answer="${q.answer}"`);
      });
    }
    console.log('');
  });

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

checkQuestionAnswers().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

