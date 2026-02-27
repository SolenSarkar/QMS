const mongoose = require('mongoose');

async function checkClass7Subjects() {
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
    classId: mongoose.Schema.Types.ObjectId,
    passkey: String
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

  // Get Class 7 ID
  const class7 = await AttributeValue.findOne({ attributeId: subjectAttr._id, valueName: 'Class 7' });
  // Actually get from classes collection
  const classAttr = await Attribute.findOne({ name: 'Class' });
  const class7Data = await AttributeValue.findOne({ attributeId: classAttr._id, valueName: 'Class 7' });
  
  console.log('Class 7 ID:', class7Data._id);

  // Get all subjects
  const subjects = await AttributeValue.find({ attributeId: subjectAttr._id, status: 'Active' });
  
  // Filter for Class 7
  const class7Subjects = subjects.filter(s => {
    if (!s.classId) return false;
    return s.classId.toString() === class7Data._id.toString();
  });

  console.log('\nClass 7 Subjects:');
  class7Subjects.forEach(s => {
    console.log(`  - ${s.valueName}: classId=${s.classId}, passkey="${s.passkey}"`);
  });

  await mongoose.disconnect();
}

checkClass7Subjects().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
