const mongoose = require('mongoose');

async function activateStudent07() {
  await mongoose.connect('mongodb+srv://solensarkar3938_db_user:lwPIoY6wx6dSuNkl@cluster0.exnkgdp.mongodb.net/qms');
  console.log('Connected to MongoDB');

  const studentSchema = new mongoose.Schema({
    name: String,
    rollNumber: String,
    status: String
  });
  const Student = mongoose.model('Student', studentSchema);

  const student = await Student.findOneAndUpdate(
    { rollNumber: '07' },
    { status: 'Active' },
    { new: true }
  );

  if (student) {
    console.log('Activated student roll 07:', student);
  } else {
    console.log('Student roll 07 not found');
  }

  await mongoose.disconnect();
  console.log('Disconnected');
}

activateStudent07().catch(console.error);
