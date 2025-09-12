// Instance Manager - Unified interface for AWS Lambda and Kubernetes challenge management

import { EKSKubernetesManager, ChallengeConfig } from './kubernetesConfig';

interface InstanceManagerOptions {
  action: 'start' | 'stop' | 'restart' | 'get_status';
  questionId: string;
  candidateId: string;
  username?: string;
  question?: any; // The question object from database
  duration?: string;
}

interface InstanceResponse {
  status: string;
  ip?: string;
  instance_id?: string;
  expiration_time?: string;
  message?: string;
  error?: string;
  services?: Array<{
    name: string;
    type: string;
    ports: Array<{ port: number; nodePort?: number; targetPort: number }>;
  }>;
  current_state?: string;
  expirationTime?: string;
}

export class InstanceManager {
  /**
   * Determines whether to use Kubernetes or AWS based on question configuration
   * UPDATED: Now prefers Kubernetes for ALL challenges with infrastructure needs
   */
  private static getInstanceType(question: any): 'kubernetes' | 'aws' | 'none' {
    // If question explicitly set to use AWS (legacy support only)
    if (question?.deployment_type === 'aws' && question?.force_aws === true) {
      return 'aws';
    }
    
    // If question has infrastructure requirements, use Kubernetes
    if (question?.template_id || question?.instance_id || question?.docker_image) {
      return 'kubernetes';
    }
    
    // If question has deployment_type field set to kubernetes
    if (question?.deployment_type === 'kubernetes' || question?.deployment_type === 'k8s') {
      return 'kubernetes';
    }
    
    // Default to none for questions without infrastructure
    return 'none';
  }

  /**
   * Main method to manage instances across different backends
   */
  static async manageInstance(options: InstanceManagerOptions): Promise<InstanceResponse> {
    const { action, questionId, candidateId, username, question, duration } = options;
    
    const instanceType = this.getInstanceType(question);
    
    console.log(`🎯 Managing instance for question ${questionId} using ${instanceType} backend`);
    
    switch (instanceType) {
      case 'kubernetes':
        return this.manageKubernetesInstance(options);
        
      case 'aws':
        return this.manageAWSInstance(options);
        
      default:
        return {
          status: 'not_supported',
          error: 'This challenge does not support instance management'
        };
    }
  }

  /**
   * Manage Kubernetes-based instances
   * UPDATED: Now handles migration from EC2 template_id to Docker images
   */
  private static async manageKubernetesInstance(options: InstanceManagerOptions): Promise<InstanceResponse> {
    const { action, questionId, candidateId, username, question } = options;
    
    try {
      const k8sManager = new EKSKubernetesManager();
      const namespace = `hackcubes-${username}-${questionId}`.toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .substring(0, 63);

      switch (action) {
        case 'start':
          // Convert question config to Kubernetes config
          const config = this.createKubernetesConfig(question);
          const instance = await k8sManager.createChallengeInstance(
            questionId,
            candidateId,
            username || 'user',
            config
          );
          
          return {
            status: 'running',
            ip: instance.ip || 'pending',
            instance_id: instance.namespace,
            expiration_time: instance.expirationTime,
            message: 'Challenge instance created successfully'
          };

        case 'get_status':
          const status = await k8sManager.getChallengeStatus(namespace);
          return {
            status: status.status,
            ip: status.ip || 'pending',
            instance_id: namespace
          };

        case 'stop':
          await k8sManager.stopChallengeInstance(namespace);
          return {
            status: 'stopped',
            message: 'Challenge instance stopped'
          };

        case 'restart':
          await k8sManager.restartChallengeInstance(namespace);
          return {
            status: 'restarting',
            message: 'Challenge instance restarting'
          };

        default:
          return {
            status: 'error',
            error: `Unsupported action: ${action}`
          };
      }
    } catch (error: any) {
      console.error('Kubernetes instance management error:', error);
      return {
        status: 'error',
        error: error.message || 'Failed to manage Kubernetes instance'
      };
    }
  }

