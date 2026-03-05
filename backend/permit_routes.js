// Question Paper Permit schema - Add this to your server.js
// These are additional routes for question paper permits

/*
To add to backend/server.js:

1. Add this schema after QuestionPaper definition:
*/
// const questionPaperPermitSchema = new mongoose.Schema({
//   questionPaperId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionPaper', required: true },
//   startDate: { type: Date, required: true },
//   endDate: { type: Date, required: true },
//   timeLimit: { type: Number, required: true },
//   createdAt: { type: Date, default: Date.now }
// });
// const QuestionPaperPermit = mongoose.model('QuestionPaperPermit', questionPaperPermitSchema);

/*
2. Add these API routes:
*/
// app.post('/api/question-paper-permits', async (req, res) => {
//   try {
//     const { questionPaperId, startDate, endDate, timeLimit } = req.body;
//     const paper = await QuestionPaper.findById(questionPaperId);
//     if (!paper) {
//       return res.status(404).json({ error: 'Question paper not found' });
//     }
//     const permit = new QuestionPaperPermit({
//       questionPaperId,
//       startDate: new Date(startDate),
//       endDate: new Date(endDate),
//       timeLimit
//     });
//     await permit.save();
//     res.status(201).json(permit);
//   } catch (err) {
//     console.error('Error saving permit:', err);
//     res.status(400).json({ error: err.message });
//   }
// });

// app.get('/api/question-paper-permits', async (req, res) => {
//   try {
//     const permits = await QuestionPaperPermit.find().populate('questionPaperId').sort({ createdAt: -1 });
//     res.json(permits);
//   } catch (err) {
//     console.error('Error fetching permits:', err);
//     res.status(500).json({ error: err.message });
//   }
// });

// app.get('/api/question-paper-permits/:questionPaperId', async (req, res) => {
//   try {
//     const permits = await QuestionPaperPermit.find({ questionPaperId: req.params.questionPaperId }).populate('questionPaperId');
//     res.json(permits);
//   } catch (err) {
//     console.error('Error fetching permits:', err);
//     res.status(500).json({ error: err.message });
//   }
// });
