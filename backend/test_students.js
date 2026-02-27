const mongoose = require('mongoose');

async function checkStudents() {
  await mongoose.connect('mongodb+srv://solensarkar3938_db_user:lwPIoY6wx6dSuNkl@cluster0.exnkgdp.mongodb.net/qms');
  console.log('Connected to MongoDB');

  const studentSchema = new mongoose.Schema({
    name: String,
    rollNumber: String,
    dateOfBirth: String,
    status: String
  });
  const Student = mongoose.model('Student', studentSchema);

  const students = await Student.find();
  console.log('\nTotal students:', students.length);
  
  students.forEach(s => {
    console.log(`- Name: ${s.name}, Roll: ${s.rollNumber}, DOB: ${s.dateOfBirth}, Status: ${s.status}`);
  });

  await mongoose.disconnect();
}

checkStudents().catch(console.error);
