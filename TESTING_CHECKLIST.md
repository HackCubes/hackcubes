# HackCubes Assessment System - Test Checklist

## ✅ Completed Fixes

### Router Initialization Issues
- [x] Fixed `router.query.id` undefined error in assessment pages
- [x] Added `router.isReady` checks in all assessment routes
- [x] Updated useEffect dependencies to wait for router
- [x] TypeScript compilation passes without errors

### Database Schema Alignment  
- [x] Question interface updated to match database fields
- [x] Field mappings corrected (name vs question_text, score vs points, etc.)
- [x] Challenge import script handles schema differences
- [x] 10 questions and 14 flags successfully imported

### Instance Management Integration
- [x] Template ID detection for AWS instances
- [x] Network instance API proxy routes
- [x] Instance controls (start/stop/restart/status)
- [x] Machine info polling and caching

## 🧪 Testing Checklist

### 1. Database Verification
- [ ] Confirm assessments exist in database
- [ ] Verify imported challenges have proper template_id values
- [ ] Check sections and questions relationships
- [ ] Validate flag relationships

### 2. Assessment Access Flow
- [ ] **Navigate to challenges page**: `http://localhost:3000/challenges`
- [ ] **Click on a Network Security challenge** (should have instance support)
- [ ] **Verify redirect to**: `/assessments/[id]` (welcome page)
- [ ] **Check assessment details load** without "undefined" errors
- [ ] **Click "Start Assessment"** button
- [ ] **Verify redirect to**: `/assessments/[id]/questions`

### 3. Questions Page Testing
- [ ] **Questions load properly** with correct data
- [ ] **Instance controls appear** for challenges with template_id
- [ ] **Start instance** button works (calls AWS Lambda)
- [ ] **Instance status polling** works
- [ ] **IP address display** when instance is running
- [ ] **Answer submission** works
- [ ] **Progress tracking** updates correctly

### 4. Instance Management Testing
- [ ] **Start Network Instance**: Should call AWS Lambda and return status
- [ ] **Get Instance Status**: Should retrieve current state and IP
- [ ] **Stop Instance**: Should terminate the running instance
- [ ] **Restart Instance**: Should stop and start fresh instance
- [ ] **Multiple Users**: Only one instance per user enforced

### 5. Assessment Completion
- [ ] **Submit assessment** after answering questions
- [ ] **Redirect to results** page: `/assessments/[id]/results`
- [ ] **Results display correctly** with scores and analytics
- [ ] **Performance metrics** calculate properly

### 6. Error Handling
- [ ] **Invalid assessment ID**: Graceful redirect to challenges
- [ ] **No enrollment**: Proper redirect to welcome page
- [ ] **Expired assessment**: Appropriate error message
- [ ] **Network failures**: Proper error states shown

### 7. Direct URL Access
- [ ] **Refresh assessment welcome page**: Should reload correctly
- [ ] **Refresh questions page**: Should resume from correct question
- [ ] **Refresh results page**: Should show completed assessment
- [ ] **Browser back/forward**: Should work without errors

### 8. AWS Integration Testing
- [ ] **Environment variables set**: AWS_LAMBDA_URL, AWS_LAMBDA_TOKEN, etc.
- [ ] **Network instance Lambda**: Returns proper responses
- [ ] **Template ID mapping**: Network Security challenges use correct templates
- [ ] **Instance timeouts**: Proper handling of long-running operations
- [ ] **Error responses**: AWS errors handled gracefully

## 🐛 Common Issues to Watch For

### Router Issues
- ❌ `assessmentId` is undefined when component first mounts
- ❌ API calls with `id=undefined` causing UUID parse errors
- ❌ Infinite loading states due to router not ready

### Database Issues  
- ❌ Missing relationships between assessments/sections/questions
- ❌ Field name mismatches (question_text vs name, etc.)
- ❌ Type mismatches in SQL queries

### Instance Management Issues
- ❌ Multiple instances running for same user
- ❌ AWS Lambda timeouts not handled
- ❌ Instance IP not retrieved properly
- ❌ State not cached/updated correctly

## 🔧 Quick Debug Commands

### Check Assessment Data
```javascript
// In browser console on assessment page
console.log('Assessment ID:', window.location.pathname.split('/')[2]);
console.log('Router Query:', router.query);
console.log('Router Ready:', router.isReady);
```

### Check Network Requests
```bash
# Monitor network calls for undefined IDs
curl "https://[supabase-url]/rest/v1/assessments?select=*&id=eq.undefined"
# Should return error, shouldn't happen after fix
```

### Check Instance State
```javascript
// Test instance API directly
fetch('/api/network-instance?action=get_status&question_id=QUESTION_ID&candidate_id=USER_ID')
  .then(r => r.json())
  .then(console.log);
```

## 📋 Test Results Template

```
Date: ___________
Tester: ___________

✅ Database Access: PASS/FAIL - Comments: ___________
✅ Assessment Loading: PASS/FAIL - Comments: ___________  
✅ Questions Page: PASS/FAIL - Comments: ___________
✅ Instance Controls: PASS/FAIL - Comments: ___________
✅ Assessment Completion: PASS/FAIL - Comments: ___________
✅ Results Display: PASS/FAIL - Comments: ___________

Overall Status: PASS/FAIL
Issues Found: ___________
Additional Notes: ___________
```

## 🚀 Success Criteria

The fix is successful when:
1. No "undefined UUID" errors appear in console or logs
2. Candidates can complete full assessment flow without errors
3. Instance management works for Network Security challenges
4. All imported challenges are accessible and functional
5. Assessment results display correctly with proper scoring
