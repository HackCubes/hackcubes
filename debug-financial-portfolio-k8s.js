#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const k8s = require('@kubernetes/client-node');

console.log('🔍 Debugging Financial Portfolio Kubernetes Deployment...\n');

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

async function debugFinancialPortfolio() {
  try {
    const kc = createEKSKubeConfig();
    const coreV1Api = kc.makeApiClient(k8s.CoreV1Api);
    const appsV1Api = kc.makeApiClient(k8s.AppsV1Api);

    console.log('1. 📋 Checking all namespaces for Financial Portfolio...');
    const namespacesResponse = await coreV1Api.listNamespace();
    const namespaces = namespacesResponse.body.items;
    
    const portfolioNamespaces = namespaces.filter(ns => 
      ns.metadata.name.includes('portfolio') || 
      ns.metadata.name.includes('financial') ||
      ns.metadata.labels?.['hackcubes.com/challenge']?.includes('portfolio')
    );
    
    console.log('   Portfolio-related namespaces found:');
    portfolioNamespaces.forEach(ns => {
      console.log(`   - ${ns.metadata.name} (created: ${ns.metadata.creationTimestamp})`);
    });

    if (portfolioNamespaces.length === 0) {
      console.log('   ⚠️  No Financial Portfolio namespaces found. The challenge may not have been deployed properly.');
    }

    console.log('\n2. 🔍 Checking all HackCubes namespaces...');
    const hackCubesNamespaces = namespaces.filter(ns => 
      ns.metadata.name.includes('hackcubes') ||
      ns.metadata.labels?.['hackcubes.com/type'] === 'challenge'
    );
    
    console.log(`   Found ${hackCubesNamespaces.length} HackCubes namespaces:`);
    for (const ns of hackCubesNamespaces) {
      console.log(`\n   📦 Namespace: ${ns.metadata.name}`);
      console.log(`      Labels:`, ns.metadata.labels || 'None');
      
      try {
        // Check pods in this namespace
        const podsResponse = await coreV1Api.listNamespacedPod(ns.metadata.name);
        const pods = podsResponse.body.items;
        console.log(`      Pods: ${pods.length}`);
        
        pods.forEach(pod => {
          console.log(`        - ${pod.metadata.name} (status: ${pod.status.phase})`);
          if (pod.status.phase !== 'Running') {
            console.log(`          Container statuses:`, pod.status.containerStatuses?.map(c => ({
              name: c.name,
              ready: c.ready,
              restartCount: c.restartCount,
              state: Object.keys(c.state || {})[0]
            })));
          }
        });

        // Check services in this namespace  
        const servicesResponse = await coreV1Api.listNamespacedService(ns.metadata.name);
        const services = servicesResponse.body.items;
        console.log(`      Services: ${services.length}`);
        
        services.forEach(svc => {
          console.log(`        - ${svc.metadata.name} (type: ${svc.spec.type})`);
          if (svc.spec.type === 'LoadBalancer') {
            console.log(`          LoadBalancer status:`, svc.status.loadBalancer);
            if (svc.status.loadBalancer?.ingress?.[0]) {
              const lbUrl = svc.status.loadBalancer.ingress[0].hostname || svc.status.loadBalancer.ingress[0].ip;
              console.log(`          🌐 LoadBalancer URL: http://${lbUrl}/`);
            }
          }
        });

        // Check deployments
        const deploymentsResponse = await appsV1Api.listNamespacedDeployment(ns.metadata.name);
        const deployments = deploymentsResponse.body.items;
        console.log(`      Deployments: ${deployments.length}`);
        
        deployments.forEach(dep => {
          console.log(`        - ${dep.metadata.name} (replicas: ${dep.status.readyReplicas || 0}/${dep.spec.replicas})`);
          console.log(`          Image: ${dep.spec.template.spec.containers[0]?.image}`);
          console.log(`          Ports: ${dep.spec.template.spec.containers[0]?.ports?.map(p => p.containerPort).join(', ') || 'None'}`);
        });

      } catch (nsError) {
        console.log(`      ❌ Error checking namespace: ${nsError.message}`);
      }
    }

    console.log('\n3. 🌐 Checking LoadBalancer services specifically...');
    const allServicesResponse = await coreV1Api.listServiceForAllNamespaces();
    const loadBalancerServices = allServicesResponse.body.items.filter(svc => svc.spec.type === 'LoadBalancer');
    
    console.log(`   Found ${loadBalancerServices.length} LoadBalancer services:`);
    loadBalancerServices.forEach(svc => {
      console.log(`   - ${svc.metadata.name} (namespace: ${svc.metadata.namespace})`);
      if (svc.status.loadBalancer?.ingress?.[0]) {
        const lbUrl = svc.status.loadBalancer.ingress[0].hostname || svc.status.loadBalancer.ingress[0].ip;
        console.log(`     URL: http://${lbUrl}/`);
        console.log(`     Ports: ${svc.spec.ports?.map(p => `${p.port}:${p.targetPort}`).join(', ')}`);
      } else {
        console.log(`     Status: Pending external IP`);
      }
    });

  } catch (error) {
    console.error('❌ Failed to debug Financial Portfolio:', error.message);
  }
}

debugFinancialPortfolio();
