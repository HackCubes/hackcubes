#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const k8s = require('@kubernetes/client-node');

console.log('📊 Quick Status Check for Financial Portfolio...\n');

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

async function checkStatus() {
  try {
    const kc = createEKSKubeConfig();
    const appsV1Api = kc.makeApiClient(k8s.AppsV1Api);
    const coreV1Api = kc.makeApiClient(k8s.CoreV1Api);

    // Check the specific Financial Portfolio namespace
    const portfolioNamespace = 'hackcubes-4f8842eb-44a88986-8fd0-49c2-8a43-254925638742';
    
    console.log(`🔍 Checking namespace: ${portfolioNamespace}`);
    
    // Check deployment
    const deploymentsResponse = await appsV1Api.listNamespacedDeployment(portfolioNamespace);
    const deployments = deploymentsResponse.body.items;
    
    if (deployments.length > 0) {
      const deployment = deployments[0];
      console.log(`   Deployment: ${deployment.metadata.name}`);
      console.log(`   Replicas: ${deployment.status.readyReplicas || 0}/${deployment.spec.replicas}`);
      console.log(`   Image: ${deployment.spec.template.spec.containers[0]?.image}`);
    }
    
    // Check pods
    const podsResponse = await coreV1Api.listNamespacedPod(portfolioNamespace);
    const pods = podsResponse.body.items;
    
    console.log(`   Pods: ${pods.length}`);
    pods.forEach(pod => {
      console.log(`     - ${pod.metadata.name}: ${pod.status.phase}`);
      if (pod.status.containerStatuses) {
        pod.status.containerStatuses.forEach(container => {
          console.log(`       Container ${container.name}: ready=${container.ready}, restarts=${container.restartCount}`);
          if (container.state.waiting) {
            console.log(`       Waiting: ${container.state.waiting.reason} - ${container.state.waiting.message}`);
          }
        });
      }
    });
    
    // Check LoadBalancer service
    const servicesResponse = await coreV1Api.listNamespacedService(portfolioNamespace);
    const services = servicesResponse.body.items;
    const lbService = services.find(svc => svc.spec.type === 'LoadBalancer');
    
    if (lbService && lbService.status.loadBalancer?.ingress?.[0]) {
      const lbUrl = lbService.status.loadBalancer.ingress[0].hostname || lbService.status.loadBalancer.ingress[0].ip;
      console.log(`\n🌐 LoadBalancer URL: http://${lbUrl}/`);
      console.log(`   Ports: ${lbService.spec.ports?.map(p => `${p.port}:${p.targetPort}`).join(', ')}`);
    }

  } catch (error) {
    console.error('❌ Status check failed:', error.message);
  }
}

checkStatus();
