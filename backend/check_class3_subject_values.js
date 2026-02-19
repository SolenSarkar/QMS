const mongoose = require('mongoose');

async function checkClass3SubjectValues() {
  await mongoose.connect('mongodb+srv://solensarkar3938_db_user:lwPIoY6wx6dSuNkl@cluster0.exnkgdp.mongodb.net/qms');

  const AttributeValue = mongoose.model('AttributeValue', new mongoose.Schema({
    attributeId: mongoose.Schema.Types.ObjectId,
    valueName: String,
    status: String,
    subjectId: mongoose.Schema.Types.ObjectId,
    classId: mongoose.Schema.Types.ObjectId
  }));

  // Find subject values for class 3
  // First, find the class 3 attribute id
  const class3Id = 'class3ObjectId'; // Replace with actual ObjectId for class 3

  // Find all values with classId = class3Id
  const values = await AttributeValue.find({ classId: class3Id });

  // Return valueName, classId, _id
  const result = values.map(v => ({ valueName: v.valueName, classId: v.classId, _id: v._id }));
  console.log(result);

  await mongoose.disconnect();
}

checkClass3SubjectValues();
