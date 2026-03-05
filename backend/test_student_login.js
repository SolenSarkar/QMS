const fetch = require('node-fetch').default;

async function testStudentLogin() {
  try {
    const response = await fetch('http://localhost:5000/api/students/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'SOLEN SARKAR',
        rollNumber: '07',
        dateOfBirth: '30-10-2001'
      }),
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

testStudentLogin();
