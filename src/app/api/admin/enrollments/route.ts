import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Use service role to ensure consistent access across RLS policies
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { searchParams } = new URL(request.url);
    const certificationId = searchParams.get('certificationId') || 'hcjpt';
    
    // Map certification IDs to assessment IDs
    const CERTIFICATION_ASSESSMENT_MAP: Record<string, string> = {
      'hcjpt': '533d4e96-fe35-4540-9798-162b3f261572',
      'hcipt': '', // Future implementation
      'hcept': '', // Future implementation
    };

    const assessmentId = CERTIFICATION_ASSESSMENT_MAP[certificationId];
    if (!assessmentId) {
      return NextResponse.json({ error: 'Invalid certification ID' }, { status: 400 });
    }

    // Fetch enrollments with user data and payment info
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select(`
        id,
        user_id,
        assessment_id,
        status,
        created_at,
        expires_at,
        started_at,
        completed_at,
        current_score,
        max_possible_score,
        progress_percentage,
        profiles!inner(
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('assessment_id', assessmentId)
      .order('created_at', { ascending: false });

    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError);
      return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
    }

    // Fetch assessment invitations (admin-granted access) - this is the primary source of access
    let invitations: any[] = [];
    const { data: invitationData, error: invitationsError } = await supabase
      .from('assessment_invitations')
      .select(`
        id,
        email,
        status,
        created_at,
        accepted_at
      `)
      .eq('assessment_id', assessmentId)
      .eq('status', 'accepted');

    if (invitationsError) {
      console.warn('Warning fetching invitations:', invitationsError.message);
      // Don't fail the entire API if invitations table doesn't exist
      // Just log and continue with empty invitations
      invitations = [];
    } else {
      invitations = invitationData || [];
    }

    // Debug logging
    console.log(`🔍 Debug: assessmentId = ${assessmentId}`);
    console.log(`🔍 Debug: invitations query result = ${invitations.length} invitations`);
    if (invitations.length > 0) {
      console.log(`🔍 Debug: First invitation = ${JSON.stringify(invitations[0])}`);
    }
    if (invitationsError) {
      console.log(`🔍 Debug: Invitations error = ${invitationsError.message}`);
    }

    // Fetch ALL user profiles to get complete user information
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.warn('Warning fetching profiles:', profilesError.message);
    }

    // Fetch certification purchases
    let purchases: any[] = [];
    const { data: purchaseData, error: purchasesError } = await supabase
      .from('certification_purchases')
      .select(`
        id,
        user_email,
        certification_id,
        purchased_at,
        amount,
        currency,
        status
      `)
      .eq('certification_id', certificationId)
      .eq('status', 'completed');

    if (purchasesError) {
      console.warn('Warning fetching purchases:', purchasesError.message);
      // Don't fail the entire API if purchases table doesn't exist
      purchases = [];
    } else {
      purchases = purchaseData || [];
    }

        // Create lookup maps - similar to how the certifications page works
    const enrollmentMap = new Map();
    const purchaseMap = new Map();
    const invitationMap = new Map();
    const profileMap = new Map();

    // Index all data by email
    purchases.forEach(purchase => {
      purchaseMap.set(purchase.user_email.toLowerCase(), purchase);
    });

    invitations.forEach(invitation => {
      invitationMap.set(invitation.email.toLowerCase(), invitation);
    });

    (allProfiles || []).forEach(profile => {
      profileMap.set(profile.email.toLowerCase(), profile);
    });

    const enrollmentsByEmail = new Map();
    (enrollments || []).forEach((enrollment: any) => {
      enrollmentsByEmail.set(enrollment.profiles.email.toLowerCase(), enrollment);
    });

    // Process ALL users who have invitations (this is the primary access source)
    // This matches how the certifications page works
    console.log(`🔍 Debug: Processing ${invitations.length} invitations...`);
    invitations.forEach((invitation, index) => {
      const userEmail = invitation.email.toLowerCase();
      const profile = profileMap.get(userEmail);
      const enrollment = enrollmentsByEmail.get(userEmail);
      const purchase = purchaseMap.get(userEmail);
      
      console.log(`🔍 Debug: Processing invitation ${index + 1}: ${invitation.email}`);
      console.log(`🔍 Debug: Found profile: ${profile ? 'Yes' : 'No'}, enrollment: ${enrollment ? 'Yes' : 'No'}`);
      
      // Determine enrollment source and date
      let enrollmentDate = invitation.accepted_at || invitation.created_at;
      let enrollmentSource = 'admin_grant';
      let status = 'invited';
      let progress = 0;
      let currentScore = 0;
      let maxScore = 0;
      let startedAt = null;
      let completedAt = null;
      
      // If user also has a purchase, determine which is primary
      if (purchase) {
        if (new Date(purchase.purchased_at) > new Date(enrollmentDate)) {
          enrollmentSource = 'payment';
          enrollmentDate = purchase.purchased_at;
        }
      }
      
      // If user has an actual enrollment record, use that data
      if (enrollment) {
        status = enrollment.status;
        progress = enrollment.progress_percentage || 0;
        currentScore = enrollment.current_score || 0;
        maxScore = enrollment.max_possible_score || 0;
        startedAt = enrollment.started_at;
        completedAt = enrollment.completed_at;
      } else {
        // User has invitation but no enrollment yet
        status = profile ? 'invited' : 'pending_signup';
      }

      // Calculate expiry date
      const expiryDate = enrollment?.expires_at || 
        new Date(new Date(enrollmentDate).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();

      enrollmentMap.set(userEmail, {
        id: enrollment?.id || invitation.id,
        userId: profile?.id || null,
        userEmail: invitation.email,
        firstName: profile?.first_name || null,
        lastName: profile?.last_name || null,
        status,
        enrollmentDate,
        expiryDate,
        enrollmentSource,
        progress,
        currentScore,
        maxScore,
        startedAt,
        completedAt,
        paymentAmount: purchase?.amount,
        paymentCurrency: purchase?.currency,
        isExpired: new Date(expiryDate) < new Date(),
      });
      
      console.log(`🔍 Debug: Added to enrollmentMap: ${userEmail} with status ${status}`);
    });

    // Also process users who have purchases but no invitations
    purchases.forEach(purchase => {
      const userEmail = purchase.user_email.toLowerCase();
      if (!enrollmentMap.has(userEmail)) {
        const profile = profileMap.get(userEmail);
        const enrollment = enrollmentsByEmail.get(userEmail);
        
        let status = 'purchased';
        let progress = 0;
        let currentScore = 0;
        let maxScore = 0;
        let startedAt = null;
        let completedAt = null;
        
        if (enrollment) {
          status = enrollment.status;
          progress = enrollment.progress_percentage || 0;
          currentScore = enrollment.current_score || 0;
          maxScore = enrollment.max_possible_score || 0;
          startedAt = enrollment.started_at;
          completedAt = enrollment.completed_at;
        }

        const expiryDate = enrollment?.expires_at || 
          new Date(new Date(purchase.purchased_at).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();

        enrollmentMap.set(userEmail, {
          id: enrollment?.id || purchase.id,
          userId: profile?.id || null,
          userEmail: purchase.user_email,
          firstName: profile?.first_name || null,
          lastName: profile?.last_name || null,
          status,
          enrollmentDate: purchase.purchased_at,
          expiryDate,
          enrollmentSource: 'payment',
          progress,
          currentScore,
          maxScore,
          startedAt,
          completedAt,
          paymentAmount: purchase.amount,
          paymentCurrency: purchase.currency,
          isExpired: new Date(expiryDate) < new Date(),
        });
      }
    });

    // Also process users who have enrollments but no invitations or purchases (edge case)
    (enrollments || []).forEach((enrollment: any) => {
      const userEmail = enrollment.profiles.email.toLowerCase();
      if (!enrollmentMap.has(userEmail)) {
        const purchase = purchaseMap.get(userEmail);
        
        const expiryDate = enrollment.expires_at || 
          new Date(new Date(enrollment.created_at).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();

        enrollmentMap.set(userEmail, {
          id: enrollment.id,
          userId: enrollment.user_id,
          userEmail: enrollment.profiles.email,
          firstName: enrollment.profiles.first_name,
          lastName: enrollment.profiles.last_name,
          status: enrollment.status,
          enrollmentDate: enrollment.created_at,
          expiryDate,
          enrollmentSource: purchase ? 'payment' : 'manual',
          progress: enrollment.progress_percentage || 0,
          currentScore: enrollment.current_score || 0,
          maxScore: enrollment.max_possible_score || 0,
          startedAt: enrollment.started_at,
          completedAt: enrollment.completed_at,
          paymentAmount: purchase?.amount,
          paymentCurrency: purchase?.currency,
          isExpired: new Date(expiryDate) < new Date(),
        });
      }
    });

    const enrollmentData = Array.from(enrollmentMap.values()).sort((a, b) => 
      new Date(b.enrollmentDate).getTime() - new Date(a.enrollmentDate).getTime()
    );

    return NextResponse.json({
      success: true,
      enrollments: enrollmentData,
      stats: {
        total: enrollmentData.length,
        active: enrollmentData.filter(e => !e.isExpired && e.status !== 'completed').length,
        completed: enrollmentData.filter(e => e.status === 'completed').length,
        expired: enrollmentData.filter(e => e.isExpired).length,
        paymentBased: enrollmentData.filter(e => e.enrollmentSource === 'payment').length,
        adminGranted: enrollmentData.filter(e => e.enrollmentSource === 'admin_grant').length,
      }
    });

  } catch (error) {
    console.error('Error in enrollments API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Use service role for admin actions
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const body = await request.json();
    const { action, userEmail, certificationId = 'hcjpt' } = body;

    const CERTIFICATION_ASSESSMENT_MAP: Record<string, string> = {
      'hcjpt': '533d4e96-fe35-4540-9798-162b3f261572',
    };

    const assessmentId = CERTIFICATION_ASSESSMENT_MAP[certificationId];
    if (!assessmentId) {
      return NextResponse.json({ error: 'Invalid certification ID' }, { status: 400 });
    }

    if (action === 'extend_expiry') {
      const { extensionMonths = 12 } = body;
      
      // First, get user ID from email
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', userEmail.toLowerCase())
        .single();

      if (!profile) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Check if user has an enrollment
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id, expires_at, status')
        .eq('assessment_id', assessmentId)
        .eq('user_id', profile.id)
        .single();

      if (enrollment) {
        // Extend existing enrollment
        const currentExpiry = new Date(enrollment.expires_at || Date.now());
        const extendFromDate = currentExpiry > new Date() ? currentExpiry : new Date();
        const newExpiry = new Date(extendFromDate.getTime() + extensionMonths * 30 * 24 * 60 * 60 * 1000);
        
        const { error } = await supabase
          .from('enrollments')
          .update({ 
            expires_at: newExpiry.toISOString(),
            status: 'ENROLLED', // Reset status if it was expired
            updated_at: new Date().toISOString()
          })
          .eq('id', enrollment.id);

        if (error) throw error;
      } else {
        // Check for invitation and create enrollment with expiry
        const { data: invitation } = await supabase
          .from('assessment_invitations')
          .select('id, created_at, accepted_at')
          .eq('assessment_id', assessmentId)
          .eq('email', userEmail)
          .eq('status', 'accepted')
          .single();

        if (invitation) {
          // Create new enrollment for invitation-only user
          const expiryDate = new Date(Date.now() + extensionMonths * 30 * 24 * 60 * 60 * 1000);
          
          const { error: enrollmentError } = await supabase
            .from('enrollments')
            .insert({
              user_id: profile.id,
              assessment_id: assessmentId,
              status: 'ENROLLED',
              expires_at: expiryDate.toISOString(),
              created_at: invitation.accepted_at || invitation.created_at,
              updated_at: new Date().toISOString(),
            });

          if (enrollmentError) {
            console.error('Error creating enrollment:', enrollmentError);
            throw enrollmentError;
          }
        } else {
          return NextResponse.json({ error: 'No invitation found for user' }, { status: 404 });
        }
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in enrollments POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 