# 🚀 JavaScript Kubernetes Client Guide for Challenge Hosting

## 📋 Overview

This guide demonstrates how to use JavaScript Kubernetes client libraries to manage challenge hosting in your HackCubes platform. We'll cover multiple client options, practical examples, and integration patterns.

## 🔧 Available JavaScript Kubernetes Client Libraries

### 1. **@kubernetes/client-node** (Official - Recommended)
```bash
npm install @kubernetes/client-node
```
- **Official client** maintained by Kubernetes team
- **TypeScript support** built-in
- **Comprehensive API coverage**
- **Active development** and regular updates

### 2. **kubernetes-client** (Community Alternative)
```bash
npm install kubernetes-client
```
- **Community-driven** library
- **Fluent API** design
- **Good for simple operations**

## 🎯 Key Features for Challenge Hosting

### ✅ **What You Can Do:**

| Feature | Description | Use Case |
|---------|-------------|----------|
| **Namespace Management** | Create isolated environments per user | User isolation |
| **Pod/Deployment Control** | Deploy challenge containers | Challenge instances |
| **Service Management** | Expose challenge services | External access |
| **Real-time Monitoring** | Watch pod status changes | Live updates |
| **Log Streaming** | Get container logs | Debugging |
| **Resource Metrics** | CPU/Memory usage | Monitoring |
| **Command Execution** | Run commands in containers | Administration |
| **Auto-scaling** | Scale instances up/down | Resource management |

## 🏗️ Architecture Integration

### **Current HackCubes Setup:**
```
Frontend → Instance Manager → AWS Lambda → EC2 Instances
```

### **Enhanced with Kubernetes:**
```
Frontend → Enhanced Instance Manager → Kubernetes API → Pod Instances
                                    ↘ AWS Lambda → EC2 Instances (fallback)
```

## 📝 Practical Examples

### 1. **Basic Client Initialization**

```javascript
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
    logApi: new k8s.Log(kc)
  };
}
```

### 2. **Create Challenge Instance**

