import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { domain } = req.body;
  
  if (!domain) {
    return res.status(400).json({ error: 'Domain required' });
  }

  const apiKey = process.env.APOLLO_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'Api key required' });
  }

  try {
    const response = await fetch('https://api.apollo.io/v1/organizations/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apiKey
      },
      body: JSON.stringify({
        q_organization_domain: domain,
        page: 1,
        per_page: 1
      })
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Apollo API error:', error);
    res.status(500).json({ error: 'Apollo API request failed' });
  }
}