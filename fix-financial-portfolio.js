#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const k8s = require('@kubernetes/client-node');

console.log('🔧 Fixing Financial Portfolio - Scaling up deployment...\n');

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

async function fixFinancialPortfolio() {
  try {
    const kc = createEKSKubeConfig();
    const appsV1Api = kc.makeApiClient(k8s.AppsV1Api);
    const coreV1Api = kc.makeApiClient(k8s.CoreV1Api);

    console.log('🔍 Finding Financial Portfolio deployment...');
    
    // Find the namespace with portfolio image
    const namespacesResponse = await coreV1Api.listNamespace();
    const hackCubesNamespaces = namespacesResponse.body.items.filter(ns => 
      ns.metadata.name.includes('hackcubes')
    );
    
    let portfolioNamespace = null;
    
    for (const ns of hackCubesNamespaces) {
      try {
        const deploymentsResponse = await appsV1Api.listNamespacedDeployment(ns.metadata.name);
        const deployments = deploymentsResponse.body.items;
        
        const portfolioDeployment = deployments.find(dep => 
          dep.spec.template.spec.containers[0]?.image?.includes('portfolio')
        );
        
        if (portfolioDeployment) {
          portfolioNamespace = ns.metadata.name;
          console.log(`✅ Found Financial Portfolio in namespace: ${portfolioNamespace}`);
          console.log(`   Deployment: ${portfolioDeployment.metadata.name}`);
          console.log(`   Image: ${portfolioDeployment.spec.template.spec.containers[0].image}`);
          console.log(`   Current replicas: ${portfolioDeployment.status.readyReplicas || 0}/${portfolioDeployment.spec.replicas}`);
          
          // Scale up the deployment to 1 replica
          console.log('\n🚀 Scaling up deployment to 1 replica...');
          
          const patchedDeployment = {
            spec: {
              replicas: 1
            }
          };
          
          await appsV1Api.patchNamespacedDeployment(
            portfolioDeployment.metadata.name,
            portfolioNamespace,
            patchedDeployment,
            undefined,
            undefined,
            undefined,
            undefined,
            {
              headers: {
                'Content-Type': 'application/strategic-merge-patch+json'
              }
            }
          );
          
          console.log('✅ Deployment scaled up to 1 replica');
          
          // Wait for pod to be ready
          console.log('⏳ Waiting for pod to start...');
          
          let attempts = 0;
          const maxAttempts = 30; // Wait up to 5 minutes
          
          while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
            
            const podsResponse = await coreV1Api.listNamespacedPod(portfolioNamespace);
            const pods = podsResponse.body.items;
            
            if (pods.length > 0) {
              const pod = pods[0];
              console.log(`   Pod status: ${pod.status.phase}`);
              
              if (pod.status.phase === 'Running') {
                const readyCondition = pod.status.conditions?.find(c => c.type === 'Ready');
                if (readyCondition?.status === 'True') {
                  console.log('🎉 Pod is running and ready!');
                  
                  // Get the LoadBalancer URL
                  const servicesResponse = await coreV1Api.listNamespacedService(portfolioNamespace);
                  const services = servicesResponse.body.items;
                  const lbService = services.find(svc => svc.spec.type === 'LoadBalancer');
                  
                  if (lbService && lbService.status.loadBalancer?.ingress?.[0]) {
                    const lbUrl = lbService.status.loadBalancer.ingress[0].hostname || lbService.status.loadBalancer.ingress[0].ip;
                    console.log(`\n🌐 Financial Portfolio is now accessible at:`);
                    console.log(`   URL: http://${lbUrl}/`);
                    console.log(`   Port: ${lbService.spec.ports[0].port} → ${lbService.spec.ports[0].targetPort}`);
                  }
                  
                  return;
                }
              } else if (pod.status.phase === 'Failed') {
                console.log('❌ Pod failed to start');
                console.log('Container statuses:', pod.status.containerStatuses?.map(c => ({
                  name: c.name,
                  ready: c.ready,
                  restartCount: c.restartCount,
                  state: Object.keys(c.state || {})[0]
                })));
                break;
              }
            }
            
            attempts++;
            console.log(`   Waiting... (${attempts}/${maxAttempts})`);
          }
          
          if (attempts >= maxAttempts) {
            console.log('⚠️  Timeout waiting for pod to be ready. Check pod logs for issues.');
          }
          
          break;
        }
      } catch (nsError) {
        // Skip namespace if we can't access it
      }
    }
    
    if (!portfolioNamespace) {
      console.log('❌ No Financial Portfolio deployment found');
    }

  } catch (error) {
    console.error('❌ Failed to fix Financial Portfolio:', error.message);
  }
}

fixFinancialPortfolio();
