const mongoose = require('mongoose');

async function setPasskeyTest() {
  await mongoose.connect('mongodb+srv://solensarkar3938_db_user:lwPIoY6wx6dSuNkl@cluster0.exnkgdp.mongodb.net/qms');
  console.log('Connected to MongoDB\n');

  const valueSchema = new mongoose.Schema({
    attributeId: mongoose.Schema.Types.ObjectId,
    valueName: String,
    status: String,
    classId: mongoose.Schema.Types.ObjectId,
    passkey: String
  });

  const AttributeValue = mongoose.model('AttributeValue', valueSchema);

  // Get Class 7 Mathematics subject
  const mathSubject = await AttributeValue.findOne({ valueName: 'Mathematics' });
  
  if (mathSubject) {
    // Set passkey directly
    mathSubject.passkey = 'test123';
    await mathSubject.save();
    console.log('Set passkey for Mathematics to: test123');
    
    // Read it back
    const updated = await AttributeValue.findOne({ valueName: 'Mathematics' });
    console.log('Read back passkey:', updated.passkey);
  } else {
    console.log('Mathematics subject not found');
  }

  await mongoose.disconnect();
}

setPasskeyTest().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
