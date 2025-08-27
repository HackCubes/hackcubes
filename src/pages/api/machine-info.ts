import type { NextApiRequest, NextApiResponse } from 'next';

const LAMBDA_URL = process.env.AWS_LAMBDA_URL;
const SECRET_TOKEN = process.env.AWS_LAMBDA_TOKEN;
const TIMEOUT_MS = 35000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { instanceId } = req.query as { instanceId?: string };

    if (!instanceId) {
      return res.status(400).json({ message: 'Instance ID is required' });
    }

    if (!LAMBDA_URL || !SECRET_TOKEN) {
      console.error('Missing required environment variables for AWS Lambda');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`${LAMBDA_URL}?id=${encodeURIComponent(instanceId)}&token=${encodeURIComponent(SECRET_TOKEN)}`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData: any = null;
        try { errorData = await response.json(); } catch {}
        console.error('Lambda API error:', response.status, errorData);

        if (response.status === 404) {
          return res.status(404).json({ message: 'Instance not found' });
        } else if (response.status === 409) {
          return res.status(409).json({ message: 'Instance is in an invalid state' });
        }
        return res.status(response.status).json({ message: errorData?.error || 'Failed to fetch machine info' });
      }

      const data = await response.json();
      return res.status(200).json(data);
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e?.name === 'AbortError') {
        console.error('Lambda request timed out');
        return res.status(504).json({ message: 'Request timed out while fetching machine info' });
      }
      throw e;
    }
  } catch (error) {
    console.error('Error in machine-info API route:', error);
    return res.status(500).json({ message: 'An unexpected error occurred' });
  }
}
