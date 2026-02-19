const mongoose = require('mongoose');

async function insertSubjectAndValues() {
  await mongoose.connect('mongodb+srv://solensarkar3938_db_user:lwPIoY6wx6dSuNkl@cluster0.exnkgdp.mongodb.net/qms');

  const Attribute = mongoose.model('Attribute', new mongoose.Schema({ name: String, status: String }));
  const AttributeValue = mongoose.model('AttributeValue', new mongoose.Schema({
    attributeId: mongoose.Schema.Types.ObjectId,
    valueName: String,
    status: String
  }));

  // Insert Subject attribute if not exists
  let subjectAttr = await Attribute.findOne({ name: 'Subject' });
  if (!subjectAttr) {
    subjectAttr = await Attribute.create({ name: 'Subject', status: 'Active' });
    console.log('Inserted Subject attribute:', subjectAttr);
  } else {
    console.log('Subject attribute already exists:', subjectAttr);
  }

  // Insert example values for Subject
  const values = [
    { attributeId: subjectAttr._id, valueName: 'Math', status: 'Active' },
    { attributeId: subjectAttr._id, valueName: 'Science', status: 'Active' }
  ];
  for (const val of values) {
    const exists = await AttributeValue.findOne({ attributeId: val.attributeId, valueName: val.valueName });
    if (!exists) {
      await AttributeValue.create(val);
      console.log('Inserted value:', val.valueName);
    } else {
      console.log('Value already exists:', val.valueName);
    }
  }

  await mongoose.disconnect();
  console.log('Done.');
}

insertSubjectAndValues();
