# Production Deployment Guide - Web Security Challenges Fix

## 🎯 Problem Solved

**Fixed Issue**: Production deployment was getting Kubernetes service account authentication error:
```
"ENOENT: no such file or directory, open '/var/run/secrets/kubernetes.io/serviceaccount/ca.crt'"
```

**Root Cause**: The application was trying to use in-cluster Kubernetes authentication (`loadFromCluster()`) in production instead of using the AWS EKS authentication that works locally.

**Solution**: Modified the Kubernetes authentication logic to always prefer AWS EKS authentication when available, regardless of environment.

## 🔧 Files Modified

1. **`src/lib/kubernetesConfig.ts`** - Main EKS Kubernetes Manager
2. **`src/pages/api/k8s-advanced.ts`** - Advanced Kubernetes API endpoint
3. **`src/lib/advancedKubernetesManager.ts`** - Advanced Kubernetes Manager

## 📋 Required Environment Variables

Your production environment **MUST** have these environment variables set:

### Required for EKS Authentication
```env
EKS_CLUSTER_NAME=your-cluster-name-here
EKS_CLUSTER_ENDPOINT=https://your-cluster-endpoint.us-east-1.eks.amazonaws.com
AWS_REGION=us-east-1
```

### Required for Database
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-key
```

### Optional AWS Credentials (if not using IAM roles)
```env
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
```

### Optional EKS Settings
```env
EKS_CLUSTER_REGION=us-east-1  # Defaults to AWS_REGION
EKS_CA_DATA=base64-encoded-ca-certificate  # For production SSL verification
EKS_SKIP_TLS_VERIFY=true  # Set to 'true' to skip SSL verification in production if needed
```

## 🚀 Deployment Steps

### Step 1: Test Locally First
```bash
# Run the test script to verify configuration
node test-production-build.js
```

### Step 2: Create Production Build
```bash
# Install dependencies
npm install

# Create production build
npm run build

# Test production build locally (optional)
npm start
```

### Step 3: Deploy to Production
Deploy the `dist/` or `.next/` folder to your production environment and ensure all environment variables are properly set.

### Step 4: Verify Production Environment
1. Ensure your production environment has access to:
   - Your EKS cluster
   - AWS CLI or appropriate IAM roles
   - Supabase database

2. Test the API endpoint that was failing:
```
GET /api/network-instance?action=start&question_id=44a88986-8fd0-49c2-8a43-254925638742&candidate_id=4f8842eb-1b7d-4521-8bf5-24a52656fc73&template_id=lt-08e367739ac29f518
```

## 🎯 How It Works Now

### Challenge Routing
- **Web Security Challenges** → Kubernetes (EKS)
- **Network Security Challenges** → AWS Lambda

### Authentication Flow
1. **First Priority**: EKS configuration (if `EKS_CLUSTER_NAME` and `EKS_CLUSTER_ENDPOINT` are set)
   - Uses AWS CLI authentication: `aws eks get-token`
   - Works in both development and production
   - No service account files required

2. **Fallback**: In-cluster authentication (only if EKS config not available)
   - Only in production environment
   - Requires service account files (not recommended for your setup)

3. **Development**: Default kubeconfig
   - Uses local `~/.kube/config` file

## 🧪 Testing Commands

```bash
# Test environment configuration
node test-production-build.js

# Test EKS connection (if server is running)
node test-eks-connection.js

# Test specific challenge types
node test-instance-api.js
```

## 🔍 Troubleshooting

### If you still get the ca.crt error:
1. Check that `EKS_CLUSTER_NAME` and `EKS_CLUSTER_ENDPOINT` are set in production
2. Verify that your production environment has AWS CLI access
3. Check that your EKS cluster is accessible from the production environment

### If you get SSL certificate verification errors:
```
Error: unable to verify the first certificate
code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
```

**Quick Fix**: Add this environment variable to your production environment:
```env
EKS_SKIP_TLS_VERIFY=true
```

**Secure Fix** (recommended for high-security environments):
1. Get your EKS cluster CA certificate:
   ```bash
   aws eks describe-cluster --name YOUR_CLUSTER_NAME --region YOUR_REGION --query 'cluster.certificateAuthority.data' --output text
   ```
2. Set the `EKS_CA_DATA` environment variable with the base64-encoded certificate
3. Remove or set `EKS_SKIP_TLS_VERIFY=false`

### If web challenges don't work:
1. Verify your EKS cluster is running and accessible
2. Check that your production environment has the necessary IAM permissions
3. Test the cluster connection: `kubectl cluster-info`

### If network challenges don't work:
1. Check `NETWORK_LAMBDA_URL` and `AWS_LAMBDA_TOKEN` environment variables
2. Verify your AWS Lambda function is deployed and accessible

## ✅ Success Indicators

You'll know it's working when:
1. ✅ No more `ca.crt` errors in the logs
2. ✅ Web security challenges start successfully
3. ✅ Network security challenges continue to work via AWS Lambda
4. ✅ Test script shows all tests passing

## 🎉 Expected Behavior

- **Before**: Production API calls failed with Kubernetes service account error
- **After**: Production API calls use AWS EKS authentication and work correctly
- **Local Development**: Continues to work as before (no changes needed)

## 📞 Support

If you encounter any issues:
1. Run `node test-production-build.js` and share the output
2. Check your environment variables are correctly set
3. Verify your EKS cluster access from the production environment 