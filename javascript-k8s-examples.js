#!/usr/bin/env node

/**
 * JavaScript Kubernetes Client Examples for Challenge Hosting
 * 
 * This file demonstrates various ways to use the JavaScript Kubernetes client
 * to manage challenge instances in your HackCubes platform.
 */

const k8s = require('@kubernetes/client-node');

// Initialize Kubernetes client
function initializeKubernetesClient() {
  const kc = new k8s.KubeConfig();
  
  // Load configuration based on environment
  if (process.env.NODE_ENV === 'production') {
    kc.loadFromCluster(); // For in-cluster deployment
  } else {
    kc.loadFromDefault(); // Uses ~/.kube/config
  }

  return {
    coreV1Api: kc.makeApiClient(k8s.CoreV1Api),
    appsV1Api: kc.makeApiClient(k8s.AppsV1Api),
    metricsClient: new k8s.Metrics(kc),
    watchApi: new k8s.Watch(kc),
    logApi: new k8s.Log(kc),
    kubeConfig: kc
  };
}

// Example 1: Create Challenge Instance with Complete Configuration
async function createChallengeInstance(username, challengeName, config) {
  console.log('🚀 Creating challenge instance...');
  
  const { coreV1Api, appsV1Api } = initializeKubernetesClient();
  const namespace = `hackcubes-${username}-${challengeName}`.toLowerCase();

  try {
    // 1. Create namespace
    const namespaceManifest = {
      metadata: {
        name: namespace,
        labels: {
          'hackcubes.com/type': 'challenge',
          'hackcubes.com/user': username,
          'hackcubes.com/challenge': challengeName
        },
        annotations: {
          'hackcubes.com/created-at': new Date().toISOString(),
          'hackcubes.com/auto-cleanup': 'true'
        }
      }
    };

    await coreV1Api.createNamespace(namespaceManifest);
    console.log(`✅ Namespace ${namespace} created`);

    // 2. Create deployment
    const deployment = {
      metadata: {
        name: 'challenge',
        namespace: namespace
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: { app: 'challenge' }
        },
        template: {
          metadata: {
            labels: { app: 'challenge' }
          },
          spec: {
            containers: [{
              name: 'challenge',
              image: config.image || 'nginx:latest',
              ports: config.ports?.map(port => ({ containerPort: port })) || [{ containerPort: 80 }],
              env: Object.entries(config.environment || {}).map(([key, value]) => ({
                name: key,
                value: value
              })),
              resources: {
                limits: {
                  cpu: config.cpuLimit || '500m',
                  memory: config.memoryLimit || '512Mi'
                },
                requests: {
                  cpu: config.cpuRequest || '100m',
                  memory: config.memoryRequest || '128Mi'
                }
              }
            }]
          }
        }
      }
    };

    await appsV1Api.createNamespacedDeployment(namespace, deployment);
    console.log(`✅ Deployment created in ${namespace}`);

    // 3. Create service
    const service = {
      metadata: {
        name: 'challenge-service',
        namespace: namespace
      },
      spec: {
        type: 'NodePort',
        ports: config.ports?.map(port => ({
          port: port,
          targetPort: port,
          protocol: 'TCP'
        })) || [{ port: 80, targetPort: 80, protocol: 'TCP' }],
        selector: { app: 'challenge' }
      }
    };

    const serviceResult = await coreV1Api.createNamespacedService(namespace, service);
    console.log(`✅ Service created: ${serviceResult.body.metadata.name}`);

    return {
      namespace,
      service: serviceResult.body,
      status: 'created'
    };

  } catch (error) {
    console.error('❌ Error creating challenge instance:', error.message);
    throw error;
  }
}

