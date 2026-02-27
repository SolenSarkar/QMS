const mongoose = require('mongoose');

async function updatePasskey() {
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

  // Update English subject's passkey
  const result = await AttributeValue.findByIdAndUpdate(
    '6988b3ef0da2a908d366ee09',
    { passkey: 'eng123' },
    { new: true }
  );
  
  console.log('Updated:', result);

  await mongoose.disconnect();
}

updatePasskey().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
