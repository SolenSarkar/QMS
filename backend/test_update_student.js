const http = require('http');

const postData = JSON.stringify({
  name: "SOLEN SARKAR Updated",
  rollNumber: "07",
  dateOfBirth: "30-10-2001"
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/students/699d5d11058705577d5cce31',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Response status:', res.statusCode);
    console.log('Response body:');
    console.log(JSON.stringify(JSON.parse(data), null, 2));
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(postData);
req.end();
