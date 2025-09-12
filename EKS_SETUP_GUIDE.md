# EKS Kubernetes Setup Guide for HackCubes

This guide will help you configure your HackCubes platform to use your EKS cluster instead of EC2 instances for hosting challenges.

## 🎯 Overview

Your codebase has been updated to:
- ✅ Route all challenges with infrastructure requirements to Kubernetes
- ✅ Map existing EC2 template_id/instance_id to appropriate Docker images  
- ✅ Use the advanced Kubernetes manager for challenge lifecycle management
- ✅ Maintain backward compatibility with legacy AWS systems

## 📋 Prerequisites

1. **AWS CLI configured** with access to your EKS cluster
2. **kubectl installed** and configured
3. **Your EKS cluster** running and accessible
4. **Docker images** available for your challenges (or use the mapped defaults)

## 🔧 Configuration Steps

### Step 1: Configure Environment Variables

Update your `.env.local` file with your EKS cluster details:

```env
# EKS Cluster Configuration
EKS_CLUSTER_NAME=your-cluster-name-here
EKS_CLUSTER_ENDPOINT=https://your-cluster-endpoint.us-east-1.eks.amazonaws.com
EKS_CLUSTER_REGION=us-east-1

# AWS Configuration (for EKS authentication)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key

# Kubernetes Configuration
KUBERNETES_DEFAULT_NAMESPACE=hackcubes-challenges
```

### Step 2: Get Your EKS Cluster Details

```bash
# List your EKS clusters
aws eks list-clusters --region us-east-1

# Get cluster endpoint
aws eks describe-cluster --name your-cluster-name --region us-east-1 --query 'cluster.endpoint'

# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name your-cluster-name
```

### Step 3: Verify Kubernetes Access

```bash
# Test cluster connection
kubectl cluster-info

# Check if you can create namespaces
kubectl auth can-i create namespaces

# List current namespaces
kubectl get namespaces
```

### Step 4: Test Challenge Instance Creation

```bash
# Run the test script
node test-k8s-setup.js

# Or test manually with the JavaScript examples
node javascript-k8s-examples.js
```

## 🗺️ Challenge Migration Mapping

Your existing challenges have been automatically mapped as follows:

### Template ID Mappings
- `lt-0cb8327cecfab4c8f` (Techfront Solutions) → `vulhub/nginx:latest`
- `lt-062965b335504fcc5` (ShadowAccess) → `vulhub/apache2:latest`  
- `lt-08e367739ac29f518` (Cloudsafe Solutions) → `vulhub/wordpress:latest`

### Instance ID Mappings
- `i-001f2e1f5117b3c3d` (Achieve Rewards) → `vulhub/dvwa:latest`
- `i-0efe1611f7ce45970` (TechCon Conference) → `vulhub/webgoat:latest`

### Default Mappings (by challenge name)
- Web challenges → `vulhub/nginx:latest`
- WordPress/CMS → `vulhub/wordpress:latest` 
- Apache challenges → `vulhub/apache2:latest`
- Database challenges → `vulhub/mysql:latest`

## 🔑 Authentication Setup

### Option 1: AWS CLI Token (Recommended for Development)
The system automatically uses `aws eks get-token` for authentication.

### Option 2: Service Account (Production)
For production deployment, create a service account:

```bash
# Create service account
kubectl create serviceaccount hackcubes-sa

# Create cluster role binding
kubectl create clusterrolebinding hackcubes-binding \
  --clusterrole=cluster-admin \
  --serviceaccount=default:hackcubes-sa

# Get the token
kubectl get secret $(kubectl get serviceaccount hackcubes-sa -o jsonpath='{.secrets[0].name}') -o jsonpath='{.data.token}' | base64 --decode
```

## 🏗️ Namespace Strategy

The system creates isolated namespaces for each challenge instance:
- Format: `hackcubes-{username}-{questionId}`
- Automatically cleaned up after challenges end
- Labeled for easy identification and management

## 🔍 Monitoring and Troubleshooting

### Check Challenge Instances
```bash
# List all HackCubes namespaces
kubectl get namespaces -l hackcubes.com/type=challenge

# Check pods in a specific namespace
kubectl get pods -n hackcubes-username-questionid

# Get logs from a challenge pod
kubectl logs -n hackcubes-username-questionid deployment/challenge
```

### Debug Challenge Creation
```bash
# Check if images are accessible
kubectl run test-pod --image=vulhub/nginx:latest --dry-run=client -o yaml

# Test service creation
kubectl get services -n hackcubes-username-questionid

# Check LoadBalancer status
kubectl get svc challenge-service -n hackcubes-username-questionid
```

## 📊 Performance Optimization

### Resource Limits
Default resource allocation per challenge:
- CPU Request: 100m
- Memory Request: 128Mi  
- CPU Limit: 500m
- Memory Limit: 512Mi

### Scaling Configuration
- Replicas: 1 per challenge instance
- Auto-cleanup after 1 hour (configurable)
- LoadBalancer for external access

## 🚀 Testing Your Setup

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to a challenge with infrastructure requirements**

3. **Click "Start Instance" and verify:**
   - Kubernetes namespace is created
   - Pod starts successfully  
   - LoadBalancer gets external IP
   - Challenge is accessible

4. **Monitor the process:**
   ```bash
   kubectl get pods -A -l hackcubes.com/type=challenge -w
   ```

## 🔧 Customizing Docker Images

To use custom images for specific challenges:

1. **Update the database:**
   ```sql
   UPDATE questions 
   SET docker_image = 'your-custom-image:tag'
   WHERE name = 'Your Challenge Name';
   ```

2. **Or modify the mapping in `instanceManager.ts`:**
   ```typescript
   const templateMappings: Record<string, string> = {
     'lt-your-template-id': 'your-custom-image:tag',
   };
   ```

## ⚠️ Important Notes

1. **LoadBalancer**: Your EKS cluster needs LoadBalancer support (ALB/NLB)
2. **Images**: Ensure Docker images are publicly accessible or configure image pull secrets
3. **Networking**: Verify security groups allow traffic to your challenge ports
4. **Costs**: Monitor LoadBalancer and compute costs in your AWS account
5. **Cleanup**: Namespaces auto-delete, but verify no resources are left behind

## 🆘 Troubleshooting Common Issues

### Issue: "Unable to connect to cluster"
**Solution:** Update kubeconfig and verify AWS credentials:
```bash
aws eks update-kubeconfig --region us-east-1 --name your-cluster-name
kubectl cluster-info
```

### Issue: "Pods stuck in Pending state"
**Solution:** Check node capacity and resource requests:
```bash
kubectl describe pod -n hackcubes-namespace pod-name
kubectl get nodes
kubectl top nodes
```

### Issue: "LoadBalancer pending external IP"
**Solution:** Verify AWS Load Balancer Controller is installed:
```bash
kubectl get pods -n kube-system | grep aws-load-balancer-controller
```

### Issue: "Image pull errors"
**Solution:** Verify image accessibility and add image pull secrets if needed:
```bash
kubectl create secret docker-registry regcred \
  --docker-server=your-registry \
  --docker-username=your-username \
  --docker-password=your-password
```

## 📞 Support

- Check logs: `kubectl logs -n kube-system deployment/aws-load-balancer-controller`
- Monitor events: `kubectl get events --sort-by=.metadata.creationTimestamp`
- View cluster status: `kubectl get componentstatuses`

Your HackCubes platform is now configured to use Kubernetes instead of EC2! 🎉 