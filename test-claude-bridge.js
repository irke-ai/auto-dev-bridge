#!/usr/bin/env node

const fetch = require('node-fetch');

async function testClaudeBridge() {
  const apiUrl = 'http://localhost:3001/api/claude-bridge';
  
  console.log('Testing Claude Bridge API...\n');
  
  // Test 1: Send a command
  console.log('Test 1: Sending command to create file...');
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Test command from claude-bridge API'
      })
    });
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log(`✅ Command file created: ${data.fileName}`);
    } else {
      console.log('❌ Failed to create command file');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 2: Check status
  console.log('Test 2: Checking status...');
  try {
    const response = await fetch(`${apiUrl}/status`);
    const data = await response.json();
    console.log('Status:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testClaudeBridge().catch(console.error);