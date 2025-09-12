#!/usr/bin/env node

// Test the challenge port mapping utility
const { getChallengePort, formatChallengeUrl } = require('./dist/challengeUtils');

console.log('🧪 Testing Challenge Port Utility Functions...\n');

// Test cases
const testCases = [
  {
    name: 'Financial Portfolio',
    docker_image: '082010050918.dkr.ecr.us-east-1.amazonaws.com/portfolio:latest',
    expectedPort: 5000
  },
  {
    name: 'AchieveRewards', 
    docker_image: '082010050918.dkr.ecr.us-east-1.amazonaws.com/achieverewards:latest',
    expectedPort: 5000
  },
  {
    name: 'Atlas Enterprise Portal',
    docker_image: '082010050918.dkr.ecr.us-east-1.amazonaws.com/atlas-frontend:latest',
    expectedPort: 5173
  },
  {
    name: 'TechCorp Portal',
    docker_image: '082010050918.dkr.ecr.us-east-1.amazonaws.com/techcorp:latest',
    expectedPort: 8080
  },
  {
    name: 'TechCON Conference',
    docker_image: '082010050918.dkr.ecr.us-east-1.amazonaws.com/conference:latest',
    expectedPort: 3000
  },
  {
    name: 'Project Integration Hub',
    docker_image: '082010050918.dkr.ecr.us-east-1.amazonaws.com/integration-frontend:latest',
    expectedPort: 80
  }
];

// Test getChalllengePort
console.log('1️⃣ Testing getChallengePort...');
testCases.forEach(test => {
  const actualPort = getChallengePort(test);
  const match = actualPort === test.expectedPort;
  console.log(`   ${match ? '✅' : '❌'} ${test.name}: ${actualPort} (expected: ${test.expectedPort})`);
});

// Test formatChallengeUrl
console.log('\n2️⃣ Testing formatChallengeUrl...');
const testUrls = [
  {
    ip: 'a80caf864f6ad48ac96855def96cefb9-2135924762.us-east-1.elb.amazonaws.com',
    question: { name: 'Financial Portfolio', docker_image: '082010050918.dkr.ecr.us-east-1.amazonaws.com/portfolio:latest' },
    expected: 'http://a80caf864f6ad48ac96855def96cefb9-2135924762.us-east-1.elb.amazonaws.com:5000'
  },
  {
    ip: 'pending',
    question: { name: 'Test' },
    expected: 'pending'
  },
  {
    ip: 'N/A',
    question: { name: 'Test' },
    expected: 'N/A'
  }
];

testUrls.forEach((test, i) => {
  const actualUrl = formatChallengeUrl(test.ip, test.question);
  const match = actualUrl === test.expected;
  console.log(`   ${match ? '✅' : '❌'} Test ${i + 1}: ${actualUrl}`);
  if (!match) {
    console.log(`       Expected: ${test.expected}`);
  }
});

console.log('\n🎉 Challenge port utility tests completed!');
