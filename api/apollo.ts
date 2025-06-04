// api/apollo.ts

// Use standard Node.js http types if needed, or often just rely on Vercel's provided req/res.
// For simplicity, we can often just type `req` and `res` as `any` if not doing complex header/cookie manipulation,
// or use types from a lightweight framework if we were using one.
// Since Vercel often provides objects compatible with Node's http.IncomingMessage and http.ServerResponse,
// we can use those or more generic types.

// Let's use Vercel's specific types for more accuracy on Vercel's platform.
// You might need to install this if not already: npm install @vercel/node
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) { // Changed types
  console.log("------- /api/apollo HANDLER INVOKED (Vercel/Node runtime) -------");
  console.log("Request method:", req.method);

  if (req.method !== 'POST') {
    console.log("Method not allowed, sending 405");
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // req.body should already be parsed by Vercel for JSON content types
  const { domain } = req.body; 
  console.log("Received domain in request body:", domain);

  if (!domain) {
    console.log("Domain is missing in request, sending 400");
    return res.status(400).json({ error: 'Domain required' });
  }

  const apiKey = process.env.APOLLO_API_KEY;
  
  if (!apiKey) {
    console.error("!!!!!! APOLLO_API_KEY IS NOT SET IN SERVER ENVIRONMENT !!!!!!");
    return res.status(500).json({ error: 'API key configuration error on server.' });
  }
  console.log("Apollo API Key found (server-side, first 5 chars):", apiKey.substring(0,5) + "...");

  try {
    console.log(`Attempting to call Apollo.io API for domain: ${domain}`);
    const apolloResponse = await fetch('https://api.apollo.io/v1/organizations/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apiKey
      },
      body: JSON.stringify({
        q_organization_domain: domain,
        page: 1,
        per_page: 1,
        // EXAMPLE - CHECK APOLLO DOCS FOR CORRECT FIELD NAMES
        person_fields: ["name", "title", "email", "linkedin_url", "phone_numbers", "headline"],
        reveal_personal_emails: true // This might be a separate parameter or part of your plan
      })

    console.log(`Apollo.io API response status: ${apolloResponse.status}`);
    const responseBodyText = await apolloResponse.text(); // Read body once

    if (!apolloResponse.ok) {
      console.error(`Apollo.io API request failed with status ${apolloResponse.status}. Response:`, responseBodyText);
      // Try to parse as JSON, but fallback if it's not
      let errorJson = { error: `Apollo API Error: ${apolloResponse.status}`, details: responseBodyText };
      try {
        errorJson = JSON.parse(responseBodyText);
      } catch (e) { /* ignore parsing error if not json */ }
      
      return res.status(apolloResponse.status).json(errorJson);
    }

    // If response is OK, it should be JSON
    try {
      const data = JSON.parse(responseBodyText);
      console.log("Data received successfully from Apollo.io:", JSON.stringify(data, null, 2));
      return res.status(200).json(data); // Send successful response
    } catch (e: any) {
      console.error("Failed to parse successful Apollo response as JSON:", responseBodyText, e);
      return res.status(500).json({ error: "Failed to parse Apollo response.", details: e.message });
    }

  } catch (error: any) {
    console.error('!!!!!! UNEXPECTED ERROR in /api/apollo handler !!!!!!:', error);
    return res.status(500).json({ error: 'Unexpected server error during Apollo API request.', details: error.message });
  }
}