// Example 2: Monitor Challenge Instance Status
async function monitorChallengeStatus(namespace) {
  console.log(`📊 Monitoring challenge status for ${namespace}...`);
  
  const { coreV1Api, metricsClient } = initializeKubernetesClient();

  try {
    // Get pods
    const podsResponse = await coreV1Api.listNamespacedPod(namespace);
    const pods = podsResponse.body.items;

    // Get services
    const servicesResponse = await coreV1Api.listNamespacedService(namespace);
    const services = servicesResponse.body.items;

    // Get metrics (if metrics server is available)
    let metrics = null;
    try {
      const podMetrics = await Promise.all(
        pods.map(async (pod) => {
          if (pod.status?.phase === 'Running') {
            try {
              return await metricsClient.getPodMetrics(namespace, pod.metadata.name);
            } catch (e) {
              return null;
            }
          }
          return null;
        })
      );
      
      metrics = podMetrics.filter(m => m !== null);
    } catch (e) {
      console.log('⚠️ Metrics not available');
    }

    // Determine status
    let status = 'unknown';
    if (pods.length === 0) {
      status = 'no-pods';
    } else {
      const runningPods = pods.filter(pod => pod.status?.phase === 'Running');
      if (runningPods.length === pods.length) {
        status = 'running';
      } else if (pods.some(pod => pod.status?.phase === 'Pending')) {
        status = 'starting';
      } else if (pods.some(pod => pod.status?.phase === 'Failed')) {
        status = 'failed';
      }
    }

    console.log(`📈 Status: ${status}`);
    console.log(`📦 Pods: ${pods.length} (${pods.filter(p => p.status?.phase === 'Running').length} running)`);
    console.log(`🌐 Services: ${services.length}`);

    return {
      status,
      pods: pods.map(pod => ({
        name: pod.metadata.name,
        phase: pod.status?.phase,
        ready: pod.status?.conditions?.find(c => c.type === 'Ready')?.status === 'True'
      })),
      services: services.map(service => ({
        name: service.metadata.name,
        type: service.spec.type,
        ports: service.spec.ports
      })),
      metrics
    };

  } catch (error) {
    console.error('❌ Error monitoring challenge:', error.message);
    throw error;
  }
}

// Example 3: Watch Challenge Events in Real-time
async function watchChallengeEvents(namespace, duration = 30000) {
  console.log(`👀 Watching events in ${namespace} for ${duration/1000} seconds...`);
  
  const { watchApi } = initializeKubernetesClient();
  const events = [];

  try {
    const watchRequest = await watchApi.watch(
      `/api/v1/namespaces/${namespace}/pods`,
      {},
      (type, apiObj) => {
        const event = {
          type,
          timestamp: new Date().toISOString(),
          pod: apiObj.metadata?.name,
          phase: apiObj.status?.phase,
          message: apiObj.status?.conditions?.find(c => c.type === 'Ready')?.message
        };
        
        events.push(event);
        console.log(`🔔 Event: ${event.type} - ${event.pod} (${event.phase})`);
      },
      (error) => {
        console.error('👁️ Watch error:', error);
      }
    );

    // Stop watching after specified duration
    setTimeout(() => {
      watchRequest.abort();
      console.log(`✅ Watched ${events.length} events`);
    }, duration);

    return events;

  } catch (error) {
    console.error('❌ Error watching challenge events:', error.message);
    throw error;
  }
}

// Example 4: Get Challenge Logs
async function getChallengeLogs(namespace, tailLines = 100) {
  console.log(`📜 Getting logs from ${namespace}...`);
  
  const { coreV1Api, logApi } = initializeKubernetesClient();

  try {
    const podsResponse = await coreV1Api.listNamespacedPod(namespace);
    const pods = podsResponse.body.items;
    const allLogs = [];

    for (const pod of pods) {
      if (pod.status?.phase === 'Running' || pod.status?.phase === 'Succeeded') {
        try {
          console.log(`📄 Getting logs for pod: ${pod.metadata.name}`);
          
          const logStream = await logApi.log(
            namespace,
            pod.metadata.name,
            '', // container name (empty for single container)
            null, // output stream
            {
              follow: false,
              tailLines: tailLines,
              timestamps: true,
              pretty: false
            }
          );

          // Convert stream to string
          const logs = await new Promise((resolve, reject) => {
            let data = '';
            logStream.on('data', chunk => data += chunk.toString());
            logStream.on('end', () => resolve(data));
            logStream.on('error', reject);
          });

          allLogs.push({
            podName: pod.metadata.name,
            logs: logs
          });

        } catch (logError) {
          console.error(`❌ Error getting logs for ${pod.metadata.name}:`, logError.message);
        }
      }
    }

    console.log(`✅ Retrieved logs from ${allLogs.length} pods`);
    return allLogs;

  } catch (error) {
    console.error('❌ Error getting challenge logs:', error.message);
    throw error;
  }
}

// Example 5: Scale Challenge Instance
async function scaleChallengeInstance(namespace, replicas) {
  console.log(`⚖️ Scaling challenge in ${namespace} to ${replicas} replicas...`);
  
  const { appsV1Api } = initializeKubernetesClient();

  try {
    const deploymentsResponse = await appsV1Api.listNamespacedDeployment(namespace);
    const deployments = deploymentsResponse.body.items;

    for (const deployment of deployments) {
      deployment.spec.replicas = replicas;
      
      await appsV1Api.patchNamespacedDeployment(
        deployment.metadata.name,
        namespace,
        deployment
      );
    }

    console.log(`✅ Scaled to ${replicas} replicas`);
    return { replicas, status: 'scaled' };

  } catch (error) {
    console.error('❌ Error scaling challenge:', error.message);
    throw error;
  }
}

