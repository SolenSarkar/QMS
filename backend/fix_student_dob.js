const mongoose = require('mongoose');

async function fixStudentDOB() {
  await mongoose.connect('mongodb+srv://solensarkar3938_db_user:lwPIoY6wx6dSuNkl@cluster0.exnkgdp.mongodb.net/qms');
  console.log('Connected to MongoDB');

  const studentSchema = new mongoose.Schema({
    name: String,
    rollNumber: String,
    dateOfBirth: String,
    status: String
  });
  const Student = mongoose.model('Student', studentSchema);

  const student = await Student.findOne({ rollNumber: '07' });
  if (!student) {
    console.log('Student 07 not found');
    await mongoose.disconnect();
    return;
  }

  console.log('Before:', { name: student.name, rollNumber: student.rollNumber, dob: student.dateOfBirth });

  student.dateOfBirth = '30-October-2001';
  await student.save();

  console.log('After fix:', { name: student.name, rollNumber: student.rollNumber, dob: student.dateOfBirth });

  await mongoose.disconnect();
  console.log('Fixed and disconnected');
}

fixStudentDOB().catch(console.error);

