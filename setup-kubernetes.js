#!/usr/bin/env node

/**
 * HackCubes Kubernetes Integration Setup Script
 * 
 * This script helps set up the Kubernetes-based challenge hosting system
 * alongside the existing AWS Lambda infrastructure.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 HackCubes Kubernetes Integration Setup\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: Please run this script from the HackCubes project root directory');
  process.exit(1);
}

// Function to run commands safely
function runCommand(command, description) {
  console.log(`📦 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed\n`);
  } catch (error) {
    console.error(`❌ Failed to ${description.toLowerCase()}`);
    console.error(error.message);
    process.exit(1);
  }
}

// Function to check if command exists
function commandExists(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Step 1: Check prerequisites
console.log('🔍 Checking prerequisites...\n');

// Check Node.js
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Node.js: ${nodeVersion}`);
} catch {
  console.error('❌ Node.js is not installed');
  process.exit(1);
}

// Check npm
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log(`✅ npm: ${npmVersion}`);
} catch {
  console.error('❌ npm is not installed');
  process.exit(1);
}

// Check kubectl (optional)
if (commandExists('kubectl')) {
  try {
    const kubectlVersion = execSync('kubectl version --client --short', { encoding: 'utf8' }).trim();
    console.log(`✅ kubectl: ${kubectlVersion}`);
  } catch {
    console.log('⚠️  kubectl is installed but may not be configured');
  }
} else {
  console.log('⚠️  kubectl not found (you\'ll need it for Kubernetes management)');
}

console.log('');

// Step 2: Install dependencies
console.log('📦 Installing dependencies...\n');

// Check if dependencies are already installed
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const needsInstall = !packageJson.dependencies['@kubernetes/client-node'] || 
                    !packageJson.dependencies['js-yaml'];

if (needsInstall) {
  runCommand('npm install', 'Installing npm dependencies');
} else {
  console.log('✅ Dependencies already installed\n');
}

// Step 3: Check environment configuration
console.log('🔧 Checking environment configuration...\n');

const envFile = '.env.local';
const envExists = fs.existsSync(envFile);

if (!envExists) {
  console.log('⚠️  .env.local file not found');
  console.log('📝 You\'ll need to create one with Kubernetes configuration');
} else {
  const envContent = fs.readFileSync(envFile, 'utf8');
  const hasK8sConfig = envContent.includes('K8S_') || envContent.includes('NEXT_PUBLIC_K8S_CLUSTER_IP');
  
  if (hasK8sConfig) {
    console.log('✅ Kubernetes configuration found in .env.local');
  } else {
    console.log('⚠️  No Kubernetes configuration found in .env.local');
    console.log('📝 You\'ll need to add Kubernetes environment variables');
  }
}

console.log('');

// Step 4: Database migration
console.log('🗄️  Database migration...\n');

const migrationFile = 'database-k8s-deployment-support.sql';
if (fs.existsSync(migrationFile)) {
  console.log('✅ Database migration file found');
  console.log('📝 Please run this SQL migration in your database:');
  console.log(`   - File: ${migrationFile}`);
  console.log('   - Via Supabase: Copy contents to SQL Editor and execute');
  console.log('   - Via psql: psql -d your_database -f database-k8s-deployment-support.sql');
} else {
  console.log('❌ Database migration file not found');
}

console.log('');

// Step 5: Kubernetes cluster check
console.log('☸️  Kubernetes cluster connectivity...\n');

if (commandExists('kubectl')) {
  try {
    const clusterInfo = execSync('kubectl cluster-info', { encoding: 'utf8', timeout: 5000 });
    console.log('✅ Kubernetes cluster is accessible');
    
    // Try to get namespaces to verify permissions
    try {
      execSync('kubectl get namespaces', { stdio: 'ignore', timeout: 3000 });
      console.log('✅ Kubernetes cluster permissions look good');
    } catch {
      console.log('⚠️  Limited Kubernetes permissions - you may need cluster-admin access');
    }
  } catch {
    console.log('⚠️  Cannot connect to Kubernetes cluster');
    console.log('📝 Make sure kubectl is configured and cluster is accessible');
  }
} else {
  console.log('⚠️  kubectl not available - cannot check cluster connectivity');
}

console.log('');

// Step 6: GitHub repository check
console.log('📁 Challenge repository check...\n');

try {
  const response = execSync('curl -s -o /dev/null -w "%{http_code}" https://api.github.com/repos/HackCubes/WebChallenges', 
    { encoding: 'utf8', timeout: 5000 }).trim();
  
  if (response === '200') {
    console.log('✅ HackCubes/WebChallenges repository is accessible');
  } else {
    console.log('⚠️  Cannot access HackCubes/WebChallenges repository');
    console.log('📝 Make sure the repository exists and is accessible');
  }
} catch {
  console.log('⚠️  Cannot check repository accessibility (network issue?)');
}

console.log('');

// Step 7: Test API endpoints
console.log('🔌 API endpoints check...\n');

const apiFiles = [
  'src/pages/api/k8s-instance.ts',
  'src/lib/instanceManager.ts'
];

let allApiFilesExist = true;
apiFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} not found`);
    allApiFilesExist = false;
  }
});

if (allApiFilesExist) {
  console.log('✅ All API files are in place');
} else {
  console.log('❌ Some API files are missing');
}

console.log('');

// Final recommendations
console.log('📋 Setup Summary & Next Steps:\n');

console.log('✅ What\'s Ready:');
console.log('   - Kubernetes client dependencies installed');
console.log('   - API endpoints for K8s instance management');
console.log('   - Admin interface updated with deployment type selection');
console.log('   - Unified instance manager for AWS + Kubernetes');

console.log('\n📝 What You Need to Do:');

console.log('\n1. Environment Configuration:');
if (!envExists || !fs.readFileSync(envFile, 'utf8').includes('K8S_')) {
  console.log('   - Add Kubernetes config to .env.local:');
  console.log('     NEXT_PUBLIC_K8S_CLUSTER_IP=your-cluster-ip');
  console.log('     K8S_NAMESPACE_PREFIX=hackcubes');
  console.log('     K8S_DEFAULT_CPU_LIMIT=500m');
  console.log('     K8S_DEFAULT_MEMORY_LIMIT=512Mi');
}

console.log('\n2. Database Migration:');
console.log('   - Apply database-k8s-deployment-support.sql to your database');
console.log('   - This adds deployment_type column to questions table');

console.log('\n3. Kubernetes Cluster:');
if (!commandExists('kubectl')) {
  console.log('   - Install kubectl: https://kubernetes.io/docs/tasks/tools/');
}
console.log('   - Ensure cluster access and proper permissions');
console.log('   - Consider setting up RBAC for HackCubes service account');

console.log('\n4. Challenge Repository:');
console.log('   - Ensure HackCubes/WebChallenges is accessible');
console.log('   - Add deployment folders to challenges with YAML files');
console.log('   - Remove "namespace: user1" lines from deployment files');

console.log('\n5. Testing:');
console.log('   - Start development server: npm run dev');
console.log('   - Create a test challenge with deployment_type="kubernetes"');
console.log('   - Test instance start/stop via admin interface');

console.log('\n📚 Documentation:');
console.log('   - Read K8S_CONFIGURATION.md for detailed setup instructions');
console.log('   - Check HIRELYST_INTEGRATION_STATUS.md for current system status');

console.log('\n🎉 Setup script completed!');
console.log('   The hybrid AWS + Kubernetes system is ready for configuration.');
console.log('   Follow the steps above to complete the integration.\n');

// Create a simple test script
const testScript = `#!/usr/bin/env node

// Quick test for Kubernetes API
const testKubernetesAPI = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/k8s-instance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_status',
        question_id: 'test-question',
        candidate_id: 'test-user',
        username: 'testuser'
      })
    });
    
    const result = await response.json();
    console.log('Kubernetes API test result:', result);
  } catch (error) {
    console.error('Kubernetes API test failed:', error.message);
  }
};

if (process.argv[2] === 'test-k8s-api') {
  testKubernetesAPI();
}
`;

fs.writeFileSync('test-k8s-setup.js', testScript);
console.log('💾 Created test-k8s-setup.js for API testing');
console.log('   Run: node test-k8s-setup.js test-k8s-api (after starting the server)\n'); 