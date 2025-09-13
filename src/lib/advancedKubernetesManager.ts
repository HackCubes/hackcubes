import * as k8s from '@kubernetes/client-node';
import { createClient } from '@/lib/supabase/client';

interface ChallengeInstance {
  questionId: string;
  candidateId: string;
  username: string;
  namespace: string;
  status: 'creating' | 'running' | 'stopping' | 'stopped' | 'error';
  pods: k8s.V1Pod[];
  services: k8s.V1Service[];
  logs?: string[];
  metrics?: {
    cpu: string;
    memory: string;
  };
}

interface ChallengeConfig {
  image: string;
  ports: number[];
  environment?: { [key: string]: string };
  resources?: {
    requests?: { cpu: string; memory: string };
    limits?: { cpu: string; memory: string };
  };
  replicas?: number;
}

export class AdvancedKubernetesManager {
  private kc: k8s.KubeConfig;
  private coreV1Api: k8s.CoreV1Api;
  private appsV1Api: k8s.AppsV1Api;
  private metricsClient: k8s.Metrics;
  private watchApi: k8s.Watch;
  private logApi: k8s.Log;
  private activeWatchers: Map<string, any> = new Map();

  constructor() {
    this.kc = new k8s.KubeConfig();
    
    // Always use EKS configuration if available, regardless of environment
    const clusterName = process.env.EKS_CLUSTER_NAME;
    const clusterEndpoint = process.env.EKS_CLUSTER_ENDPOINT;
    const region = process.env.EKS_CLUSTER_REGION || process.env.AWS_REGION || 'us-east-1';

    if (clusterName && clusterEndpoint) {
      // Configure for EKS (works for both dev and production)
      console.log(`🎯 AdvancedK8s: Configuring EKS authentication for cluster: ${clusterName}`);
      this.configureEKS(clusterName, clusterEndpoint, region);
    } else if (process.env.NODE_ENV === 'production') {
      // Only fallback to loadFromCluster if EKS config is not available
      console.log('🔄 AdvancedK8s: Falling back to in-cluster authentication');
      this.kc.loadFromCluster();
    } else {
      this.kc.loadFromDefault(); // Local development
    }

    // Initialize API clients
    this.coreV1Api = this.kc.makeApiClient(k8s.CoreV1Api);
    this.appsV1Api = this.kc.makeApiClient(k8s.AppsV1Api);
    this.metricsClient = new k8s.Metrics(this.kc);
    this.watchApi = new k8s.Watch(this.kc);
    this.logApi = new k8s.Log(this.kc);
  }

  private configureEKS(clusterName: string, endpoint: string, region: string) {
    // EKS-specific configuration with SSL handling
    // Allow skipping TLS verification in production if EKS_SKIP_TLS_VERIFY is set
    const shouldSkipTLSVerify = process.env.NODE_ENV !== 'production' || 
                               process.env.EKS_SKIP_TLS_VERIFY === 'true';
    
    const cluster = {
      name: clusterName,
      server: endpoint,
      skipTLSVerify: shouldSkipTLSVerify,
      // Use CA data in production if available
      ...(process.env.NODE_ENV === 'production' && process.env.EKS_CA_DATA && {
        caData: process.env.EKS_CA_DATA
      })
    };

    console.log(`🔐 AdvancedK8s SSL Configuration: skipTLSVerify=${shouldSkipTLSVerify}`);

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

    this.kc.loadFromOptions({
      clusters: [cluster],
      users: [user],
      contexts: [context],
      currentContext: `${clusterName}-context`
    });

    // Disable strict SSL if in development or if explicitly configured for production
    if (process.env.NODE_ENV !== 'production' || process.env.EKS_SKIP_TLS_VERIFY === 'true') {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      console.log('🔓 AdvancedK8s: TLS verification disabled for EKS cluster connection');
    }
  }

  /**
   * Create a comprehensive challenge instance with monitoring
   */
  async createChallengeInstance(
    questionId: string,
    candidateId: string,
    username: string,
    config: ChallengeConfig
  ): Promise<ChallengeInstance> {
    const namespace = this.generateNamespace(username, questionId);
    
    try {
      // 1. Create namespace with proper labels
      await this.createNamespaceWithLabels(namespace, candidateId, questionId);
      
      // 2. Create deployment
      await this.createDeployment(namespace, config);
      
      // 3. Create service
      await this.createService(namespace, config);
      
      // 4. Setup monitoring and logging
      await this.setupInstanceMonitoring(namespace, questionId, candidateId);
      
      // 5. Return instance information
      const instance: ChallengeInstance = {
        questionId,
        candidateId,
        username,
        namespace,
        status: 'creating',
        pods: [],
        services: []
      };

      return instance;
    } catch (error) {
      console.error('Error creating challenge instance:', error);
      throw error;
    }
  }