```javascript
async function createChallengeInstance(username, challengeName, config) {
  const { coreV1Api, appsV1Api } = initializeKubernetesClient();
  const namespace = `hackcubes-${username}-${challengeName}`.toLowerCase();

  // 1. Create namespace with labels
  const namespaceManifest = {
    metadata: {
      name: namespace,
      labels: {
        'hackcubes.com/type': 'challenge',
        'hackcubes.com/user': username,
        'hackcubes.com/challenge': challengeName
      }
    }
  };
  
  await coreV1Api.createNamespace(namespaceManifest);

  // 2. Create deployment
  const deployment = {
    metadata: { name: 'challenge', namespace },
    spec: {
      replicas: 1,
      selector: { matchLabels: { app: 'challenge' } },
      template: {
        metadata: { labels: { app: 'challenge' } },
        spec: {
          containers: [{
            name: 'challenge',
            image: config.image || 'nginx:latest',
            ports: [{ containerPort: 80 }],
            resources: {
              limits: { cpu: '500m', memory: '512Mi' },
              requests: { cpu: '100m', memory: '128Mi' }
            }
          }]
        }
      }
    }
  };

  await appsV1Api.createNamespacedDeployment(namespace, deployment);

  // 3. Create service for external access
  const service = {
    metadata: { name: 'challenge-service', namespace },
    spec: {
      type: 'NodePort',
      ports: [{ port: 80, targetPort: 80 }],
      selector: { app: 'challenge' }
    }
  };

  const serviceResult = await coreV1Api.createNamespacedService(namespace, service);
  
  return {
    namespace,
    accessUrl: `http://${process.env.K8S_CLUSTER_IP}:${serviceResult.body.spec.ports[0].nodePort}`,
    status: 'created'
  };
}
```

### 3. **Monitor Challenge Status**

```javascript
async function monitorChallengeStatus(namespace) {
  const { coreV1Api, metricsClient } = initializeKubernetesClient();

  // Get pods
  const podsResponse = await coreV1Api.listNamespacedPod(namespace);
  const pods = podsResponse.body.items;

  // Get metrics (if available)
  let metrics = null;
  try {
    const podMetrics = await Promise.all(
      pods.map(async (pod) => {
        if (pod.status?.phase === 'Running') {
          return await metricsClient.getPodMetrics(namespace, pod.metadata.name);
        }
        return null;
      })
    );
    metrics = podMetrics.filter(m => m !== null);
  } catch (e) {
    console.log('Metrics not available');
  }

  // Determine status
  const runningPods = pods.filter(pod => pod.status?.phase === 'Running');
  const status = runningPods.length === pods.length ? 'running' : 'starting';

  return {
    status,
    pods: pods.map(pod => ({
      name: pod.metadata.name,
      phase: pod.status?.phase,
      ready: pod.status?.conditions?.find(c => c.type === 'Ready')?.status === 'True'
    })),
    metrics
  };
}
```

### 4. **Watch Real-time Events**

```javascript
async function watchChallengeEvents(namespace, callback) {
  const { watchApi } = initializeKubernetesClient();

  const watchRequest = await watchApi.watch(
    `/api/v1/namespaces/${namespace}/pods`,
    {},
    (type, apiObj) => {
      const event = {
        type,
        timestamp: new Date().toISOString(),
        pod: apiObj.metadata?.name,
        phase: apiObj.status?.phase
      };
      
      callback(event);
      console.log(`Event: ${event.type} - ${event.pod} (${event.phase})`);
    },
    (error) => {
      console.error('Watch error:', error);
    }
  );

  // Return cleanup function
  return () => watchRequest.abort();
}
```

### 5. **Get Challenge Logs**

```javascript
async function getChallengeLogs(namespace) {
  const { coreV1Api, logApi } = initializeKubernetesClient();

  const podsResponse = await coreV1Api.listNamespacedPod(namespace);
  const pods = podsResponse.body.items;
  const allLogs = [];

  for (const pod of pods) {
    if (pod.status?.phase === 'Running') {
      const logStream = await logApi.log(
        namespace,
        pod.metadata.name,
        '', // container name
        null,
        {
          follow: false,
          tailLines: 100,
          timestamps: true
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
    }
  }

  return allLogs;
}
```

### 6. **Scale Challenge Resources**

```javascript
async function scaleChallengeInstance(namespace, replicas) {
  const { appsV1Api } = initializeKubernetesClient();

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

  return { replicas, status: 'scaled' };
}
```

## 🔌 Integration with HackCubes APIs

### **Enhanced API Endpoint Example:**

```javascript
// src/pages/api/k8s-challenge.ts
import * as k8s from '@kubernetes/client-node';

export default async function handler(req, res) {
  const { action, username, challengeName, config } = req.body;
  
  const client = initializeKubernetesClient();
  
  switch (action) {
    case 'create':
      const result = await createChallengeInstance(username, challengeName, config);
      return res.json(result);
      
    case 'status':
      const status = await monitorChallengeStatus(config.namespace);
      return res.json(status);
      
    case 'logs':
      const logs = await getChallengeLogs(config.namespace);
      return res.json({ logs });
      
    case 'scale':
      await scaleChallengeInstance(config.namespace, config.replicas);
      return res.json({ status: 'scaled' });
      
    case 'cleanup':
      await cleanupChallengeInstance(config.namespace);
      return res.json({ status: 'deleted' });
      
    default:
      return res.status(400).json({ error: 'Invalid action' });
  }
}
```

## 🛡️ Security Best Practices

### 1. **Namespace Isolation**
```javascript
// Always use labeled namespaces for isolation
const namespaceManifest = {
  metadata: {
    name: namespace,
    labels: {
      'hackcubes.com/type': 'challenge',
      'hackcubes.com/user': username,
      'hackcubes.com/auto-cleanup': 'true'
    }
  }
};
```

### 2. **Resource Limits**
```javascript
// Always set resource limits
const container = {
  name: 'challenge',
  image: config.image,
  resources: {
    limits: {
      cpu: '500m',
      memory: '512Mi'
    },
    requests: {
      cpu: '100m',
      memory: '128Mi'
    }
  },
  securityContext: {
    runAsNonRoot: true,
    runAsUser: 1000,
    allowPrivilegeEscalation: false
  }
};
```

### 3. **RBAC Configuration**
```yaml
# Create service account for HackCubes
apiVersion: v1
kind: ServiceAccount
metadata:
  name: hackcubes-controller
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: hackcubes-controller
rules:
- apiGroups: [""]
  resources: ["namespaces", "pods", "services"]
  verbs: ["get", "list", "create", "update", "patch", "delete"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "create", "update", "patch", "delete"]
```

## 📊 Performance & Monitoring

### **Resource Monitoring:**
```javascript
async function getChallengeMetrics(namespace) {
  const { metricsClient } = initializeKubernetesClient();
  
  try {
    const pods = await getPods(namespace);
    let totalCpu = 0;
    let totalMemory = 0;

    for (const pod of pods.filter(p => p.status === 'Running')) {
      const metrics = await metricsClient.getPodMetrics(namespace, pod.name);
      
      for (const container of metrics.containers || []) {
        totalCpu += parseCpuMetric(container.usage?.cpu || '0');
        totalMemory += parseMemoryMetric(container.usage?.memory || '0');
      }
    }

    return {
      cpu: `${totalCpu.toFixed(2)}m`,
      memory: `${(totalMemory / 1024 / 1024).toFixed(2)}Mi`
    };
  } catch (error) {
    return { cpu: '0m', memory: '0Mi' };
  }
}
```

## 🚀 Deployment Patterns

### 1. **GitHub Integration Pattern**
```javascript
async function fetchAndApplyFromGitHub(namespace, challengeName) {
  // Fetch deployment files from GitHub
  const repoUrl = 'https://api.github.com/repos/HackCubes/WebChallenges/contents';
  const response = await fetch(`${repoUrl}/${challengeName}/deployment`);
  const files = await response.json();
  
  // Apply each YAML file
  for (const file of files) {
    if (file.name.endsWith('.yaml')) {
      const content = await fetch(file.download_url).then(r => r.text());
      const manifest = yaml.load(content);
      
      // Remove namespace and apply to our namespace
      delete manifest.metadata?.namespace;
      manifest.metadata.namespace = namespace;
      
      await applyManifest(manifest, namespace);
    }
  }
}
```

### 2. **Auto-cleanup Pattern**
```javascript
async function setupAutoCleanup(namespace, timeoutMinutes = 60) {
  // Set annotation for cleanup
  await coreV1Api.patchNamespace(namespace, {
    metadata: {
      annotations: {
        'hackcubes.com/cleanup-after': new Date(Date.now() + timeoutMinutes * 60000).toISOString()
      }
    }
  });
}

// Cleanup job (run periodically)
async function cleanupExpiredInstances() {
  const { coreV1Api } = initializeKubernetesClient();
  
  const namespacesResponse = await coreV1Api.listNamespace();
  const challengeNamespaces = namespacesResponse.body.items.filter(
    ns => ns.metadata?.labels?.['hackcubes.com/type'] === 'challenge'
  );
  
  for (const ns of challengeNamespaces) {
    const cleanupTime = ns.metadata?.annotations?.['hackcubes.com/cleanup-after'];
    if (cleanupTime && new Date(cleanupTime) < new Date()) {
      await coreV1Api.deleteNamespace(ns.metadata.name);
      console.log(`Cleaned up expired namespace: ${ns.metadata.name}`);
    }
  }
}
```

## 🔧 Configuration & Environment

### **Environment Variables:**
```bash
# Kubernetes Configuration
NEXT_PUBLIC_K8S_CLUSTER_IP=your-cluster-ip
K8S_NAMESPACE_PREFIX=hackcubes
K8S_DEFAULT_CPU_LIMIT=500m
K8S_DEFAULT_MEMORY_LIMIT=512Mi
K8S_INSTANCE_TIMEOUT=60

# Optional: GitHub Integration
GITHUB_TOKEN=your-github-token
K8S_CHALLENGES_REPO=HackCubes/WebChallenges
```

## 🎯 Use Cases for Challenge Hosting

### 1. **Web Security Challenges**
- Deploy vulnerable web applications
- PHP/Node.js/Python applications
- Database backends (MySQL, PostgreSQL)
- Real-time vulnerability scanning

### 2. **Container Security Challenges**
- Docker escape scenarios
- Privilege escalation challenges
- Network segmentation tests
- Container runtime security

### 3. **Network Security Challenges**
- Multi-pod network challenges
- Service mesh security
- Ingress/egress filtering
- Traffic analysis scenarios

### 4. **DevOps Security Challenges**
- CI/CD pipeline security
- Secrets management
- Infrastructure as Code
- Monitoring and alerting

## 📚 Additional Resources

### **Documentation:**
- [Kubernetes JavaScript Client](https://github.com/kubernetes-client/javascript)
- [Kubernetes API Reference](https://kubernetes.io/docs/reference/kubernetes-api/)
- [kubectl Commands](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)

### **Example Files Created:**
- `javascript-k8s-examples.js` - Comprehensive examples
- `src/lib/enhancedInstanceManager.ts` - Enhanced manager with full features
- `src/pages/api/k8s-advanced.ts` - Advanced API endpoint

### **Quick Test:**
```bash
# Test the examples
node javascript-k8s-examples.js

# Test enhanced API (with server running)
curl -X POST http://localhost:3000/api/k8s-advanced \
  -H "Content-Type: application/json" \
  -d '{"action": "create_advanced", "question_id": "test", "candidate_id": "user", "username": "testuser"}'
```

## 🎉 Summary

The JavaScript Kubernetes client libraries provide powerful capabilities for hosting CTF challenges:

✅ **Complete instance lifecycle management**  
✅ **Real-time monitoring and logging**  
✅ **Resource scaling and optimization**  
✅ **Security isolation per user**  
✅ **GitHub integration for deployment files**  
✅ **Hybrid AWS + Kubernetes support**  

This integration gives you enterprise-grade challenge hosting capabilities while maintaining the simplicity of your existing HackCubes architecture! 