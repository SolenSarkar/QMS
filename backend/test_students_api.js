const mongoose = require('mongoose');

async function testStudentsAPI() {
  // Connect to MongoDB Atlas
  await mongoose.connect('mongodb+srv://solensarkar3938_db_user:lwPIoY6wx6dSuNkl@cluster0.exnkgdp.mongodb.net/qms');
  console.log('Connected to MongoDB\n');

  // Define schemas
  const studentSchema = new mongoose.Schema({
    name: String,
    rollNumber: String,
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttributeValue' },
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttributeValue' },
    status: String
  });
  
  const Student = mongoose.model('Student', studentSchema);

  // Test: Get all students with populated classId and boardId
  console.log('=== Test: Fetching all students ===');
  const students = await Student.find()
    .populate('classId', 'valueName')
    .populate('boardId', 'valueName');
  
  console.log('Students found:', students.length);
  students.forEach(s => {
    console.log(`\nStudent: ${s.name}`);
    console.log(`  rollNumber: ${s.rollNumber}`);
    console.log(`  classId: ${JSON.stringify(s.classId)}`);
    console.log(`  boardId: ${JSON.stringify(s.boardId)}`);
  });

  await mongoose.disconnect();
  console.log('\nDisconnected from MongoDB');
}

testStudentsAPI().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
