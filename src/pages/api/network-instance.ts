import type { NextApiRequest, NextApiResponse } from 'next';

interface NetworkInstanceResponse {
  status?: string;
  ip?: string;
  instance_id?: string;
  expiration_time?: string;
  message?: string;
  error?: string;
  current_state?: string;
}

const MAX_START_TIMEOUT = 15000; // 15s for start
const MAX_DEFAULT_TIMEOUT = 30000; // 30s others

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { action, question_id, candidate_id, template_id, duration } = req.query as Record<string, string | undefined>;

    if (!action || !question_id || !candidate_id) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const validActions = ['get_status', 'start', 'stop', 'restart', 'terminate'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: `Invalid action type. Must be one of: ${validActions.join(', ')}` });
    }

    if (action === 'start' && !template_id) {
      return res.status(400).json({ error: 'Template ID is required for starting an instance' });
    }

    const baseUrl = process.env.NETWORK_LAMBDA_URL;
    const token = process.env.AWS_LAMBDA_TOKEN;

    if (!baseUrl || !token) {
      console.error('Network Lambda URL or token not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    let lambdaUrl = `${baseUrl}?action=${encodeURIComponent(action)}&question_id=${encodeURIComponent(question_id)}&candidate_id=${encodeURIComponent(candidate_id)}&token=${encodeURIComponent(token)}`;

    if (template_id) {
      lambdaUrl += `&template_id=${encodeURIComponent(template_id)}`;
    }
    if (duration) {
      lambdaUrl += `&duration=${encodeURIComponent(duration)}`;
    }

    lambdaUrl += `&_t=${Date.now()}`; // cache buster

    const timeoutMs = action === 'start' ? MAX_START_TIMEOUT : MAX_DEFAULT_TIMEOUT;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(lambdaUrl, {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error(`Lambda returned error status ${response.status}: ${errorText}`);
        return res.status(response.status).json({ error: `Failed to process request: ${response.statusText}` });
      }

      const data: NetworkInstanceResponse = await response.json();

      if (data.error) {
        return res.status(400).json({ error: data.error, current_state: data.current_state });
      }

      if (action === 'start') {
        return res.status(200).json({ ...data, ip: data.ip || 'Pending...', message: 'Instance initiated successfully' });
      }

      return res.status(200).json(data);
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e?.name === 'AbortError') {
        if (action === 'start') {
          return res.status(202).json({ status: 'pending', ip: 'Pending...', message: 'Instance initiated. Check status later to get IP address.' });
        }
        return res.status(504).json({ error: 'Request timed out. Operation may still be in progress.' });
      }
      throw e;
    }
  } catch (err: any) {
    console.error('Error calling network instance Lambda:', err);
    return res.status(500).json({ error: 'Failed to process request', message: err?.message });
  }
}
