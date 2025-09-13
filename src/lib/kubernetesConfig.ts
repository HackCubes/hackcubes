import * as k8s from '@kubernetes/client-node';

export class EKSKubernetesManager {
  private kc: k8s.KubeConfig;
  private coreV1Api: k8s.CoreV1Api;
  private appsV1Api: k8s.AppsV1Api;
  private metricsClient: k8s.Metrics;
  private watchApi: k8s.Watch;
  private logApi: k8s.Log;

  constructor() {
    this.kc = new k8s.KubeConfig();
    this.initializeKubeConfig();
    
    // Initialize API clients
    this.coreV1Api = this.kc.makeApiClient(k8s.CoreV1Api);
    this.appsV1Api = this.kc.makeApiClient(k8s.AppsV1Api);
    this.metricsClient = new k8s.Metrics(this.kc);
    this.watchApi = new k8s.Watch(this.kc);
    this.logApi = new k8s.Log(this.kc);
  }

  private initializeKubeConfig() {
    // Always use EKS configuration if available, regardless of environment
    const clusterName = process.env.EKS_CLUSTER_NAME;
    const clusterEndpoint = process.env.EKS_CLUSTER_ENDPOINT;
    const region = process.env.EKS_CLUSTER_REGION || process.env.AWS_REGION || 'us-east-1';

    if (clusterName && clusterEndpoint) {
      // Configure for EKS (works for both dev and production)
      console.log(`🎯 Configuring EKS authentication for cluster: ${clusterName}`);
      this.configureEKS(clusterName, clusterEndpoint, region);
    } else if (process.env.NODE_ENV === 'production') {
      // Only fallback to loadFromCluster if EKS config is not available
      console.log('🔄 Falling back to in-cluster authentication');
      this.kc.loadFromCluster();
    } else {
      // For development without EKS config, try default kubeconfig
      try {
        this.kc.loadFromDefault();
      } catch (error) {
        console.warn('Could not load default kubeconfig:', error);
        throw new Error('No valid Kubernetes configuration found. Please set EKS_CLUSTER_NAME and EKS_CLUSTER_ENDPOINT environment variables.');
      }
    }
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

    console.log(`🔐 EKS SSL Configuration: skipTLSVerify=${shouldSkipTLSVerify}, caData=${process.env.EKS_CA_DATA ? 'provided' : 'not provided'}`);

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
      console.log('🔓 TLS verification disabled for EKS cluster connection');
    }
  }

  // Create challenge instance in Kubernetes
  async createChallengeInstance(
    questionId: string,
    candidateId: string,
    username: string,
    config: ChallengeConfig
  ): Promise<K8sChallengeInstance> {
    const namespace = this.generateNamespace(username, questionId);
    
    try {
      console.log(`🚀 Creating K8s challenge instance in namespace: ${namespace}`);
      console.log(`🐳 Using Docker image: ${config.image}`);
      
      // 1. Create namespace
      await this.createNamespaceWithLabels(namespace, candidateId, questionId);
      
      // 2. Create deployment
      await this.createDeployment(namespace, config);
      
      // 3. Create service
      const service = await this.createService(namespace, config);
      
      // 4. Wait for pod to be ready and get IP
      const ip = await this.waitForPodReady(namespace);
      
      return {
        questionId,
        candidateId,
        username,
        namespace,
        status: 'running',
        ip: ip,
        ports: config.ports || [80],
        expirationTime: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
      };
    } catch (error) {
      console.error('Error creating K8s challenge instance:', error);
      throw error;
    }
  }

  private generateNamespace(username: string, questionId: string): string {
    return `hackcubes-${username}-${questionId}`.toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .substring(0, 63);
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
          'hackcubes.com/candidate-id': candidateId,
          'hackcubes.com/question-id': questionId,
          'hackcubes.com/created-at': new Date().toISOString().replace(/[:.]/g, '-')
        }
      }
    };

    try {
      await this.coreV1Api.createNamespace(namespaceManifest);
      console.log(`✅ Created namespace: ${namespace}`);
    } catch (error: any) {
      if (error?.response?.statusCode !== 409) { // 409 = Already exists
        throw error;
      }
      console.log(`ℹ️  Namespace ${namespace} already exists`);
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
                runAsNonRoot: false, // Allow root for some challenge images
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

  private async createService(namespace: string, config: ChallengeConfig): Promise<k8s.V1Service> {
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
        ports: config.ports.map((port, index) => ({
          name: `port-${port}`,
          port: port,
          targetPort: port,
          protocol: 'TCP' as k8s.V1ServicePort['protocol']
        })),
        selector: {
          app: 'challenge'
        }
      }
    };

    try {
      // Check if service already exists
      try {
        const existing = await this.coreV1Api.readNamespacedService(serviceName, namespace);
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
        return existing.body;
      } catch (readError: any) {
        if (readError.response?.statusCode === 404) {
          // Service doesn't exist, create it
          const result = await this.coreV1Api.createNamespacedService(namespace, service);
          console.log(`✅ Created service ${serviceName} in namespace ${namespace}`);
          return result.body;
        } else {
          throw readError;
        }
      }
    } catch (error) {
      console.error(`Error managing service ${serviceName}:`, error);
      throw error;
    }
  }

  private async waitForPodReady(namespace: string, timeoutMs: number = 120000): Promise<string> {
    const startTime = Date.now();
    
    console.log(`⏳ Waiting for pod to be ready in namespace: ${namespace}`);
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const pods = await this.coreV1Api.listNamespacedPod(namespace, undefined, undefined, undefined, undefined, 'app=challenge');
        
        if (pods.body.items.length > 0) {
          const pod = pods.body.items[0];
          
          if (pod.status?.phase === 'Running' && 
              pod.status?.conditions?.some(c => c.type === 'Ready' && c.status === 'True')) {
            
            // Try to get external IP from service
            const services = await this.coreV1Api.listNamespacedService(namespace);
            const service = services.body.items.find(s => s.metadata?.name === 'challenge-service');
            
            if (service?.status?.loadBalancer?.ingress?.[0]) {
              const externalIP = service.status.loadBalancer.ingress[0].ip || 
                               service.status.loadBalancer.ingress[0].hostname || 
                               'pending';
              console.log(`🌐 LoadBalancer IP: ${externalIP}`);
              return externalIP;
            }
            
            const podIP = pod.status?.podIP;
            console.log(`🏠 Pod IP: ${podIP}`);
            return podIP || 'ready';
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error('Error waiting for pod:', error);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    console.log(`⏰ Timeout waiting for pod in ${namespace}`);
    return 'timeout';
  }

  // Get challenge instance status
  async getChallengeStatus(namespace: string): Promise<K8sChallengeStatus> {
    try {
      const pods = await this.coreV1Api.listNamespacedPod(namespace, undefined, undefined, undefined, undefined, 'app=challenge');
      const services = await this.coreV1Api.listNamespacedService(namespace);
      
      if (pods.body.items.length === 0) {
        console.log(`⚠️  No pods found in namespace ${namespace}`);
        return { status: 'not_found' };
      }
      
      const pod = pods.body.items[0];
      const service = services.body.items.find(s => s.metadata?.name === 'challenge-service');
      
      // Debug logging
      console.log(`🔍 Pod status: ${pod.status?.phase}, Ready: ${pod.status?.conditions?.some(c => c.type === 'Ready' && c.status === 'True')}`);
      
      // Check for pod issues
      if (pod.status?.phase === 'Pending') {
        if (pod.status?.conditions) {
          for (const condition of pod.status.conditions) {
            if (condition.status === 'False') {
              console.log(`⚠️  Pod condition issue: ${condition.type} - ${condition.reason}: ${condition.message}`);
            }
          }
        }
        
        // Check container status for more details
        if (pod.status?.containerStatuses) {
          for (const container of pod.status.containerStatuses) {
            if (container.state?.waiting) {
              console.log(`⚠️  Container waiting: ${container.state.waiting.reason} - ${container.state.waiting.message}`);
            }
          }
        }
      }
      
      let ip = 'pending';
      if (service?.status?.loadBalancer?.ingress?.[0]) {
        ip = service.status.loadBalancer.ingress[0].ip || 
             service.status.loadBalancer.ingress[0].hostname || 
             pod.status?.podIP || 'pending';
      } else if (pod.status?.podIP) {
        ip = pod.status.podIP;
      }
      
      // Map pod phase to our status format
      const status = pod.status?.phase?.toLowerCase() || 'unknown';
      const isReady = pod.status?.conditions?.some(c => c.type === 'Ready' && c.status === 'True') || false;
      
      console.log(`📊 Status: ${status}, IP: ${ip}, Ready: ${isReady}`);
      
      return {
        status: status,
        ip: ip,
        ready: isReady
      };
    } catch (error) {
      console.error('Error getting challenge status:', error);
      return { status: 'error' };
    }
  }

  // Stop challenge instance
  async stopChallengeInstance(namespace: string): Promise<void> {
    try {
      // Scale deployment to 0
      await this.appsV1Api.patchNamespacedDeploymentScale(
        'challenge',
        namespace,
        { spec: { replicas: 0 } },
        undefined, undefined, undefined, undefined, undefined,
        { headers: { 'Content-Type': 'application/merge-patch+json' } }
      );
      console.log(`🛑 Stopped challenge in namespace: ${namespace}`);
    } catch (error) {
      console.error('Error stopping challenge instance:', error);
      throw error;
    }
  }

  // Restart challenge instance  
  async restartChallengeInstance(namespace: string): Promise<void> {
    try {
      // Scale to 0 then back to 1
      await this.appsV1Api.patchNamespacedDeploymentScale(
        'challenge',
        namespace,
        { spec: { replicas: 0 } },
        undefined, undefined, undefined, undefined, undefined,
        { headers: { 'Content-Type': 'application/merge-patch+json' } }
      );
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await this.appsV1Api.patchNamespacedDeploymentScale(
        'challenge',
        namespace,
        { spec: { replicas: 1 } },
        undefined, undefined, undefined, undefined, undefined,
        { headers: { 'Content-Type': 'application/merge-patch+json' } }
      );
      console.log(`🔄 Restarted challenge in namespace: ${namespace}`);
    } catch (error) {
      console.error('Error restarting challenge instance:', error);
      throw error;
    }
  }

  // Delete challenge instance
  async deleteChallengeInstance(namespace: string): Promise<void> {
    try {
      await this.coreV1Api.deleteNamespace(namespace);
      console.log(`🗑️  Deleted namespace: ${namespace}`);
    } catch (error) {
      console.error('Error deleting challenge instance:', error);
      throw error;
    }
  }
}

// Types
export interface ChallengeConfig {
  image: string;
  ports: number[];
  environment?: Record<string, string>;
  resources?: {
    requests?: { cpu: string; memory: string };
    limits?: { cpu: string; memory: string };
  };
  replicas?: number;
}

export interface K8sChallengeInstance {
  questionId: string;
  candidateId: string;
  username: string;
  namespace: string;
  status: string;
  ip?: string;
  ports?: number[];
  expirationTime?: string;
}

export interface K8sChallengeStatus {
  status: string;
  ip?: string;
  ready?: boolean;
} 