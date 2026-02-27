const mongoose = require('mongoose');

async function cleanupDuplicates() {
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

  console.log('=== Cleaning up duplicate Class values ===');

  // Get all class values
  const allClassValues = await AttributeValue.find({ attributeId: classAttr._id });
  console.log(`Found ${allClassValues.length} total class values`);

  // Group by valueName (case-insensitive)
  const valueMap = new Map();
  for (const val of allClassValues) {
    const key = val.valueName.toLowerCase().trim();
    if (!valueMap.has(key)) {
      valueMap.set(key, []);
    }
    valueMap.get(key).push(val);
  }

  // Keep only one (the first) for each group, delete the rest
  let deletedCount = 0;
  for (const [key, values] of valueMap) {
    if (values.length > 1) {
      console.log(`\nDuplicate found: "${key}" - keeping first, deleting ${values.length - 1} duplicates`);
      // Keep the first one (with capital letter if exists)
      const toKeep = values[0];
      const toDelete = values.slice(1);
      
      for (const del of toDelete) {
        await AttributeValue.findByIdAndDelete(del._id);
        deletedCount++;
        console.log(`  Deleted: ${del.valueName}`);
      }
    }
  }

  console.log(`\n=== Cleanup complete ===`);
  console.log(`Total duplicates deleted: ${deletedCount}`);

  // Show remaining values
  const remainingValues = await AttributeValue.find({ attributeId: classAttr._id });
  console.log(`\nRemaining Class values (${remainingValues.length}):`);
  remainingValues.forEach(v => console.log(`  - ${v.valueName}`));

  await mongoose.disconnect();
  console.log('\nDisconnected from MongoDB');
}

cleanupDuplicates().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
