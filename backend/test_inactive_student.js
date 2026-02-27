const fetch = require('node-fetch').default;

async function testInactiveStudentLogin() {
  try {
    const response = await fetch('http://localhost:5000/api/students/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'SOLEN SARKAR',
        rollNumber: '05',
        dateOfBirth: '30-10-2001'
      }),
    });

    const data = await response.json();
    console.log('Testing INACTIVE student login:');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.status === 401) {
      console.log('\n✓ SUCCESS: Inactive student was correctly rejected!');
    } else {
      console.log('\n✗ FAILURE: Inactive student should have been rejected!');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

testInactiveStudentLogin();
