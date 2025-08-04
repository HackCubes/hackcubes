import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// Helper function to encode string in Base64
function encodeBase64(str: string): string {
  return Buffer.from(str).toString('base64');
}

// Helper function to encode string in ROT13
function encodeROT13(str: string): string {
  return str.replace(/[a-zA-Z]/g, function(c) {
    const code = c.charCodeAt(0);
    const shifted = code + 13;
    const limit = c <= 'Z' ? 90 : 122;
    return String.fromCharCode(shifted <= limit ? shifted : shifted - 26);
  });
}

// Generate a random invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Track challenge attempts
async function trackAttempt(
  supabase: any,
  req: NextRequest,
  step: string,
  success: boolean
) {
  const ip = req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  await supabase
    .from('challenge_attempts')
    .insert([{
      ip_address: ip,
      user_agent: userAgent,
      challenge_step: step,
      success: success
    }]);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const body = await request.json().catch(() => ({}));
    const { action } = body;

    if (action === 'getClue') {
      // Step 1: Return encoded clue about the API endpoint
      const clue = "To proceed, make a POST request to /api/challenge/generate with action: 'generateCode'";
      const encodedClue = Math.random() > 0.5 
        ? encodeBase64(clue)
        : encodeROT13(clue);
      
      const encoding = encodedClue === encodeBase64(clue) ? 'base64' : 'rot13';
      
      await trackAttempt(supabase, request, 'generate_clue', true);
      
      return NextResponse.json({
        success: true,
        data: encodedClue,
        encoding: encoding,
        hint: `This data is encoded in ${encoding.toUpperCase()}. Decode it to get your next step.`
      });
    }

    if (action === 'generateCode') {
      // Step 2: Generate and return an encoded invite code
      const inviteCode = generateInviteCode();
      
      // Store the code in the database
      const { error } = await supabase
        .from('invite_codes')
        .insert([{ code: inviteCode }]);

      if (error) {
        console.error('Error storing invite code:', error);
        await trackAttempt(supabase, request, 'generate_code', false);
        return NextResponse.json(
          { error: 'Failed to generate invite code' },
          { status: 500 }
        );
      }

      // Encode the invite code in Base64
      const encodedCode = encodeBase64(inviteCode);
      
      await trackAttempt(supabase, request, 'generate_code', true);
      
      return NextResponse.json({
        success: true,
        data: encodedCode,
        hint: "This is your invite code encoded in Base64. Decode it and use it to access the signup form."
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "getClue" or "generateCode"' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Challenge API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST with appropriate action.' },
    { status: 405 }
  );
}
