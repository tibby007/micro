// api/apollo.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("------- /api/apollo HANDLER INVOKED (Vercel/Node runtime) -------");
  console.log("Request method:", req.method);

  if (req.method !== 'POST') {
    console.log("Method not allowed, sending 405");
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { domain } = req.body; 
  console.log("Received domain in request body:", domain);

  if (!domain) {
    console.log("Domain is missing in request, sending 400");
    return res.status(400).json({ error: 'Domain required' });
  }

  const apiKey = process.env.APOLLO_API_KEY;
  
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    console.error("!!!!!! APOLLO_API_KEY IS NOT SET OR EMPTY IN SERVER ENVIRONMENT !!!!!!");
    console.error("Value of process.env.APOLLO_API_KEY:", process.env.APOLLO_API_KEY);
    return res.status(500).json({ error: 'API key configuration error on server. Key missing or empty.' });
  }
  console.log("Apollo API Key found (server-side, first 5 chars):", apiKey.substring(0,5) + "...");

  try {
    console.log(`Attempting to call Apollo.io API for domain: ${domain} with person_fields`);
    const apolloResponse = await fetch('https://api.apollo.io/v1/organizations/search', { // Opening fetch options object
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apiKey
      },
      // In api/apollo.ts
// ...
body: JSON.stringify({
  q_organization_domain: domain
  // NO page, NO per_page, NO person_fields, NO reveal_personal_emails
  // Just the absolute minimum to find an org by domain.
})
// ...
    }); // <<<< CORRECTED: Closing brace for fetch options object and parenthesis for fetch call.

    console.log(`Apollo.io API response status: ${apolloResponse.status}`);
    const responseBodyText = await apolloResponse.text();

    if (!apolloResponse.ok) {
      console.error(`Apollo.io API request failed with status ${apolloResponse.status}. Response:`, responseBodyText);
      let errorJson = { error: `Apollo API Error: ${apolloResponse.status}`, details: responseBodyText };
      try {
        errorJson = JSON.parse(responseBodyText);
      } catch (e) { /* ignore parsing error if not json */ }
      
      return res.status(apolloResponse.status).json(errorJson);
    }

    try {
      const data = JSON.parse(responseBodyText);
      console.log("Data received successfully from Apollo.io (with person_fields attempt):", JSON.stringify(data, null, 2));
      return res.status(200).json(data);
    } catch (e: any) {
      console.error("Failed to parse successful Apollo response as JSON:", responseBodyText, e);
      return res.status(500).json({ error: "Failed to parse Apollo response.", details: e.message });
    }

  } catch (error: any) {
    console.error('!!!!!! UNEXPECTED ERROR in /api/apollo handler !!!!!!:', error);
    return res.status(500).json({ error: 'Unexpected server error during Apollo API request.', details: error.message });
  }
}