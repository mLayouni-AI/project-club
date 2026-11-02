// Simple test to check if we can make a login request
const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login request...');
    
    const response = await axios.post('http://localhost:8000/api/members/auth/login/', {
      email: 'admin@alienscoder.com',
      password: 'admin123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Success! Response:', response.data);
  } catch (error) {
    console.log('Error occurred:');
    if (error.response) {
      // Server responded with error status
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
      console.log('Headers:', error.response.headers);
    } else if (error.request) {
      // Request was made but no response received
      console.log('No response received:', error.request);
    } else {
      // Something else happened
      console.log('Error message:', error.message);
    }
  }
}

testLogin();