  /**
   * Create Kubernetes configuration from question data
   * Maps challenge names to specific Docker images and ports from WebChallenges
   */
  private static createKubernetesConfig(question: any): ChallengeConfig {
    let image = 'nginx:latest'; // default
    let ports = [80];
    let environment: Record<string, string> = {};

    // If question has docker_image, use it directly
    if (question?.docker_image) {
      image = question.docker_image;
      
      // Set specific ports based on the challenge docker image
      if (image.includes('achieverewards')) {
        ports = [5000];
      } else if (image.includes('atlas-frontend')) {
        ports = [5173];
      } else if (image.includes('atlas-backend')) {
        ports = [6000];
      } else if (image.includes('portfolio')) {
        ports = [5000];
      } else if (image.includes('integration-frontend')) {
        ports = [80];
      } else if (image.includes('integration-backend')) {
        ports = [6000];
      } else if (image.includes('integration-localapi')) {
        ports = [8080];
      } else if (image.includes('conference')) {
        ports = [3000];
      } else if (image.includes('techcorp')) {
        ports = [8080];
      }
    }
    // Map challenge names to specific configurations
    else if (question?.name) {
      const challengeName = question.name.toLowerCase();
      
      if (challengeName.includes('achieverewards')) {
        image = '082010050918.dkr.ecr.us-east-1.amazonaws.com/achieverewards:latest';
        ports = [5000];
      } else if (challengeName.includes('atlas')) {
        image = '082010050918.dkr.ecr.us-east-1.amazonaws.com/atlas-frontend:latest';
        ports = [5173];
      } else if (challengeName.includes('financial') || challengeName.includes('portfolio')) {
        image = '082010050918.dkr.ecr.us-east-1.amazonaws.com/portfolio:latest';
        ports = [5000];
      } else if (challengeName.includes('integration') || challengeName.includes('project')) {
        image = '082010050918.dkr.ecr.us-east-1.amazonaws.com/integration-frontend:latest';
        ports = [80];
      } else if (challengeName.includes('techcon') || challengeName.includes('conference')) {
        image = '082010050918.dkr.ecr.us-east-1.amazonaws.com/conference:latest';
        ports = [3000];
      } else if (challengeName.includes('techcorp')) {
        image = '082010050918.dkr.ecr.us-east-1.amazonaws.com/techcorp:latest';
        ports = [8080];
      }
    }
    // Map common EC2 template_ids to Docker images (legacy support)
    else if (question?.template_id) {
      image = this.mapTemplateIdToDockerImage(question.template_id, question.name);
    }
    // Map instance_id patterns to Docker images (legacy support)
    else if (question?.instance_id) {
      image = this.mapInstanceIdToDockerImage(question.instance_id, question.name);
    }

    // Set environment variables based on question
    if (question?.name) {
      environment['CHALLENGE_NAME'] = question.name;
    }
    if (question?.category) {
      environment['CHALLENGE_CATEGORY'] = question.category;
    }

    // Add specific environment variables for web challenges
    if (question?.category?.toLowerCase().includes('web')) {
      environment['FLASK_ENV'] = 'production';
      environment['NODE_ENV'] = 'production';
    }

    return {
      image,
      ports,
      environment,
      resources: {
        requests: { cpu: '100m', memory: '128Mi' },
        limits: { cpu: '500m', memory: '512Mi' }
      },
      replicas: 1
    };
  }

  /**
   * Map AWS EC2 template IDs to appropriate Docker images
   */
  private static mapTemplateIdToDockerImage(templateId: string, questionName?: string): string {
    // Common mappings based on your imported challenges
    const templateMappings: Record<string, string> = {
      'lt-0cb8327cecfab4c8f': 'nginx:latest',                  // Techfront Solutions
      'lt-062965b335504fcc5': 'httpd:latest',                 // ShadowAccess  
      'lt-08e367739ac29f518': 'wordpress:latest',             // Cloudsafe Solutions
    };

    if (templateMappings[templateId]) {
      return templateMappings[templateId];
    }

    // Default based on question name if available
    if (questionName) {
      const name = questionName.toLowerCase();
      if (name.includes('web') || name.includes('http')) {
        return 'nginx:latest';
      } else if (name.includes('wordpress') || name.includes('cms')) {
        return 'wordpress:latest';
      } else if (name.includes('apache')) {
        return 'httpd:latest';
      } else if (name.includes('mysql') || name.includes('database')) {
        return 'mysql:latest';
      } else if (name.includes('dvwa') || name.includes('vulnerable')) {
        return 'vulnerables/web-dvwa:latest';
      }
    }

    return 'nginx:latest'; // Safe default
  }

