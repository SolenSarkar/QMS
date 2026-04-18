const mongoose = require('mongoose');

async function createTestStudent07() {
  await mongoose.connect('mongodb+srv://solensarkar3938_db_user:lwPIoY6wx6dSuNkl@cluster0.exnkgdp.mongodb.net/qms');
  console.log('Connected to MongoDB');

  const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rollNumber: { type: String, required: true, unique: true },
    dateOfBirth: { type: String },
    classId: mongoose.Schema.Types.ObjectId,
    boardId: mongoose.Schema.Types.ObjectId,
    status: { type: String, default: 'Active' },
    totalScore: { type: Number, default: 0 },
    testsTaken: { type: Number, default: 0 }
  });
  const Student = mongoose.model('Student', studentSchema);

  // Check if roll 07 exists
  const existing = await Student.findOne({ rollNumber: '07' });
  if (existing) {
    console.log('Student roll 07 already exists:', existing);
    await mongoose.disconnect();
    return;
  }

  // Create new student matching roll 05 data
  const newStudent = new Student({
    name: 'SOLEN SARKAR',
    rollNumber: '07',
    dateOfBirth: '30-10-2001',
    classId: '6984cd3af7f0537e982f6753', // Class 7
    boardId: '69837ab63543a682105bd51e', // ICSE
    status: 'Active'
  });

  await newStudent.save();
  console.log('Created test student roll 07:', newStudent);

  await mongoose.disconnect();
  console.log('Disconnected');
}

createTestStudent07().catch(console.error);