  /**
   * Watch challenge instance in real-time
   */
  async watchChallengeInstance(
    namespace: string,
    callback: (instance: ChallengeInstance) => void
  ): Promise<void> {
    try {
      // Watch pods in the namespace
      const podWatcher = await this.watchApi.watch(
        `/api/v1/namespaces/${namespace}/pods`,
        {},
        (type: string, apiObj: k8s.V1Pod) => {
          console.log(`Pod ${apiObj.metadata?.name} ${type} in ${namespace}`);
          this.updateInstanceStatus(namespace, callback);
        },
        (err: any) => {
          console.error('Pod watch error:', err);
        }
      );

      // Watch services in the namespace
      const serviceWatcher = await this.watchApi.watch(
        `/api/v1/namespaces/${namespace}/services`,
        {},
        (type: string, apiObj: k8s.V1Service) => {
          console.log(`Service ${apiObj.metadata?.name} ${type} in ${namespace}`);
          this.updateInstanceStatus(namespace, callback);
        },
        (err: any) => {
          console.error('Service watch error:', err);
        }
      );

      // Store watchers for cleanup
      this.activeWatchers.set(`${namespace}-pods`, podWatcher);
      this.activeWatchers.set(`${namespace}-services`, serviceWatcher);

    } catch (error) {
      console.error('Error setting up watchers:', error);
    }
  }

  /**
   * Get real-time logs from challenge pods
   */
  async getChallengeLogs(namespace: string, podName?: string): Promise<string[]> {
    try {
      const pods = await this.getNamespacePods(namespace);
      const logs: string[] = [];

      for (const pod of pods) {
        if (podName && pod.metadata?.name !== podName) continue;
        
        try {
          const logStream = await this.logApi.log(
            namespace,
            pod.metadata?.name || '',
            '', // container name (empty for single container)
            null as any, // log stream
            {
              follow: false,
              tailLines: 100,
              pretty: false,
              timestamps: true
            }
          );

          // Convert stream to string
          const podLogs = await this.streamToString(logStream);
          logs.push(`=== ${pod.metadata?.name} ===\n${podLogs}`);
        } catch (logError) {
          console.error(`Error getting logs for pod ${pod.metadata?.name}:`, logError);
        }
      }

      return logs;
    } catch (error) {
      console.error('Error getting challenge logs:', error);
      return [];
    }
  }

  /**
   * Scale challenge deployment
   */
  async scaleChallenge(namespace: string, replicas: number): Promise<boolean> {
    try {
      const deployments = await this.appsV1Api.listNamespacedDeployment(namespace);
      
      for (const deployment of deployments.body.items) {
        if (deployment.spec) {
          deployment.spec.replicas = replicas;
          
          await this.appsV1Api.patchNamespacedDeployment(
            deployment.metadata?.name || '',
            namespace,
            deployment
          );
        }
      }

      return true;
    } catch (error) {
      console.error('Error scaling challenge:', error);
      return false;
    }
  }

  /**
   * Get challenge metrics (CPU, Memory usage)
   */
  async getChallengeMetrics(namespace: string): Promise<{ cpu: string; memory: string }> {
    try {
      const pods = await this.getNamespacePods(namespace);
      let totalCpu = 0;
      let totalMemory = 0;

      for (const pod of pods) {
        try {
          const metrics = await this.metricsClient.getPodMetrics(namespace, pod.metadata?.name || '');
          
          // Parse CPU and memory metrics
          for (const container of metrics.containers || []) {
            const cpuUsage = this.parseCpuMetric(container.usage?.cpu || '0');
            const memoryUsage = this.parseMemoryMetric(container.usage?.memory || '0');
            
            totalCpu += cpuUsage;
            totalMemory += memoryUsage;
          }
        } catch (metricsError) {
          console.warn(`Could not get metrics for pod ${pod.metadata?.name}`);
        }
      }

      return {
        cpu: `${totalCpu.toFixed(2)}m`,
        memory: `${(totalMemory / 1024 / 1024).toFixed(2)}Mi`
      };
    } catch (error) {
      console.error('Error getting challenge metrics:', error);
      return { cpu: '0m', memory: '0Mi' };
    }
  }

