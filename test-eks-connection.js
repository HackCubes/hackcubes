#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

console.log('🔗 Testing EKS Connection...\n');

// Test environment variables
console.log('🔍 Environment Check:');
console.log(`   EKS_CLUSTER_NAME: ${process.env.EKS_CLUSTER_NAME}`);
console.log(`   EKS_CLUSTER_ENDPOINT: ${process.env.EKS_CLUSTER_ENDPOINT}`);
console.log(`   AWS_REGION: ${process.env.AWS_REGION}`);
console.log(`   AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? '✅ SET' : '❌ NOT SET'}`);
console.log(`   AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? '✅ SET' : '❌ NOT SET'}\n`);

// Use Kubernetes client directly for testing
const k8s = require('@kubernetes/client-node');

console.log('🔧 Setting up Kubernetes client for EKS...\n');

function createEKSKubeConfig() {
  const kc = new k8s.KubeConfig();
  
  const clusterName = process.env.EKS_CLUSTER_NAME;
  const endpoint = process.env.EKS_CLUSTER_ENDPOINT;
  const region = process.env.AWS_REGION;

  const cluster = {
    name: clusterName,
    server: endpoint,
    skipTLSVerify: true // For testing
  };

  const user = {
    name: `${clusterName}-user`,
    exec: {
      apiVersion: 'client.authentication.k8s.io/v1beta1',
      command: 'aws',
      args: [
        'eks',
        'get-token',
        '--cluster-name',
        clusterName,
        '--region',
        region,
        '--output',
        'json'
      ],
      env: [
        {
          name: 'AWS_REGION',
          value: region
        }
      ]
    }
  };

  const context = {
    name: `${clusterName}-context`,
    cluster: clusterName,
    user: `${clusterName}-user`
  };

  kc.loadFromOptions({
    clusters: [cluster],
    users: [user],
    contexts: [context],
    currentContext: `${clusterName}-context`
  });

  return kc;
}

async function testEKSConnection() {
  try {
    console.log('🔧 Creating EKS connection...');
    const kc = createEKSKubeConfig();
    const coreV1Api = kc.makeApiClient(k8s.CoreV1Api);

    console.log('🏗️ Testing namespace creation...');
    const testNamespace = 'test-financial-portfolio-connection';
    
    // Test creating namespace
    const namespaceManifest = {
      metadata: {
        name: testNamespace,
        labels: {
          'hackcubes.com/type': 'test',
          'hackcubes.com/challenge': 'financial-portfolio'
        }
      }
    };

    const result = await coreV1Api.createNamespace(namespaceManifest);
    console.log('✅ Namespace creation successful:', result.body.metadata.name);

    // Test listing namespaces to verify
    console.log('📋 Listing namespaces to verify...');
    const namespacesResponse = await coreV1Api.listNamespace();
    const namespaces = namespacesResponse.body.items;
    console.log('   Found namespaces:', namespaces.map(ns => ns.metadata.name).slice(0, 5));

    // Cleanup test namespace
    console.log('🧹 Cleaning up test namespace...');
    await coreV1Api.deleteNamespace(testNamespace);
    console.log('✅ Test namespace deleted');

    console.log('\n🎉 EKS connection test SUCCESSFUL! Your cluster is accessible.');
    
  } catch (error) {
    console.error('❌ EKS connection test FAILED:', error.message);
    
    if (error.message.includes('403') || error.message.includes('Forbidden')) {
      console.log('\n🔑 Permission Error - Possible Solutions:');
      console.log('   1. Add your user to EKS cluster access entries');
      console.log('   2. Check aws-auth ConfigMap in kube-system namespace');
      console.log('   3. Verify your AWS user has proper EKS permissions');
      console.log('   4. See aws-console-eks-access.md for detailed instructions');
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('timeout')) {
      console.log('\n🌐 Connection Error - Possible Solutions:');
      console.log('   1. Verify EKS cluster endpoint is correct');
      console.log('   2. Check security groups allow access from your IP');
      console.log('   3. Ensure cluster is running and accessible');
    } else if (error.message.includes('certificate') || error.message.includes('SSL')) {
      console.log('\n🔒 Certificate Error - Possible Solutions:');
      console.log('   1. AWS CLI not configured properly');
      console.log('   2. Certificate authority data missing');
      console.log('   3. Try running: aws eks update-kubeconfig --name web-cluster --region us-east-1');
    }
    
    process.exit(1);
  }
}

// Run the test
testEKSConnection();
