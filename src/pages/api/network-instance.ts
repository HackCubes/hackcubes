import type { NextApiRequest, NextApiResponse } from 'next';
import { InstanceManager } from '../../lib/instanceManager';
import { createClient } from '@supabase/supabase-js';

interface NetworkInstanceResponse {
  status?: string;
  ip?: string;
  instance_id?: string;
  expiration_time?: string;
  message?: string;
  error?: string;
  current_state?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { action, question_id, candidate_id, template_id, duration, username } = req.query as Record<string, string | undefined>;

    if (!action || !question_id || !candidate_id) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const validActions = ['get_status', 'start', 'stop', 'restart', 'terminate'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: `Invalid action type. Must be one of: ${validActions.join(', ')}` });
    }

    // Get question details from database to determine routing
    let question = null;
    
    // Always get question details for proper routing
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: questionData } = await supabase
        .from('questions')
        .select('*')
        .eq('id', question_id)
        .single();
      
      question = questionData;
    }
    
    // If no question found but we have template_id, create a minimal question object
    if (!question && template_id) {
      question = {
        id: question_id,
        template_id: template_id,
        name: 'Challenge Instance'
      };
    }

    console.log(`🎯 API Request: ${action} for question ${question_id} with template_id: ${template_id}`);
    
    // Use the new InstanceManager
    const result = await InstanceManager.manageInstance({
      action: action as any,
      questionId: question_id,
      candidateId: candidate_id,
      username: username || candidate_id.substring(0, 8), // Use part of candidate_id as username if not provided
      question: question,
      duration: duration
    });

    console.log(`📊 InstanceManager result:`, result);

    // Transform the response to match the expected NetworkInstanceResponse format
    const response: NetworkInstanceResponse = {
      status: result.status,
      ip: result.ip,
      instance_id: result.instance_id,
      expiration_time: result.expiration_time || result.expirationTime,
      message: result.message,
      error: result.error,
      current_state: result.current_state
    };

    // Handle different response types
    if (result.error && result.status === 'error') {
      return res.status(400).json(response);
    }

    if (result.status === 'not_supported') {
      return res.status(400).json({ 
        error: 'This challenge does not support instance management',
        status: 'not_supported'
      });
    }

    // Success response
    return res.status(200).json(response);

  } catch (err: any) {
    console.error('Error in network-instance API:', err);
    return res.status(500).json({ 
      error: 'Failed to process request', 
      message: err?.message 
    });
  }
}
