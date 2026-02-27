const mongoose = require('mongoose');

async function fixCasing() {
  // Connect to MongoDB Atlas
  await mongoose.connect('mongodb+srv://solensarkar3938_db_user:lwPIoY6wx6dSuNkl@cluster0.exnkgdp.mongodb.net/qms');
  console.log('Connected to MongoDB\n');

  // Define schemas
  const attributeSchema = new mongoose.Schema({
    name: String,
    status: String
  });
  const valueSchema = new mongoose.Schema({
    attributeId: mongoose.Schema.Types.ObjectId,
    valueName: String,
    status: String,
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false
    }
  });

  const Attribute = mongoose.model('Attribute', attributeSchema);
  const AttributeValue = mongoose.model('AttributeValue', valueSchema);

  // Find the Class attribute
  const classAttr = await Attribute.findOne({ name: 'Class' });
  if (!classAttr) {
    console.log('ERROR: Class attribute not found!');
    await mongoose.disconnect();
    return;
  }

  console.log('=== Fixing Class value casing ===');

  // Get all class values
  const allClassValues = await AttributeValue.find({ attributeId: classAttr._id });

  // Update each value to use consistent "Class X" format
  for (const val of allClassValues) {
    // Check if it matches "class X" pattern (lowercase)
    const match = val.valueName.toLowerCase().match(/^class\s+(\d+)$/);
    if (match) {
      const newName = `Class ${match[1]}`;
      await AttributeValue.findByIdAndUpdate(val._id, { valueName: newName });
      console.log(`  "${val.valueName}" -> "${newName}"`);
    }
  }

  console.log('\n=== Casing fix complete ===');

  // Show remaining values
  const remainingValues = await AttributeValue.find({ attributeId: classAttr._id });
  console.log(`\nRemaining Class values (${remainingValues.length}):`);
  remainingValues.forEach(v => console.log(`  - ${v.valueName}`));

  await mongoose.disconnect();
  console.log('\nDisconnected from MongoDB');
}

fixCasing().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
