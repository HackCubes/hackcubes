import type { NextApiRequest, NextApiResponse } from 'next';
import * as k8s from '@kubernetes/client-node';

interface AdvancedKubernetesResponse {
  status: string;
  namespace?: string;
  pods?: any[];
  services?: any[];
  logs?: string[];
  metrics?: {
    cpu: string;
    memory: string;
  };
  message?: string;
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { action, question_id, candidate_id, username, config } = req.body;

    if (!action || !question_id || !candidate_id || !username) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Initialize Kubernetes client with advanced features
    const kc = new k8s.KubeConfig();
    if (process.env.NODE_ENV === 'production') {
      kc.loadFromCluster();
    } else {
      kc.loadFromDefault();
    }

    const coreV1Api = kc.makeApiClient(k8s.CoreV1Api);
    const appsV1Api = kc.makeApiClient(k8s.AppsV1Api);
    const metricsClient = new k8s.Metrics(kc);
    const logApi = new k8s.Log(kc);

    const namespace = generateNamespace(username, question_id);

    switch (action) {
      case 'create_advanced':
        return await createAdvancedChallenge(
          coreV1Api, appsV1Api, namespace, config, res
        );
      
      case 'get_status_detailed':
        return await getDetailedStatus(
          coreV1Api, appsV1Api, metricsClient, namespace, res
        );
      
      case 'get_logs':
        return await getChallengeLogs(
          coreV1Api, logApi, namespace, res
        );
      
      case 'scale':
        return await scaleChallenge(
          appsV1Api, namespace, config?.replicas || 1, res
        );
      
      case 'watch':
        return await setupWatcher(
          kc, namespace, res
        );
      
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (err: any) {
    console.error('Error in advanced K8s API:', err);
    return res.status(500).json({ error: 'Failed to process request', message: err?.message });
  }
}

/**
 * Create advanced challenge with comprehensive configuration
 */
async function createAdvancedChallenge(
  coreV1Api: k8s.CoreV1Api,
  appsV1Api: k8s.AppsV1Api,
  namespace: string,
  config: any,
  res: NextApiResponse
) {
  try {
    // 1. Create namespace with labels and annotations
    const namespaceManifest: k8s.V1Namespace = {
      metadata: {
        name: namespace,
        labels: {
          'hackcubes.com/type': 'challenge',
          'hackcubes.com/managed-by': 'hackcubes-platform'
        },
        annotations: {
          'hackcubes.com/created-at': new Date().toISOString(),
          'hackcubes.com/auto-cleanup': 'true',
          'hackcubes.com/timeout-minutes': '60'
        }
      }
    };

    await coreV1Api.createNamespace(namespaceManifest);

    // 2. Create advanced deployment with security context
    const deployment: k8s.V1Deployment = {
      metadata: {
        name: 'challenge',
        namespace,
        labels: {
          app: 'challenge',
          'hackcubes.com/component': 'challenge-instance'
        }
      },
      spec: {
        replicas: config?.replicas || 1,
        selector: {
          matchLabels: {
            app: 'challenge'
          }
        },
        template: {
          metadata: {
            labels: {
              app: 'challenge'
            }
          },
          spec: {
            securityContext: {
              runAsNonRoot: true,
              runAsUser: 1000,
              fsGroup: 1000
            },
            containers: [{
              name: 'challenge',
              image: config?.image || 'nginx:latest',
              ports: (config?.ports || [80]).map((port: number) => ({
                containerPort: port,
                protocol: 'TCP'
              })),
              env: Object.entries(config?.environment || {}).map(([key, value]) => ({
                name: key,
                value: String(value)
              })),
              resources: {
                requests: {
                  cpu: config?.resources?.requests?.cpu || '100m',
                  memory: config?.resources?.requests?.memory || '128Mi'
                },
                limits: {
                  cpu: config?.resources?.limits?.cpu || '500m',
                  memory: config?.resources?.limits?.memory || '512Mi'
                }
              },
              securityContext: {
                allowPrivilegeEscalation: false,
                readOnlyRootFilesystem: false,
                capabilities: {
                  drop: ['ALL']
                }
              },
              livenessProbe: {
                httpGet: {
                  path: '/',
                  port: config?.ports?.[0] || 80
                },
                initialDelaySeconds: 30,
                periodSeconds: 10
              },
              readinessProbe: {
                httpGet: {
                  path: '/',
                  port: config?.ports?.[0] || 80
                },
                initialDelaySeconds: 5,
                periodSeconds: 5
              }
            }]
          }
        }
      }
    };

    await appsV1Api.createNamespacedDeployment(namespace, deployment);

    // 3. Create service with NodePort
    const service: k8s.V1Service = {
      metadata: {
        name: 'challenge-service',
        namespace,
        labels: {
          app: 'challenge'
        }
      },
      spec: {
        type: 'NodePort',
        ports: (config?.ports || [80]).map((port: number) => ({
          port: port,
          targetPort: port,
          protocol: 'TCP'
        })),
        selector: {
          app: 'challenge'
        }
      }
    };

    const serviceResult = await coreV1Api.createNamespacedService(namespace, service);

    // 4. Create ConfigMap for challenge configuration
    const configMap: k8s.V1ConfigMap = {
      metadata: {
        name: 'challenge-config',
        namespace
      },
      data: {
        'challenge.json': JSON.stringify(config, null, 2),
        'created-at': new Date().toISOString()
      }
    };

    await coreV1Api.createNamespacedConfigMap(namespace, configMap);

    return res.status(200).json({
      status: 'created',
      namespace,
      service: serviceResult.body,
      message: 'Advanced challenge instance created successfully'
    });

  } catch (error: any) {
    console.error('Error creating advanced challenge:', error);
    return res.status(500).json({ 
      error: 'Failed to create advanced challenge', 
      message: error.message 
    });
  }
}

/**
 * Get detailed status with metrics and pod information
 */
async function getDetailedStatus(
  coreV1Api: k8s.CoreV1Api,
  appsV1Api: k8s.AppsV1Api,
  metricsClient: k8s.Metrics,
  namespace: string,
  res: NextApiResponse
) {
  try {
    // Get pods
    const podsResponse = await coreV1Api.listNamespacedPod(namespace);
    const pods = podsResponse.body.items;

    // Get services
    const servicesResponse = await coreV1Api.listNamespacedService(namespace);
    const services = servicesResponse.body.items;

    // Get deployments
    const deploymentsResponse = await appsV1Api.listNamespacedDeployment(namespace);
    const deployments = deploymentsResponse.body.items;

    // Get metrics (if available)
    let metrics = { cpu: '0m', memory: '0Mi' };
    try {
      let totalCpu = 0;
      let totalMemory = 0;

      for (const pod of pods) {
        if (pod.status?.phase === 'Running') {
          try {
            const podMetrics = await metricsClient.getPodMetrics(namespace, pod.metadata?.name || '');
            
            for (const container of podMetrics.containers || []) {
              const cpuUsage = parseCpuMetric(container.usage?.cpu || '0');
              const memoryUsage = parseMemoryMetric(container.usage?.memory || '0');
              
              totalCpu += cpuUsage;
              totalMemory += memoryUsage;
            }
          } catch (metricsError) {
            console.warn(`Could not get metrics for pod ${pod.metadata?.name}`);
          }
        }
      }

      metrics = {
        cpu: `${totalCpu.toFixed(2)}m`,
        memory: `${(totalMemory / 1024 / 1024).toFixed(2)}Mi`
      };
    } catch (metricsError) {
      console.warn('Metrics server not available');
    }

    // Determine overall status
    let status = 'unknown';
    if (pods.length === 0) {
      status = 'no-pods';
    } else {
      const runningPods = pods.filter(pod => pod.status?.phase === 'Running');
      const pendingPods = pods.filter(pod => pod.status?.phase === 'Pending');
      const failedPods = pods.filter(pod => pod.status?.phase === 'Failed');

      if (failedPods.length > 0) {
        status = 'failed';
      } else if (runningPods.length === pods.length) {
        status = 'running';
      } else if (pendingPods.length > 0) {
        status = 'pending';
      }
    }

    return res.status(200).json({
      status,
      namespace,
      pods: pods.map(pod => ({
        name: pod.metadata?.name,
        phase: pod.status?.phase,
        ready: pod.status?.conditions?.find(c => c.type === 'Ready')?.status === 'True',
        restarts: pod.status?.containerStatuses?.[0]?.restartCount || 0,
        image: pod.spec?.containers?.[0]?.image,
        node: pod.spec?.nodeName
      })),
      services: services.map(service => ({
        name: service.metadata?.name,
        type: service.spec?.type,
        clusterIP: service.spec?.clusterIP,
        ports: service.spec?.ports
      })),
      deployments: deployments.map(deployment => ({
        name: deployment.metadata?.name,
        replicas: deployment.spec?.replicas,
        readyReplicas: deployment.status?.readyReplicas,
        availableReplicas: deployment.status?.availableReplicas
      })),
      metrics,
      message: `Namespace ${namespace} status retrieved`
    });

  } catch (error: any) {
    console.error('Error getting detailed status:', error);
    return res.status(500).json({ 
      error: 'Failed to get detailed status', 
      message: error.message 
    });
  }
}

/**
 * Get challenge logs from all pods
 */
async function getChallengeLogs(
  coreV1Api: k8s.CoreV1Api,
  logApi: k8s.Log,
  namespace: string,
  res: NextApiResponse
) {
  try {
    const podsResponse = await coreV1Api.listNamespacedPod(namespace);
    const pods = podsResponse.body.items;
    const logs: string[] = [];

    for (const pod of pods) {
      if (pod.status?.phase === 'Running' || pod.status?.phase === 'Succeeded') {
        try {
          // Get logs for the pod
          const logStream = await logApi.log(
            namespace,
            pod.metadata?.name || '',
            '', // container name (empty for single container)
            null as any, // output stream
            {
              follow: false,
              tailLines: 100,
              pretty: false,
              timestamps: true
            }
          );

          // Convert stream to string
          const podLogs = await streamToString(logStream);
          logs.push(`=== Pod: ${pod.metadata?.name} ===\n${podLogs}\n`);
          
        } catch (logError) {
          console.error(`Error getting logs for pod ${pod.metadata?.name}:`, logError);
          logs.push(`=== Pod: ${pod.metadata?.name} ===\nError retrieving logs: ${logError}\n`);
        }
      }
    }

    return res.status(200).json({
      status: 'success',
      namespace,
      logs,
      message: `Retrieved logs from ${pods.length} pods`
    });

  } catch (error: any) {
    console.error('Error getting challenge logs:', error);
    return res.status(500).json({ 
      error: 'Failed to get challenge logs', 
      message: error.message 
    });
  }
}

/**
 * Scale challenge deployment
 */
async function scaleChallenge(
  appsV1Api: k8s.AppsV1Api,
  namespace: string,
  replicas: number,
  res: NextApiResponse
) {
  try {
    const deploymentsResponse = await appsV1Api.listNamespacedDeployment(namespace);
    const deployments = deploymentsResponse.body.items;

    if (deployments.length === 0) {
      return res.status(404).json({ error: 'No deployments found in namespace' });
    }

    for (const deployment of deployments) {
      if (deployment.spec) {
        deployment.spec.replicas = replicas;
        
        await appsV1Api.patchNamespacedDeployment(
          deployment.metadata?.name || '',
          namespace,
          deployment
        );
      }
    }

    return res.status(200).json({
      status: 'scaled',
      namespace,
      replicas,
      message: `Scaled deployment to ${replicas} replicas`
    });

  } catch (error: any) {
    console.error('Error scaling challenge:', error);
    return res.status(500).json({ 
      error: 'Failed to scale challenge', 
      message: error.message 
    });
  }
}

/**
 * Setup real-time watcher for namespace events
 */
async function setupWatcher(
  kc: k8s.KubeConfig,
  namespace: string,
  res: NextApiResponse
) {
  try {
    const watch = new k8s.Watch(kc);
    const events: any[] = [];

    // Watch pods for 10 seconds and return events
    const watchRequest = await watch.watch(
      `/api/v1/namespaces/${namespace}/pods`,
      {},
      (type: string, apiObj: any) => {
        events.push({
          type,
          object: {
            name: apiObj.metadata?.name,
            phase: apiObj.status?.phase,
            timestamp: new Date().toISOString()
          }
        });
      },
      (err: any) => {
        console.error('Watch error:', err);
      }
    );

    // Stop watching after 10 seconds
    setTimeout(() => {
      watchRequest.abort();
      
      return res.status(200).json({
        status: 'watched',
        namespace,
        events,
        message: `Watched namespace for 10 seconds, captured ${events.length} events`
      });
    }, 10000);

  } catch (error: any) {
    console.error('Error setting up watcher:', error);
    return res.status(500).json({ 
      error: 'Failed to setup watcher', 
      message: error.message 
    });
  }
}

// Helper functions
function generateNamespace(username: string, questionId: string): string {
  const prefix = process.env.K8S_NAMESPACE_PREFIX || 'hackcubes';
  const cleanUsername = username.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const shortQuestionId = questionId.substring(0, 8);
  return `${prefix}-${cleanUsername}-${shortQuestionId}`;
}

function parseCpuMetric(cpu: string): number {
  if (cpu.endsWith('m')) {
    return parseInt(cpu.slice(0, -1));
  }
  return parseInt(cpu) * 1000;
}

function parseMemoryMetric(memory: string): number {
  const units: { [key: string]: number } = {
    'Ki': 1024,
    'Mi': 1024 * 1024,
    'Gi': 1024 * 1024 * 1024
  };

  for (const [unit, multiplier] of Object.entries(units)) {
    if (memory.endsWith(unit)) {
      return parseInt(memory.slice(0, -unit.length)) * multiplier;
    }
  }
  
  return parseInt(memory);
}

async function streamToString(stream: any): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    stream.on('data', (chunk: any) => {
      data += chunk.toString();
    });
    stream.on('end', () => {
      resolve(data);
    });
    stream.on('error', reject);
  });
} 