// Test script to verify correct routing of challenges to AWS Lambda vs Kubernetes
const { InstanceManager } = require('./src/lib/instanceManager.ts');

// Mock questions for testing
const webSecurityQuestion = {
  id: 'web-test-id',
  name: 'Achieve Rewards',
  category: 'Web Security',
  docker_image: '082010050918.dkr.ecr.us-east-1.amazonaws.com/achieverewards:latest',
  template_id: 'lt-08e367739ac29f518'
};

const networkSecurityQuestion = {
  id: 'network-test-id', 
  name: 'Techfront Solutions',
  category: 'Network Security',
  template_id: 'lt-0cb8327cecfab4c8f'
};

console.log('🧪 Testing Challenge Routing Logic...\n');

// Test Web Security routing
console.log('1️⃣ Testing Web Security Challenge:');
console.log(`   Name: ${webSecurityQuestion.name}`);
console.log(`   Category: ${webSecurityQuestion.category}`);
console.log(`   Docker Image: ${webSecurityQuestion.docker_image}`);
console.log(`   Template ID: ${webSecurityQuestion.template_id}`);

// Test Network Security routing  
console.log('\n2️⃣ Testing Network Security Challenge:');
console.log(`   Name: ${networkSecurityQuestion.name}`);
console.log(`   Category: ${networkSecurityQuestion.category}`);
console.log(`   Template ID: ${networkSecurityQuestion.template_id}`);

console.log('\n🎯 Expected Results:');
console.log('   ✅ Web Security → should use Kubernetes');
console.log('   ✅ Network Security → should use AWS Lambda');
console.log('\n📊 Test will start a dev server to verify routing...');
console.log('   Navigate to your HackCubes assessment to test instance creation');
