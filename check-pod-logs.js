#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const k8s = require('@kubernetes/client-node');

console.log('📝 Checking Financial Portfolio Pod Logs...\n');

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

async function checkPodLogs() {
  try {
    const kc = createEKSKubeConfig();
    const coreV1Api = kc.makeApiClient(k8s.CoreV1Api);
    const log = new k8s.Log(kc);
    
    const portfolioNamespace = 'hackcubes-4f8842eb-44a88986-8fd0-49c2-8a43-254925638742';
    
    console.log(`🔍 Getting pods in namespace: ${portfolioNamespace}`);
    
    // Get pods
    const podsResponse = await coreV1Api.listNamespacedPod(portfolioNamespace);
    const pods = podsResponse.body.items;
    
    if (pods.length === 0) {
      console.log('❌ No pods found in namespace');
      return;
    }
    
    for (const pod of pods) {
      console.log(`\n📦 Pod: ${pod.metadata.name}`);
      console.log(`   Status: ${pod.status.phase}`);
      console.log(`   Node: ${pod.spec.nodeName || 'Not assigned'}`);
      console.log(`   Pod IP: ${pod.status.podIP || 'Not assigned'}`);
      
      // Check container statuses
      if (pod.status.containerStatuses) {
        console.log(`   Container Statuses:`);
        pod.status.containerStatuses.forEach(container => {
          console.log(`     - ${container.name}:`);
          console.log(`       Ready: ${container.ready}`);
          console.log(`       Restart Count: ${container.restartCount}`);
          console.log(`       Image: ${container.image}`);
          
          const state = container.state;
          if (state.running) {
            console.log(`       State: Running (started: ${state.running.startedAt})`);
          } else if (state.waiting) {
            console.log(`       State: Waiting (${state.waiting.reason})`);
            if (state.waiting.message) {
              console.log(`       Message: ${state.waiting.message}`);
            }
          } else if (state.terminated) {
            console.log(`       State: Terminated (${state.terminated.reason})`);
            console.log(`       Exit Code: ${state.terminated.exitCode}`);
            if (state.terminated.message) {
              console.log(`       Message: ${state.terminated.message}`);
            }
          }
        });
      }
      
      // Get pod logs
      try {
        console.log(`\n📝 Pod Logs (last 20 lines):`);
        
        const logStream = await log.log(
          portfolioNamespace,
          pod.metadata.name,
          'challenge', // container name
          undefined, // follow
          undefined, // pretty
          undefined, // previous
          undefined, // sinceSeconds
          undefined, // sinceTime
          20, // tailLines
          undefined // timestamps
        );
        
        if (logStream) {
          console.log(logStream);
        } else {
          console.log('   No logs available');
        }
        
      } catch (logError) {
        console.log(`   ❌ Failed to get logs: ${logError.message}`);
      }
      
      // Check pod events
      try {
        console.log(`\n📋 Pod Events:`);
        const eventsResponse = await coreV1Api.listNamespacedEvent(
          portfolioNamespace,
          undefined, // pretty
          undefined, // allowWatchBookmarks
          undefined, // continue
          `involvedObject.name=${pod.metadata.name}` // fieldSelector
        );
        
        const events = eventsResponse.body.items;
        if (events.length > 0) {
          events.slice(-5).forEach(event => {
            console.log(`   ${event.firstTimestamp || event.eventTime}: ${event.reason} - ${event.message}`);
          });
        } else {
          console.log('   No events found');
        }
        
      } catch (eventError) {
        console.log(`   ❌ Failed to get events: ${eventError.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Failed to check pod logs:', error.message);
  }
}

checkPodLogs();