// Example 6: Execute Commands in Challenge Container
async function executeInChallenge(namespace, podName, command) {
  console.log(`💻 Executing command in ${podName}: ${command.join(' ')}`);
  
  const { kubeConfig } = initializeKubernetesClient();
  const exec = new k8s.Exec(kubeConfig);

  try {
    let output = '';
    let errorOutput = '';

    await exec.exec(
      namespace,
      podName,
      '', // container name
      command,
      process.stdout, // stdout
      process.stderr, // stderr
      process.stdin,  // stdin
      false, // tty
      (status) => {
        console.log('Command exit status:', status);
      }
    );

    return { output, errorOutput };

  } catch (error) {
    console.error('❌ Error executing command:', error.message);
    throw error;
  }
}

// Example 7: Cleanup Challenge Instance
async function cleanupChallengeInstance(namespace) {
  console.log(`🧹 Cleaning up challenge instance: ${namespace}...`);
  
  const { coreV1Api } = initializeKubernetesClient();

  try {
    // Delete the entire namespace (cascades to all resources)
    await coreV1Api.deleteNamespace(namespace);
    console.log(`✅ Namespace ${namespace} deleted`);
    
    return { status: 'deleted', namespace };

  } catch (error) {
    if (error.response?.statusCode === 404) {
      console.log(`ℹ️ Namespace ${namespace} was already deleted`);
      return { status: 'already-deleted', namespace };
    }
    
    console.error('❌ Error cleaning up challenge:', error.message);
    throw error;
  }
}

// Example 8: List All Challenge Instances
async function listAllChallengeInstances() {
  console.log('📋 Listing all challenge instances...');
  
  const { coreV1Api } = initializeKubernetesClient();

  try {
    const namespacesResponse = await coreV1Api.listNamespace();
    const challengeNamespaces = namespacesResponse.body.items.filter(
      ns => ns.metadata?.labels?.['hackcubes.com/type'] === 'challenge'
    );

    const instances = challengeNamespaces.map(ns => ({
      namespace: ns.metadata.name,
      user: ns.metadata?.labels?.['hackcubes.com/user'],
      challenge: ns.metadata?.labels?.['hackcubes.com/challenge'],
      createdAt: ns.metadata?.annotations?.['hackcubes.com/created-at'],
      status: ns.status?.phase
    }));

    console.log(`✅ Found ${instances.length} challenge instances`);
    return instances;

  } catch (error) {
    console.error('❌ Error listing challenge instances:', error.message);
    throw error;
  }
}

// Demo function to run examples
async function runDemo() {
  console.log('🎯 JavaScript Kubernetes Client Demo for Challenge Hosting\n');

  try {
    // Example configuration
    const config = {
      image: 'nginx:latest',
      ports: [80],
      environment: {
        'CHALLENGE_TYPE': 'web',
        'DIFFICULTY': 'easy'
      },
      cpuLimit: '500m',
      memoryLimit: '512Mi'
    };

    // 1. Create challenge instance
    const instance = await createChallengeInstance('testuser', 'webchallenge', config);
    const namespace = instance.namespace;

    // 2. Monitor status
    setTimeout(async () => {
      await monitorChallengeStatus(namespace);
    }, 5000);

    // 3. Watch events
    setTimeout(async () => {
      await watchChallengeEvents(namespace, 10000);
    }, 10000);

    // 4. Get logs
    setTimeout(async () => {
      await getChallengeLogs(namespace);
    }, 15000);

    // 5. List all instances
    setTimeout(async () => {
      await listAllChallengeInstances();
    }, 20000);

    // 6. Cleanup
    setTimeout(async () => {
      await cleanupChallengeInstance(namespace);
    }, 25000);

  } catch (error) {
    console.error('Demo failed:', error);
  }
}

// Export functions for use in other modules
module.exports = {
  initializeKubernetesClient,
  createChallengeInstance,
  monitorChallengeStatus,
  watchChallengeEvents,
  getChallengeLogs,
  scaleChallengeInstance,
  executeInChallenge,
  cleanupChallengeInstance,
  listAllChallengeInstances
};

// Run demo if called directly
if (require.main === module) {
  console.log('Running Kubernetes JavaScript Client Demo...');
  console.log('Make sure you have kubectl configured and cluster access!\n');
  
  // Uncomment to run demo
  // runDemo().catch(console.error);
} 