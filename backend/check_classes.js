const mongoose = require('mongoose');

async function checkClasses() {
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
    passkey: String
  });

  const Attribute = mongoose.model('Attribute', attributeSchema);
  const AttributeValue = mongoose.model('AttributeValue', valueSchema);

  // Get Class attribute
  const classAttr = await Attribute.findOne({ name: 'Class' });
  if (!classAttr) {
    console.log('ERROR: Class attribute not found!');
    await mongoose.disconnect();
    return;
  }

  console.log('Class attribute ID:', classAttr._id);

  // Get all classes
  const classes = await AttributeValue.find({ attributeId: classAttr._id, status: 'Active' });
  console.log('\nActive Classes:');
  classes.forEach(c => console.log(`  - ${c.valueName} (${c._id})`));

  await mongoose.disconnect();
}

checkClasses().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
