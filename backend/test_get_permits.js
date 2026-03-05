const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/question-paper-permits',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log('STATUS:', res.statusCode);
  
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

req.end();
