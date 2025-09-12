#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const k8s = require('@kubernetes/client-node');

console.log('🛠️ Manually Scaling Financial Portfolio Deployment...\n');

function createEKSKubeConfig() {
  const kc = new k8s.KubeConfig();
  
  const clusterName = process.env.EKS_CLUSTER_NAME;
  const endpoint = process.env.EKS_CLUSTER_ENDPOINT;
  const region = process.env.AWS_REGION;

  const cluster = {
    name: clusterName,
    server: endpoint,
    skipTLSVerify: true
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

async function scaleDeployment() {
  try {
    const kc = createEKSKubeConfig();
    const appsV1Api = kc.makeApiClient(k8s.AppsV1Api);
    
    const portfolioNamespace = 'hackcubes-4f8842eb-44a88986-8fd0-49c2-8a43-254925638742';
    const deploymentName = 'challenge';
    
    console.log(`🔧 Scaling deployment "${deploymentName}" in namespace "${portfolioNamespace}"`);
    
    // Get current deployment
    const deploymentResponse = await appsV1Api.readNamespacedDeployment(deploymentName, portfolioNamespace);
    const deployment = deploymentResponse.body;
    
    console.log(`   Current replicas: ${deployment.spec.replicas}`);
    console.log(`   Ready replicas: ${deployment.status.readyReplicas || 0}`);
    
    // Scale to 1 replica
    const scalePayload = {
      spec: {
        replicas: 1
      }
    };
    
    console.log('🚀 Scaling to 1 replica...');
    
    const patchResponse = await appsV1Api.patchNamespacedDeployment(
      deploymentName,
      portfolioNamespace,
      scalePayload,
      undefined, // pretty
      undefined, // dryRun
      undefined, // fieldManager
      undefined, // force
      {
        headers: {
          'Content-Type': 'application/strategic-merge-patch+json'
        }
      }
    );
    
    console.log('✅ Deployment scaling request sent successfully');
    console.log(`   New replica count: ${patchResponse.body.spec.replicas}`);
    
    // Wait for a moment to let the scaling take effect
    console.log('⏳ Waiting 10 seconds for scaling to take effect...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check status
    const updatedDeploymentResponse = await appsV1Api.readNamespacedDeployment(deploymentName, portfolioNamespace);
    const updatedDeployment = updatedDeploymentResponse.body;
    
    console.log(`\n📊 Updated Status:`);
    console.log(`   Replicas: ${updatedDeployment.status.readyReplicas || 0}/${updatedDeployment.spec.replicas}`);
    console.log(`   Available replicas: ${updatedDeployment.status.availableReplicas || 0}`);
    console.log(`   Updated replicas: ${updatedDeployment.status.updatedReplicas || 0}`);
    
    if (updatedDeployment.status.conditions) {
      console.log(`   Conditions:`);
      updatedDeployment.status.conditions.forEach(condition => {
        console.log(`     - ${condition.type}: ${condition.status} (${condition.reason})`);
      });
    }

  } catch (error) {
    console.error('❌ Failed to scale deployment:', error.message);
    if (error.response?.body) {
      console.error('   Error details:', JSON.stringify(error.response.body, null, 2));
    }
  }
}

scaleDeployment();
