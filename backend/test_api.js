const mongoose = require('mongoose');

async function testAPI() {
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

  // Test 1: Get all attributes
  console.log('=== Test 1: Fetching all attributes ===');
  const attrs = await Attribute.find();
  console.log('Attributes found:', attrs.length);
  attrs.forEach(a => console.log(`  - ${a.name} (${a.status})`));

  // Test 2: Get values for Board
  console.log('\n=== Test 2: Fetching Board values ===');
  const boardAttr = attrs.find(a => a.name.toLowerCase() === 'board');
  if (boardAttr) {
    const boardValues = await AttributeValue.find({ attributeId: boardAttr._id });
    console.log('Board values found:', boardValues.length);
    boardValues.forEach(v => console.log(`  - ${v.valueName}`));
  } else {
    console.log('ERROR: Board attribute not found!');
  }

  // Test 3: Get values for Class
  console.log('\n=== Test 3: Fetching Class values ===');
  const classAttr = attrs.find(a => a.name.toLowerCase() === 'class');
  if (classAttr) {
    const classValues = await AttributeValue.find({ attributeId: classAttr._id });
    console.log('Class values found:', classValues.length);
    classValues.forEach(v => console.log(`  - ${v.valueName}`));
  } else {
    console.log('ERROR: Class attribute not found!');
  }

  // Test 4: Get values for Subject
  console.log('\n=== Test 4: Fetching Subject values ===');
  const subjectAttr = attrs.find(a => a.name.toLowerCase() === 'subject');
  if (subjectAttr) {
    const subjectValues = await AttributeValue.find({ attributeId: subjectAttr._id });
    console.log('Subject values found:', subjectValues.length);
    subjectValues.forEach(v => console.log(`  - ${v.valueName}`));
  } else {
    console.log('ERROR: Subject attribute not found!');
  }

  // Test 5: Get values for Topic
  console.log('\n=== Test 5: Fetching Topic values ===');
  const topicAttr = attrs.find(a => a.name.toLowerCase() === 'topic');
  if (topicAttr) {
    const topicValues = await AttributeValue.find({ attributeId: topicAttr._id });
    console.log('Topic values found:', topicValues.length);
    topicValues.forEach(v => console.log(`  - ${v.valueName}`));
  } else {
    console.log('ERROR: Topic attribute not found!');
  }

  console.log('\n=== All tests completed ===');

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

testAPI().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
