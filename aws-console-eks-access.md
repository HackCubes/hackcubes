# 🔧 Add User to EKS Cluster via AWS Console

## 🎯 **Method 1: Using EKS Access Entries (Recommended - Modern)**

### **Step 1: Open AWS Console**
1. Go to [AWS Management Console](https://console.aws.amazon.com/)
2. Navigate to **EKS** service
3. Select your region: **us-east-1**
4. Click on your cluster: **web-cluster**

### **Step 2: Add Access Entry**
1. Click on the **"Access"** tab
2. Scroll down to **"Access entries"** section
3. Click **"Create access entry"**

### **Step 3: Configure Access Entry**
Fill in the details:
- **Principal ARN**: `arn:aws:iam::082010050918:user/Devansh`
- **Username**: `devansh` (optional)
- **Type**: `Standard`

### **Step 4: Assign Permissions**
1. Click **"Add access policy"**
2. Select: **`AmazonEKSClusterAdminPolicy`**
3. Choose **Access scope**: `Cluster`
4. Click **"Next"**

### **Step 5: Review and Create**
1. Review the settings
2. Click **"Create"**

---

## 🎯 **Method 2: Using Authentication Mode (Alternative)**

### **Step 1: Check Authentication Mode**
1. In your EKS cluster dashboard
2. Go to **"Overview"** tab
3. Look for **"Authentication mode"**
4. If it shows `ConfigMap`, you might need to switch to `API` or `API and ConfigMap`

### **Step 2: Change Authentication Mode (if needed)**
1. Click **"Manage authentication mode"**
2. Select **"API and ConfigMap"** 
3. This allows both methods to work
4. Click **"Save changes"**

### **Step 3: Add Access via API Mode**
1. Follow Method 1 steps above
2. The API mode will let you add users directly

---

## 🎯 **Method 3: IAM Roles for Service Accounts (Alternative)**

### **Step 1: Create IAM Role**
1. Go to **IAM** → **Roles**
2. Click **"Create role"**
3. Select **"AWS service"** → **"EKS"**
4. Choose **"EKS - Cluster"**

### **Step 2: Attach Policies**
Attach these policies:
- `AmazonEKSClusterPolicy`
- `AmazonEKSWorkerNodePolicy`
- `AmazonEKSVPCResourceController`

### **Step 3: Add Role to Cluster**
1. Go back to EKS cluster
2. Follow Method 1 but use the **Role ARN** instead of User ARN

---

## 🔍 **Verification Steps:**

### **Check if It Worked:**
1. Wait 2-3 minutes for propagation
2. Try your challenge instance again
3. Check the server logs for success

### **Expected Log Output:**
```
🚀 Creating K8s challenge instance in namespace: hackcubes-...
🐳 Using Docker image: vulhub/nginx:latest
✅ Created namespace: hackcubes-...
✅ Created deployment in namespace: hackcubes-...
✅ Created service in namespace: hackcubes-...
⏳ Waiting for pod to be ready...
🌐 LoadBalancer IP: 192.168.1.100
```

---

## ⚠️ **Troubleshooting:**

### **If Method 1 Doesn't Work:**
- Try Method 2 (change authentication mode first)
- Ensure you have admin permissions in AWS
- Check the cluster was created in the same account

### **If You Don't See "Access" Tab:**
- Your AWS user might not have EKS admin permissions
- Ask your AWS administrator to add you
- Try using the AWS CLI method instead

### **If Access Entry Creation Fails:**
- Check you have the correct ARN format
- Ensure the user exists in the same AWS account
- Try using a role instead of a user

---

## 🚀 **Quick Test:**

After adding yourself, test immediately:

1. Go to your challenge page: `http://localhost:3000/assessments/533d4e96-fe35-4540-9798-162b3f261572/questions`
2. Click **"Start Instance"** on Techfront Solutions
3. Watch your server logs for success messages
4. You should see a LoadBalancer IP instead of 401 errors!

---

## 📞 **Need Help?**

**If you can't find the "Access" tab or get permission errors:**
- You might need your AWS admin to do this
- Share this guide with them
- The key info they need: Add `arn:aws:iam::082010050918:user/Devansh` with `AmazonEKSClusterAdminPolicy`

**Once this is done, your Kubernetes migration will be 100% complete!** 🎉 