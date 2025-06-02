import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('APOLLO_API_KEY exists:', !!process.env.APOLLO_API_KEY);
  console.log('APOLLO_API_KEY length:', process.env.APOLLO_API_KEY?.length);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { endpoint, data } = req.body;
    
    const response = await axios({
      method: 'POST',
      url: `https://api.apollo.io/v1/${endpoint}`,
      headers: {
        'X-Api-Key': process.env.APOLLO_API_KEY,
        'Content-Type': 'application/json'
      },
      data
    });

    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Apollo API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data || 'Apollo API request failed' 
    });
  }
}