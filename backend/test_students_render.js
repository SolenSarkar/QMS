const fetch = require('node-fetch').default;

async function testStudentsRender() {
  try {
    const response = await fetch('https://qms-sjuv.onrender.com/api/students');
    const data = await response.json();
    console.log('Render /api/students Status:', response.status);
    console.log('Students:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

testStudentsRender();
