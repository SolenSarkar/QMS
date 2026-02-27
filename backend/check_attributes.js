const mongoose = require('mongoose');

async function checkAttributes() {
  await mongoose.connect('mongodb+srv://solensarkar3938_db_user:lwPIoY6wx6dSuNkl@cluster0.exnkgdp.mongodb.net/qms');
  console.log('Connected to MongoDB\n');

  const attributeSchema = new mongoose.Schema({
    name: String,
    status: String
  });
  const Attribute = mongoose.model('Attribute', attributeSchema);

  const attrs = await Attribute.find();
  console.log('All attributes:');
  attrs.forEach(a => console.log(`  - ${a.name} (${a._id})`));

  await mongoose.disconnect();
}

checkAttributes().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
