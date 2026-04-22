const mongoose = require('mongoose');

async function debugDOB() {
  await mongoose.connect('mongodb+srv://solensarkar3938_db_user:lwPIoY6wx6dSuNkl@cluster0.exnkgdp.mongodb.net/qms');
  
  const studentSchema = new mongoose.Schema({
    name: String,
    rollNumber: String,
    dateOfBirth: String,
    status: String,
    classId: mongoose.Schema.Types.ObjectId,
    boardId: mongoose.Schema.Types.ObjectId
  });
  const Student = mongoose.model('Student', studentSchema);

  const student = await Student.findOne({ rollNumber: '07' });
  console.log('Full student 07 document:', JSON.stringify(student, null, 2));

  await mongoose.disconnect();
}

debugDOB().catch(console.error);

