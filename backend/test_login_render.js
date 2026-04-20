const fetch = require('node-fetch').default;

async function testStudentLoginRender() {
  try {
    const response = await fetch('https://qms-sjuv.onrender.com/api/students/login', {
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
    console.log('Render login Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

testStudentLoginRender();
