import { createClient } from '@/lib/supabase/client';

/**
 * Automatically creates enrollments for a user if they have pending invitations
 * This should be called when a user signs up or creates their profile
 */
export async function createEnrollmentsForPendingInvitations(
  userEmail: string, 
  userId: string
): Promise<{ created: number; errors: string[] }> {
  const supabase = createClient();
  const created: string[] = [];
  const errors: string[] = [];

  try {
    // Get all accepted invitations for this user
    const { data: invitations, error: invitationsError } = await supabase
      .from('assessment_invitations')
      .select('id, assessment_id, accepted_at, created_at')
      .eq('email', userEmail.toLowerCase())
      .eq('status', 'accepted');

    if (invitationsError) {
      errors.push(`Failed to fetch invitations: ${invitationsError.message}`);
      return { created: 0, errors };
    }

    if (!invitations || invitations.length === 0) {
      return { created: 0, errors: [] };
    }

    // For each invitation, check if enrollment already exists
    for (const invitation of invitations) {
      try {
        // Check if enrollment already exists
        const { data: existingEnrollment } = await supabase
          .from('enrollments')
          .select('id')
          .eq('user_id', userId)
          .eq('assessment_id', invitation.assessment_id)
          .maybeSingle();

        if (existingEnrollment) {
          // Enrollment already exists, skip
          continue;
        }

        // Create enrollment with 1-year expiry from invitation date
        const invitationDate = invitation.accepted_at || invitation.created_at;
        const expiryDate = new Date(new Date(invitationDate).getTime() + 365 * 24 * 60 * 60 * 1000);

        const { error: enrollmentError } = await supabase
          .from('enrollments')
          .insert({
            user_id: userId,
            assessment_id: invitation.assessment_id,
            status: 'ENROLLED',
            expires_at: expiryDate.toISOString(),
            created_at: invitationDate,
            updated_at: new Date().toISOString(),
          });

        if (enrollmentError) {
          errors.push(`Failed to create enrollment for assessment ${invitation.assessment_id}: ${enrollmentError.message}`);
        } else {
          created.push(invitation.assessment_id);
        }

      } catch (error: any) {
        errors.push(`Error processing invitation ${invitation.id}: ${error.message}`);
      }
    }

    return { created: created.length, errors };

  } catch (error: any) {
    errors.push(`Unexpected error: ${error.message}`);
    return { created: 0, errors };
  }
}

/**
 * Server-side version using service client for use in API routes
 */
export async function createEnrollmentsForPendingInvitationsServer(
  userEmail: string, 
  userId: string,
  supabaseClient: any
): Promise<{ created: number; errors: string[] }> {
  const created: string[] = [];
  const errors: string[] = [];

  try {
    // Get all accepted invitations for this user
    const { data: invitations, error: invitationsError } = await supabaseClient
      .from('assessment_invitations')
      .select('id, assessment_id, accepted_at, created_at')
      .eq('email', userEmail.toLowerCase())
      .eq('status', 'accepted');

    if (invitationsError) {
      errors.push(`Failed to fetch invitations: ${invitationsError.message}`);
      return { created: 0, errors };
    }

    if (!invitations || invitations.length === 0) {
      return { created: 0, errors: [] };
    }

    // For each invitation, check if enrollment already exists
    for (const invitation of invitations) {
      try {
        // Check if enrollment already exists
        const { data: existingEnrollment } = await supabaseClient
          .from('enrollments')
          .select('id')
          .eq('user_id', userId)
          .eq('assessment_id', invitation.assessment_id)
          .maybeSingle();

        if (existingEnrollment) {
          continue;
        }

        // Create enrollment with 1-year expiry from invitation date
        const invitationDate = invitation.accepted_at || invitation.created_at;
        const expiryDate = new Date(new Date(invitationDate).getTime() + 365 * 24 * 60 * 60 * 1000);

        const { error: enrollmentError } = await supabaseClient
          .from('enrollments')
          .insert({
            user_id: userId,
            assessment_id: invitation.assessment_id,
            status: 'ENROLLED',
            expires_at: expiryDate.toISOString(),
            created_at: invitationDate,
            updated_at: new Date().toISOString(),
          });

        if (enrollmentError) {
          errors.push(`Failed to create enrollment for assessment ${invitation.assessment_id}: ${enrollmentError.message}`);
        } else {
          created.push(invitation.assessment_id);
        }

      } catch (error: any) {
        errors.push(`Error processing invitation ${invitation.id}: ${error.message}`);
      }
    }

    return { created: created.length, errors };

  } catch (error: any) {
    errors.push(`Unexpected error: ${error.message}`);
    return { created: 0, errors };
  }
} 