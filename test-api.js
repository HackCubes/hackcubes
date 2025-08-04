#!/usr/bin/env node

// Quick test script to verify API endpoints
const fetch = require('node-fetch');

async function testAPI() {
  console.log('🧪 Testing HackCubes API Endpoints...\n');

  const baseURL = 'http://localhost:3000';

  try {
    // Test 1: Challenge API - Get Clue
    console.log('🔍 Testing challenge clue generation...');
    const clueResponse = await fetch(`${baseURL}/api/challenge/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getClue' })
    });

    if (clueResponse.ok) {
      const clueData = await clueResponse.json();
      console.log('✅ Challenge clue API working');
      console.log('   Encoded clue:', clueData.data.substring(0, 20) + '...');
      console.log('   Encoding type:', clueData.encoding);
    } else {
      console.log('❌ Challenge clue API failed:', clueResponse.status);
    }

    // Test 2: Challenge API - Generate Code
    console.log('\n🎯 Testing invite code generation...');
    const codeResponse = await fetch(`${baseURL}/api/challenge/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generateCode' })
    });

    if (codeResponse.ok) {
      const codeData = await codeResponse.json();
      console.log('✅ Invite code generation working');
      console.log('   Encoded invite code:', codeData.data.substring(0, 20) + '...');
      
      // Decode the invite code for testing
      const decodedCode = Buffer.from(codeData.data, 'base64').toString();
      console.log('   Decoded invite code:', decodedCode);

      // Test 3: Validate the generated code
      console.log('\n🔐 Testing invite code validation...');
      const validateResponse = await fetch(`${baseURL}/api/challenge/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: decodedCode })
      });

      if (validateResponse.ok) {
        const validateData = await validateResponse.json();
        console.log('✅ Invite code validation working');
        console.log('   Validation result:', validateData.message);
      } else {
        console.log('❌ Invite code validation failed:', validateResponse.status);
      }

    } else {
      console.log('❌ Invite code generation failed:', codeResponse.status);
    }

    console.log('\n🎉 API testing complete!');
    console.log('\n🚀 Your challenge system is ready!');
    console.log('   1. Visit http://localhost:3000/challenge');
    console.log('   2. Open browser console (F12)');
    console.log('   3. Type: hackCubesChallenge.start()');
    console.log('   4. Follow the challenge steps');

  } catch (error) {
    console.log('❌ API test failed:', error.message);
    console.log('\nMake sure your dev server is running: npm run dev');
  }
}

testAPI();
