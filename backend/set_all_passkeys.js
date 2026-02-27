const mongoose = require('mongoose');

async function setAllPasskeys() {
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

  // Get all Class 7 subjects
  const subjects = await AttributeValue.find({ classId: '6984cd3af7f0537e982f6753' });
  
  console.log('Found', subjects.length, 'Class 7 subjects');
  
  for (const s of subjects) {
    s.passkey = 'pass' + s.valueName;
    await s.save();
    console.log(`Set ${s.valueName} passkey to: ${s.passkey}`);
  }

  console.log('\n=== Verification ===');
  const updated = await AttributeValue.find({ classId: '6984cd3af7f0537e982f6753' });
  updated.forEach(s => console.log(`${s.valueName}: ${s.passkey}`));

  await mongoose.disconnect();
}

setAllPasskeys().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