  /**
   * Map AWS EC2 instance IDs to appropriate Docker images
   */
  private static mapInstanceIdToDockerImage(instanceId: string, questionName?: string): string {
    // Instance ID mappings based on your imported challenges
    const instanceMappings: Record<string, string> = {
      'i-001f2e1f5117b3c3d': 'vulnerables/web-dvwa:latest',  // Achieve Rewards
      'i-0efe1611f7ce45970': 'webgoat/webgoat-8.0:latest',  // TechCon Conference
    };

    if (instanceMappings[instanceId]) {
      return instanceMappings[instanceId];
    }

    // Default logic similar to template mapping
    return this.mapTemplateIdToDockerImage('default', questionName);
  }

  /**
   * Legacy AWS instance management (maintained for backward compatibility)
   */
  private static async manageAWSInstance(options: InstanceManagerOptions): Promise<InstanceResponse> {
    const { action, questionId, candidateId, question, duration } = options;
    
    try {
      const baseUrl = process.env.NETWORK_LAMBDA_URL;
      const token = process.env.AWS_LAMBDA_TOKEN;

      if (!baseUrl || !token) {
        return {
          status: 'error',
          error: 'AWS Lambda configuration not available. Please use Kubernetes deployment.'
        };
      }

      // Build Lambda URL
      let lambdaUrl = `${baseUrl}?action=${action}&question_id=${questionId}&candidate_id=${candidateId}&token=${token}`;
      
      if (question?.template_id) {
        lambdaUrl += `&template_id=${question.template_id}`;
      }
      if (duration) {
        lambdaUrl += `&duration=${duration}`;
      }

      const response = await fetch(lambdaUrl, {
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!response.ok) {
        return {
          status: 'error',
          error: `AWS Lambda error: ${response.statusText}`
        };
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('AWS instance management error:', error);
      return {
        status: 'error',
        error: error.message || 'Failed to manage AWS instance'
      };
    }
  }

  /**
   * Extract hostname/URL from Kubernetes services
   */
  private static extractHostnameFromServices(services?: Array<any>): string | undefined {
    if (!services || services.length === 0) return undefined;
    
    // Look for NodePort services first
    const nodePortService = services.find(svc => svc.type === 'NodePort' && svc.ports?.length > 0);
    if (nodePortService && nodePortService.ports[0]?.nodePort) {
      // Construct URL using cluster's external IP (you'll need to configure this)
      const clusterIP = process.env.NEXT_PUBLIC_K8S_CLUSTER_IP || 'localhost';
      return `http://${clusterIP}:${nodePortService.ports[0].nodePort}`;
    }
    
    // Look for LoadBalancer services
    const lbService = services.find(svc => svc.type === 'LoadBalancer' && svc.ports?.length > 0);
    if (lbService) {
      // This would need the external IP from the LoadBalancer
      return `Service: ${lbService.name}`;
    }
    
    // Fallback to ClusterIP info
    const clusterService = services.find(svc => svc.ports?.length > 0);
    if (clusterService) {
      return `Service: ${clusterService.name}:${clusterService.ports[0].port}`;
    }
    
    return undefined;
  }
  
  /**
   * Get user-friendly status for display
   */
  static getDisplayStatus(status: string): { text: string; color: string } {
    const statusMap: Record<string, { text: string; color: string }> = {
      'starting': { text: 'Starting...', color: 'text-yellow-400' },
      'running': { text: 'Running', color: 'text-green-400' },
      'ready': { text: 'Ready', color: 'text-green-400' },
      'stopping': { text: 'Stopping...', color: 'text-red-400' },
      'stopped': { text: 'Stopped', color: 'text-gray-400' },
      'pending': { text: 'Pending...', color: 'text-yellow-400' },
      'restarting': { text: 'Restarting...', color: 'text-amber-400' },
      'error': { text: 'Error', color: 'text-red-500' },
      'not_found': { text: 'Not Found', color: 'text-gray-500' },
      'not_supported': { text: 'Not Supported', color: 'text-gray-500' }
    };
    
    return statusMap[status] || { text: status || 'Unknown', color: 'text-gray-400' };
  }
}

// Helper function for components
export async function manageInstance(options: InstanceManagerOptions): Promise<InstanceResponse> {
  return InstanceManager.manageInstance(options);
}

export type { InstanceResponse, InstanceManagerOptions }; 