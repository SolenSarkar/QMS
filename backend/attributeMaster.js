const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB Atlas
mongoose.connect('mongodb+srv://solensarkar3938_db_user:lwPIoY6wx6dSuNkl@cluster0.exnkgdp.mongodb.net/', { useNewUrlParser: true, useUnifiedTopology: true });

// Attribute schema
const attributeSchema = new mongoose.Schema({
  name: String,
  status: String
});
const Attribute = mongoose.model('Attribute', attributeSchema);

// API to get all attributes
app.get('/api/attributes', async (req, res) => {
  const attrs = await Attribute.find();
  res.json(attrs);
});

// API to add a new attribute
app.post('/api/attributes', async (req, res) => {
  const attr = new Attribute(req.body);
  await attr.save();
  res.json(attr);
});

app.listen(5000, () => console.log('Server running on port 5000'));
