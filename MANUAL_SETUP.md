## 🚀 Manual Supabase Setup Instructions

Since you have your Supabase credentials ready, here's the simplest way to complete the setup:

### **Step 1: Set Up Database Tables**

1. **Open your Supabase Dashboard**: 
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your "hackcubes" project

2. **Navigate to SQL Editor**:
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Execute the Database Setup**:
   - Copy the **entire content** of `database_setup.sql` file
   - Paste it into the SQL Editor
   - Click "Run" to execute all the commands

### **Step 2: Test Your Connection**

After setting up the database, run this command to verify everything works:

```bash
npm run test:supabase
```

This will check:
- ✅ Environment variables are loaded
- ✅ Database connection works
- ✅ All required tables exist
- ✅ API endpoints are accessible

### **Step 3: Test the Challenge**

Once the connection test passes:

1. **Visit the challenge page**: http://localhost:3000/challenge
2. **Open browser console** (F12)
3. **Start the challenge**: Type `hackCubesChallenge.start()`
4. **Follow the challenge steps** to generate an invite code

### **Alternative: Manual SQL Commands**

If you prefer to run the SQL commands one by one, here are the key tables to create:

1. **Waitlist table** (for user signups)
2. **Invite_codes table** (for challenge codes)  
3. **Challenge_attempts table** (for tracking attempts)

All the SQL is in the `database_setup.sql` file - just copy and paste it all at once.

---

**Need help?** The database setup is the only manual step needed. Once that's done, everything else will work automatically!
