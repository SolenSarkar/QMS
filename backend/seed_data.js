const mongoose = require('mongoose');

async function seedDatabase() {
  // Connect to MongoDB Atlas
  await mongoose.connect('mongodb+srv://solensarkar3938_db_user:lwPIoY6wx6dSuNkl@cluster0.exnkgdp.mongodb.net/qms');
  console.log('Connected to MongoDB');

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
    },
    stream: {
      type: String,
      required: false
    }
  });

  const Attribute = mongoose.model('Attribute', attributeSchema);
  const AttributeValue = mongoose.model('AttributeValue', valueSchema);

  // Clear existing data (optional - comment out if you want to keep existing data)
  // await Attribute.deleteMany({});
  // await AttributeValue.deleteMany({});
  // console.log('Cleared existing data');

  // 1. Create Attributes
  const attributesData = [
    { name: 'Board', status: 'Active' },
    { name: 'Class', status: 'Active' },
    { name: 'Subject', status: 'Active' },
    { name: 'Topic', status: 'Active' }
  ];

  const createdAttributes = {};

  for (const attrData of attributesData) {
    let attr = await Attribute.findOne({ name: attrData.name });
    if (!attr) {
      attr = await Attribute.create(attrData);
      console.log(`Created attribute: ${attrData.name}`);
    } else {
      console.log(`Attribute already exists: ${attrData.name}`);
    }
    createdAttributes[attrData.name] = attr;
  }

  // 2. Create Values for Board
  const boardValues = ['CBSE', 'ICSE', 'State Board'];
  const createdBoardValues = [];
  for (const val of boardValues) {
    let existing = await AttributeValue.findOne({ attributeId: createdAttributes['Board']._id, valueName: val });
    if (!existing) {
      existing = await AttributeValue.create({
        attributeId: createdAttributes['Board']._id,
        valueName: val,
        status: 'Active'
      });
      console.log(`Created Board value: ${val}`);
    } else {
      console.log(`Board value already exists: ${val}`);
    }
    createdBoardValues.push(existing);
  }

  // 3. Create Values for Class
  const classValues = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
  const createdClassValues = [];
  for (const val of classValues) {
    let existing = await AttributeValue.findOne({ attributeId: createdAttributes['Class']._id, valueName: val });
    if (!existing) {
      existing = await AttributeValue.create({
        attributeId: createdAttributes['Class']._id,
        valueName: val,
        status: 'Active'
      });
      console.log(`Created Class value: ${val}`);
    } else {
      console.log(`Class value already exists: ${val}`);
    }
    createdClassValues.push(existing);
  }

  // 4. Create Values for Subject (linked to classes)
  const subjectData = [
    { name: 'Math', classes: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'] },
    { name: 'Science', classes: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'] },
    { name: 'English', classes: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'] },
    { name: 'Hindi', classes: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'] },
    { name: 'Physics', classes: ['Class 11', 'Class 12'] },
    { name: 'Chemistry', classes: ['Class 11', 'Class 12'] },
    { name: 'Biology', classes: ['Class 11', 'Class 12'] }
  ];

  const createdSubjectValues = [];
  for (const subj of subjectData) {
    let existing = await AttributeValue.findOne({ attributeId: createdAttributes['Subject']._id, valueName: subj.name });
    if (!existing) {
      // Find the first class in the list to link to
      const classVal = createdClassValues.find(c => c.valueName === subj.classes[0]);
      existing = await AttributeValue.create({
        attributeId: createdAttributes['Subject']._id,
        valueName: subj.name,
        status: 'Active',
        classId: classVal ? classVal._id : null
      });
      console.log(`Created Subject value: ${subj.name}`);
    } else {
      console.log(`Subject value already exists: ${subj.name}`);
    }
    createdSubjectValues.push(existing);
  }

  // 5. Create Values for Topic (linked to subjects)
  const topicData = [
    { name: 'Algebra', subject: 'Math' },
    { name: 'Geometry', subject: 'Math' },
    { name: 'Arithmetic', subject: 'Math' },
    { name: 'Numbers', subject: 'Math' },
    { name: 'Physics Basics', subject: 'Science' },
    { name: 'Chemistry Basics', subject: 'Science' },
    { name: 'Biology Basics', subject: 'Science' },
    { name: 'Plants', subject: 'Science' },
    { name: 'Animals', subject: 'Science' },
    { name: 'Grammar', subject: 'English' },
    { name: 'Writing', subject: 'English' },
    { name: 'Reading', subject: 'English' },
    { name: 'Poetry', subject: 'English' },
    { name: 'Hindi Grammar', subject: 'Hindi' },
    { name: 'Hindi Writing', subject: 'Hindi' }
  ];

  for (const topic of topicData) {
    let existing = await AttributeValue.findOne({ attributeId: createdAttributes['Topic']._id, valueName: topic.name });
    if (!existing) {
      const subjectVal = createdSubjectValues.find(s => s.valueName === topic.subject);
      existing = await AttributeValue.create({
        attributeId: createdAttributes['Topic']._id,
        valueName: topic.name,
        status: 'Active',
        subjectId: subjectVal ? subjectVal._id : null
      });
      console.log(`Created Topic value: ${topic.name}`);
    } else {
      console.log(`Topic value already exists: ${topic.name}`);
    }
  }

  console.log('\n=== Seed completed successfully! ===');
  console.log('Attributes created:', Object.keys(createdAttributes));
  console.log('Board values:', createdBoardValues.map(v => v.valueName).join(', '));
  console.log('Class values:', createdClassValues.map(v => v.valueName).join(', '));
  console.log('Subject values:', createdSubjectValues.map(v => v.valueName).join(', '));

  await mongoose.disconnect();
  console.log('\nDisconnected from MongoDB');
}

seedDatabase().catch(err => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
