const mongoose = require('mongoose');

async function linkTopic() {
  await mongoose.connect('mongodb+srv://solensarkar3938_db_user:lwPIoY6wx6dSuNkl@cluster0.exnkgdp.mongodb.net/qms');
  console.log('Connected to MongoDB\n');

  const valueSchema = new mongoose.Schema({
    attributeId: mongoose.Schema.Types.ObjectId,
    valueName: String,
    status: String,
    classId: mongoose.Schema.Types.ObjectId,
    subjectId: mongoose.Schema.Types.ObjectId,
    passkey: String
  });

  const AttributeValue = mongoose.model('AttributeValue', valueSchema);

  // Update Algebra topic to link to Mathematics (Class 7)
  // Mathematics Class 7 ID: 6988b3dd0da2a908d366ee06
  const result = await AttributeValue.findByIdAndUpdate(
    '69a0728cccd92d171fed346d',
    { subjectId: '6988b3dd0da2a908d366ee06' },
    { new: true }
  );
  
  console.log('Updated topic:', result);

  await mongoose.disconnect();
}

linkTopic().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
