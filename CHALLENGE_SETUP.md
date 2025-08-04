# HackCubes Invite Challenge Setup

## Overview

This implementation creates a challenge system similar to Hack the Box's invite challenge, where users must:

1. **Find hidden JavaScript functions** in the browser console
2. **Execute functions** to get encoded clues  
3. **Decode messages** (Base64/ROT13) to find API endpoints
4. **Make API requests** to generate invite codes
5. **Decode the final invite code** to access the signup form

## Database Migration Required

Before testing, you need to apply the new database migration:

### Option 1: Using Supabase CLI (Recommended)
```bash
# If linked to remote project
supabase db push

# Or if using local development
supabase start
supabase db reset
```

### Option 2: Manual SQL Execution
Execute the SQL in `supabase/migrations/004_create_invite_challenge.sql` directly in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `004_create_invite_challenge.sql`
4. Execute the query

## How the Challenge Works

### Challenge Flow:

1. **Visit the Challenge Page**: `/challenge`
2. **Open Browser Console** (F12 → Console tab)
3. **Start the Challenge**: Type `hackCubesChallenge.start()` or explore to find `makeInviteCode()`
4. **Execute Hidden Functions**:
   - `makeInviteCode()` - Main entry point
   - `hackCubesChallenge.getHint()` - Gets encoded clue
5. **Decode the Clue**: Use online tools to decode Base64/ROT13
6. **Make API Request**: POST to `/api/challenge/generate` with `{"action": "generateCode"}`
7. **Decode Final Code**: Decode the Base64 invite code
8. **Enter Code**: Use the decoded code in the challenge form

### Example Challenge Solution:

```javascript
// Step 1: Start the challenge
makeInviteCode()

// Step 2: Get the encoded hint
hackCubesChallenge.getHint()

// Step 3: Decode the returned Base64/ROT13 message
// Result: "To proceed, make a POST request to /api/challenge/generate with action: 'generateCode'"

// Step 4: Make the API request
fetch('/api/challenge/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'generateCode' })
}).then(r => r.json()).then(console.log)

// Step 5: Decode the returned Base64 invite code
// Step 6: Enter the decoded code in the form
```

## API Endpoints

### `/api/challenge/generate`
- **POST** - Generate challenge clues and invite codes
- Actions: `getClue`, `generateCode`

### `/api/challenge/validate` 
- **POST** - Validate invite codes
- Body: `{"code": "INVITE_CODE"}`

### `/api/waitlist`
- **POST** - Join waitlist (now requires invite code)
- Body: `{...userdata, "inviteCode": "DECODED_CODE"}`

## Testing

1. **Start the server**: `npm run dev`
2. **Visit**: `http://localhost:3000/challenge`
3. **Open console** and follow the challenge steps
4. **Complete the challenge** to access the signup form

## Features

- **Rate Limiting**: Challenge attempts are tracked by IP
- **Code Validation**: Invite codes are single-use only
- **Multiple Encodings**: Random Base64 or ROT13 for variety
- **Console Hints**: Progressive hints guide users through the challenge
- **Hidden Functions**: JavaScript functions are injected dynamically

## Security Considerations

- Invite codes are single-use and expire when used
- API endpoints have basic validation and error handling
- Challenge attempts are logged for monitoring
- No sensitive information is exposed in client-side code

## Customization

You can modify the challenge by:
- Changing encoding methods in `/api/challenge/generate/route.ts`
- Adding new hidden functions in `InviteChallenge.tsx`
- Modifying the clue messages and difficulty
- Adding time-based expiration for codes
- Implementing more complex multi-step challenges
