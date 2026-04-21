const mongoose = require('mongoose');

const mongoUri = 'mongodb+srv://solensarkar3938_db_user:lwPIoY6wx6dSuNkl@cluster0.exnkgdp.mongodb.net/qms';

async function testLoginQuery() {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rollNumber: { type: String, required: true, unique: true },
    dateOfBirth: { type: String },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttributeValue' },
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttributeValue' },
    status: { type: String, default: 'Active' },
    totalScore: { type: Number, default: 0 },
    testsTaken: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
  });
  const Student = mongoose.model('Student', studentSchema);

  // Test login query
  const rollNumber = '07';
  const status = 'Active';
  const student = await Student.findOne({ rollNumber, status });
  console.log('=== LOGIN QUERY TEST ===');
  console.log('Query:', { rollNumber, status });
  console.log('Found:', !!student);
  if (student) {
    console.log('student._id:', student._id);
    console.log('student.rollNumber:', `'${student.rollNumber}'`, `typeof: ${typeof student.rollNumber}`);
    console.log('student.name:', `'${student.name}'`);
    console.log('student.status:', `'${student.status}'`);
    console.log('student.dateOfBirth:', `'${student.dateOfBirth}'`);

    // Test name match
    const name = 'SOLEN SARKAR';
    const nameMatch = student.name.toLowerCase().trim() === name.toLowerCase().trim();
    console.log('Name match (SOLEN SARKAR):', nameMatch);

    // Test parseDate
    function parseDate(dateStr) {
      if (!dateStr) return null;
      dateStr = dateStr.trim();
      const monthMap = {
        'january': '01', 'february': '02', 'march': '03', 'april': '04', 'may': '05', 'june': '06',
        'july': '07', 'august': '08', 'september': '09', 'october': '10', 'november': '11', 'december': '12'
      };
      let match = dateStr.match(/^(\\d{1,2})\\s*-\\s*([a-zA-Z]+)\\s*-\\s*(\\d{4})$/i);
      if (match) {
        const day = match[1].padStart(2, '0');
        const monthName = match[2].toLowerCase().trim();
        const year = match[3];
        const month = monthMap[monthName];
        if (month) {
          return {day, month, year, formatted: `${day}-${month}-${year}` };
        }
      }
      match = dateStr.match(/^(\\d{1,2})\\s*-\\s*(\\d{1,2})\\s*-\\s*(\\d{4})$/);
      if (match) {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        const year = match[3];
        return { day, month, year, formatted: `${day}-${month}-${year}` };
      }
      return null;
    }

    const parsedDb = parseDate(student.dateOfBirth);
    const parsedNumInput = parseDate('30-10-2001');
    const parsedNameInput = parseDate('30-October-2001');
    console.log('\\n--- DOB Parse ---');
    console.log('DB parsed:', parsedDb);
    console.log('Num input parsed:', parsedNumInput);
    console.log('DB vs Num match:', parsedDb ? parsedDb.formatted === parsedNumInput.formatted : 'DB null');
    console.log('Name input parsed:', parsedNameInput);
    console.log('DB vs Name match:', parsedDb ? parsedDb.formatted === parsedNameInput.formatted : 'DB null');
    console.log('Name input parsed:', parsedNameInput);
    console.log('DB vs Name match:', parsedDb.formatted === parsedNameInput.formatted);
  }

  await mongoose.disconnect();
}

testLoginQuery().catch(console.error);
