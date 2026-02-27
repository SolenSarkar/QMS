const mongoose = require('mongoose');

async function checkPasskeys() {
  await mongoose.connect('mongodb+srv://solensarkar3938_db_user:lwPIoY6wx6dSuNkl@cluster0.exnkgdp.mongodb.net/qms');
  console.log('Connected to MongoDB\n');

  const attributeSchema = new mongoose.Schema({
    name: String,
    status: String
  });
  const valueSchema = new mongoose.Schema({
    attributeId: mongoose.Schema.Types.ObjectId,
    valueName: String,
    status: String,
    subjectId: { type: mongoose.Schema.Types.ObjectId, required: false },
    classId: { type: mongoose.Schema.Types.ObjectId, required: false },
    stream: { type: String, required: false },
    passkey: { type: String, required: false, default: '' }
  });

  const Attribute = mongoose.model('Attribute', attributeSchema);
  const AttributeValue = mongoose.model('AttributeValue', valueSchema);

  // Get Subject attribute
  const subjectAttr = await Attribute.findOne({ name: 'Subject' });
  if (!subjectAttr) {
    console.log('ERROR: Subject attribute not found!');
    await mongoose.disconnect();
    return;
  }

  console.log('Subject attribute ID:', subjectAttr._id);

  // Get all subjects
  const subjects = await AttributeValue.find({ attributeId: subjectAttr._id });
  console.log('\nTotal subjects found:', subjects.length);
  
  // Show subjects with passkeys
  const subjectsWithPasskeys = subjects.filter(s => s.passkey && s.passkey !== '');
  console.log('Subjects with passkeys:', subjectsWithPasskeys.length);
  
  console.log('\n=== All Subjects (showing first 10) ===');
  subjects.slice(0, 10).forEach(s => {
    console.log(`- ${s.valueName}: classId=${s.classId}, passkey="${s.passkey}"`);
  });

  await mongoose.disconnect();
  console.log('\nDisconnected from MongoDB');
}

checkPasskeys().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