  /**
   * Execute commands inside challenge containers
   */
  async executeInChallenge(
    namespace: string,
    podName: string,
    command: string[]
  ): Promise<string> {
    try {
      const exec = new k8s.Exec(this.kc);
      let output = '';

      await exec.exec(
        namespace,
        podName,
        '', // container name
        command,
        null as any, // stdout
        null as any, // stderr
        null as any, // stdin
        false, // tty
        (status: k8s.V1Status) => {
          console.log('Exec status:', status);
        }
      );

      return output;
    } catch (error) {
      console.error('Error executing command in challenge:', error);
      return '';
    }
  }

  /**
   * Get comprehensive challenge status
   */
  async getChallengeStatus(namespace: string): Promise<ChallengeInstance | null> {
    try {
      const [pods, services, logs, metrics] = await Promise.all([
        this.getNamespacePods(namespace),
        this.getNamespaceServices(namespace),
        this.getChallengeLogs(namespace),
        this.getChallengeMetrics(namespace)
      ]);

      // Determine overall status
      let status: ChallengeInstance['status'] = 'stopped';
      if (pods.length === 0) {
        status = 'stopped';
      } else {
        const runningPods = pods.filter(pod => pod.status?.phase === 'Running');
        const pendingPods = pods.filter(pod => pod.status?.phase === 'Pending');
        const failedPods = pods.filter(pod => pod.status?.phase === 'Failed');

        if (failedPods.length > 0) {
          status = 'error';
        } else if (runningPods.length === pods.length) {
          status = 'running';
        } else if (pendingPods.length > 0) {
          status = 'creating';
        }
      }

      return {
        questionId: '',
        candidateId: '',
        username: '',
        namespace,
        status,
        pods,
        services,
        logs,
        metrics
      };
    } catch (error) {
      console.error('Error getting challenge status:', error);
      return null;
    }
  }

  /**
   * Cleanup challenge instance and watchers
   */
  async cleanupChallengeInstance(namespace: string): Promise<boolean> {
    try {
      // Stop watchers
      const podWatcher = this.activeWatchers.get(`${namespace}-pods`);
      const serviceWatcher = this.activeWatchers.get(`${namespace}-services`);
      
      if (podWatcher) {
        podWatcher.abort();
        this.activeWatchers.delete(`${namespace}-pods`);
      }
      
      if (serviceWatcher) {
        serviceWatcher.abort();
        this.activeWatchers.delete(`${namespace}-services`);
      }

      // Delete namespace (cascades to all resources)
      await this.coreV1Api.deleteNamespace(namespace);
      
      return true;
    } catch (error) {
      console.error('Error cleaning up challenge instance:', error);
      return false;
    }
  }

  // Helper methods
  private generateNamespace(username: string, questionId: string): string {
    const prefix = process.env.K8S_NAMESPACE_PREFIX || 'hackcubes';
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const shortQuestionId = questionId.substring(0, 8);
    return `${prefix}-${cleanUsername}-${shortQuestionId}`;
  }

  private async createNamespaceWithLabels(
    namespace: string, 
    candidateId: string, 
    questionId: string
  ): Promise<void> {
    const namespaceManifest: k8s.V1Namespace = {
      metadata: {
        name: namespace,
        labels: {
          'hackcubes.com/type': 'challenge',
          'hackcubes.com/candidate': candidateId,
          'hackcubes.com/question': questionId,
          'hackcubes.com/created-by': 'hackcubes-platform'
        },
        annotations: {
          'hackcubes.com/created-at': new Date().toISOString(),
          'hackcubes.com/auto-cleanup': 'true'
        }
      }
    };

    try {
      await this.coreV1Api.createNamespace(namespaceManifest);
    } catch (error: any) {
      if (error.response?.statusCode !== 409) { // 409 = Already exists
        throw error;
      }
    }
  }

