const http = require('http');

const postData = JSON.stringify({
  questionPaperId: "507f1f77bcf86cd799439011",
  startDate: "2024-01-01T00:00:00.000Z",
  endDate: "2024-01-31T23:59:59.000Z",
  timeLimit: 60
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/question-paper-permits',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log('STATUS:', res.statusCode);
  console.log('HEADERS:', JSON.stringify(res.headers));
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(postData);
req.end();
