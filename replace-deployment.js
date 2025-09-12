#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const k8s = require('@kubernetes/client-node');

console.log('🔄 Replacing Financial Portfolio Deployment with 1 replica...\n');

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

async function replaceDeployment() {
  try {
    const kc = createEKSKubeConfig();
    const appsV1Api = kc.makeApiClient(k8s.AppsV1Api);
    
    const portfolioNamespace = 'hackcubes-4f8842eb-44a88986-8fd0-49c2-8a43-254925638742';
    const deploymentName = 'challenge';
    
    console.log(`🔧 Getting current deployment "${deploymentName}" in namespace "${portfolioNamespace}"`);
    
    // Get current deployment
    const deploymentResponse = await appsV1Api.readNamespacedDeployment(deploymentName, portfolioNamespace);
    const deployment = deploymentResponse.body;
    
    console.log(`   Current replicas: ${deployment.spec.replicas}`);
    console.log(`   Ready replicas: ${deployment.status.readyReplicas || 0}`);
    console.log(`   Image: ${deployment.spec.template.spec.containers[0]?.image}`);
    
    // Modify the deployment to have 1 replica
    deployment.spec.replicas = 1;
    
    // Remove status and other read-only fields
    delete deployment.status;
    delete deployment.metadata.resourceVersion;
    delete deployment.metadata.generation;
    delete deployment.metadata.uid;
    delete deployment.metadata.creationTimestamp;
    delete deployment.metadata.managedFields;
    
    console.log('🚀 Updating deployment with 1 replica...');
    
    const replaceResponse = await appsV1Api.replaceNamespacedDeployment(
      deploymentName,
      portfolioNamespace,
      deployment
    );
    
    console.log('✅ Deployment updated successfully');
    console.log(`   New replica count: ${replaceResponse.body.spec.replicas}`);
    
    // Wait for scaling to take effect
    console.log('⏳ Waiting 15 seconds for pod to start...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Check status
    const updatedDeploymentResponse = await appsV1Api.readNamespacedDeployment(deploymentName, portfolioNamespace);
    const updatedDeployment = updatedDeploymentResponse.body;
    
    console.log(`\n📊 Updated Status:`);
    console.log(`   Replicas: ${updatedDeployment.status.readyReplicas || 0}/${updatedDeployment.spec.replicas}`);
    console.log(`   Available replicas: ${updatedDeployment.status.availableReplicas || 0}`);
    console.log(`   Updated replicas: ${updatedDeployment.status.updatedReplicas || 0}`);
    
    // Check pods
    const coreV1Api = kc.makeApiClient(k8s.CoreV1Api);
    const podsResponse = await coreV1Api.listNamespacedPod(portfolioNamespace);
    const pods = podsResponse.body.items;
    
    console.log(`\n🔍 Pod Status (${pods.length} pods):`);
    pods.forEach(pod => {
      console.log(`   - ${pod.metadata.name}: ${pod.status.phase}`);
      if (pod.status.containerStatuses) {
        pod.status.containerStatuses.forEach(container => {
          console.log(`     Container ${container.name}: ready=${container.ready}, restarts=${container.restartCount}`);
          if (container.state.waiting) {
            console.log(`     Waiting reason: ${container.state.waiting.reason}`);
            if (container.state.waiting.message) {
              console.log(`     Waiting message: ${container.state.waiting.message}`);
            }
          }
        });
      }
    });
    
    // Get LoadBalancer URL
    const servicesResponse = await coreV1Api.listNamespacedService(portfolioNamespace);
    const services = servicesResponse.body.items;
    const lbService = services.find(svc => svc.spec.type === 'LoadBalancer');
    
    if (lbService && lbService.status.loadBalancer?.ingress?.[0]) {
      const lbUrl = lbService.status.loadBalancer.ingress[0].hostname || lbService.status.loadBalancer.ingress[0].ip;
      console.log(`\n🌐 LoadBalancer URL: http://${lbUrl}/`);
      console.log(`   Ports: ${lbService.spec.ports?.map(p => `${p.port}:${p.targetPort}`).join(', ')}`);
      
      if (pods.length > 0 && pods[0].status.phase === 'Running') {
        console.log('\n🎉 Financial Portfolio should now be accessible!');
      } else {
        console.log('\n⚠️  Pod is not running yet. May need more time or there could be an issue.');
      }
    }

  } catch (error) {
    console.error('❌ Failed to replace deployment:', error.message);
    if (error.response?.body) {
      console.error('   Error details:', JSON.stringify(error.response.body, null, 2));
    }
  }
}

replaceDeployment();