  private async createDeployment(namespace: string, config: ChallengeConfig): Promise<void> {
    const deploymentName = 'challenge';
    
    const deployment: k8s.V1Deployment = {
      metadata: {
        name: deploymentName,
        labels: {
          app: 'challenge'
        }
      },
      spec: {
        replicas: config.replicas || 1,
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
            containers: [{
              name: 'challenge',
              image: config.image,
              ports: config.ports.map(port => ({ containerPort: port })),
              env: Object.entries(config.environment || {}).map(([key, value]) => ({
                name: key,
                value: value
              })),
              resources: config.resources,
              securityContext: {
                runAsNonRoot: false,
                allowPrivilegeEscalation: false,
                readOnlyRootFilesystem: false,
                capabilities: {
                  drop: ['ALL']
                }
              }
            }],
            securityContext: {
              fsGroup: 2000
            }
          }
        }
      }
    };

    try {
      // Check if deployment already exists
      try {
        await this.appsV1Api.readNamespacedDeployment(deploymentName, namespace);
        console.log(`✅ Deployment ${deploymentName} already exists in namespace ${namespace}`);
        
        // Update the existing deployment
        await this.appsV1Api.patchNamespacedDeployment(
          deploymentName, 
          namespace, 
          deployment,
          undefined, undefined, undefined, undefined, undefined,
          { headers: { 'Content-Type': 'application/merge-patch+json' } }
        );
        console.log(`✅ Updated deployment ${deploymentName} in namespace ${namespace}`);
      } catch (readError: any) {
        if (readError.response?.statusCode === 404) {
          // Deployment doesn't exist, create it
          await this.appsV1Api.createNamespacedDeployment(namespace, deployment);
          console.log(`✅ Created deployment ${deploymentName} in namespace ${namespace}`);
        } else {
          throw readError;
        }
      }
    } catch (error) {
      console.error(`Error managing deployment ${deploymentName}:`, error);
      throw error;
    }
  }

  private async createService(namespace: string, config: ChallengeConfig): Promise<void> {
    const serviceName = 'challenge-service';
    
    const service: k8s.V1Service = {
      metadata: {
        name: serviceName,
        labels: {
          app: 'challenge'
        }
      },
      spec: {
        type: 'LoadBalancer',
        ports: config.ports.map(port => ({
          port: port,
          targetPort: port,
          protocol: 'TCP'
        })),
        selector: {
          app: 'challenge'
        }
      }
    };

    try {
      // Check if service already exists
      try {
        await this.coreV1Api.readNamespacedService(serviceName, namespace);
        console.log(`✅ Service ${serviceName} already exists in namespace ${namespace}`);
        
        // Update the existing service
        await this.coreV1Api.patchNamespacedService(
          serviceName,
          namespace,
          service,
          undefined, undefined, undefined, undefined, undefined,
          { headers: { 'Content-Type': 'application/merge-patch+json' } }
        );
        console.log(`✅ Updated service ${serviceName} in namespace ${namespace}`);
      } catch (readError: any) {
        if (readError.response?.statusCode === 404) {
          // Service doesn't exist, create it
          await this.coreV1Api.createNamespacedService(namespace, service);
          console.log(`✅ Created service ${serviceName} in namespace ${namespace}`);
        } else {
          throw readError;
        }
      }
    } catch (error) {
      console.error(`Error managing service ${serviceName}:`, error);
      throw error;
    }
  }

  private async getNamespacePods(namespace: string): Promise<k8s.V1Pod[]> {
    try {
      const response = await this.coreV1Api.listNamespacedPod(namespace);
      return response.body.items;
    } catch (error) {
      console.error('Error getting namespace pods:', error);
      return [];
    }
  }

  private async getNamespaceServices(namespace: string): Promise<k8s.V1Service[]> {
    try {
      const response = await this.coreV1Api.listNamespacedService(namespace);
      return response.body.items;
    } catch (error) {
      console.error('Error getting namespace services:', error);
      return [];
    }
  }

  private async setupInstanceMonitoring(
    namespace: string,
    questionId: string,
    candidateId: string
  ): Promise<void> {
    // Update database with initial instance info
    const supabase = createClient();
    
    try {
      await supabase
        .from('challenge_instances')
        .upsert({
          user_id: candidateId,
          question_id: questionId,
          instance_id: namespace,
          instance_type: 'kubernetes',
          status: 'STARTING',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error updating instance record:', error);
    }
  }

  private async updateInstanceStatus(
    namespace: string,
    callback: (instance: ChallengeInstance) => void
  ): Promise<void> {
    const instance = await this.getChallengeStatus(namespace);
    if (instance) {
      callback(instance);
    }
  }

  private parseCpuMetric(cpu: string): number {
    // Parse CPU metrics (e.g., "100m" = 100 millicores)
    if (cpu.endsWith('m')) {
      return parseInt(cpu.slice(0, -1));
    }
    return parseInt(cpu) * 1000;
  }

  private parseMemoryMetric(memory: string): number {
    // Parse memory metrics (e.g., "128Mi" = 128 * 1024 * 1024 bytes)
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

  private async streamToString(stream: any): Promise<string> {
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
}

// Export singleton instance
export const kubernetesManager = new AdvancedKubernetesManager(); 