const fs = require('fs');

const files = ['QuestionPapers.jsx', 'Results.jsx', 'StudentDashboard.jsx', 'UserManagement.jsx'];

files.forEach(f => {
  let content = fs.readFileSync('src/' + f, 'utf8');
  let original = content;
  
  // Replace template literal fetch(`/api/ with fetch(`https://qms-sjuv.onrender.com/api/
  content = content.replace(/fetch\(`\/api\//g, 'fetch(`https://qms-sjuv.onrender.com/api/');
  
  if (content !== original) {
    fs.writeFileSync('src/' + f, content);
    console.log('Updated src/' + f);
  }
});

console.log('Done!');
