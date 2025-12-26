export async function enrichUserData(inputData: string | Record<string, any>): Promise<boolean> {
  try {
    const webhookUrl = process.env.CLAY_WEBHOOK_URL;
    const authHeader = process.env.CLAY_WEBHOOK_AUTH;

    if (!webhookUrl) {
      console.error('CLAY_WEBHOOK_URL environment variable is not set');
      return false;
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authHeader) {
      headers['x-clay-webhook-auth'] = authHeader;
    }

    // Support both email string (backward compatibility) and object with multiple fields
    let payload: Record<string, string>;
    if (typeof inputData === 'string') {
      payload = { email: inputData };
    } else {
      // Create a clean copy with only valid string fields
      payload = {};
      if (inputData.email && typeof inputData.email === 'string') {
        payload.email = inputData.email.trim();
      }
      if (inputData.name && typeof inputData.name === 'string') {
        payload.name = inputData.name.trim();
      }
      // Only include optional fields if they are valid strings
      if (inputData.phone_number && typeof inputData.phone_number === 'string') {
        payload.phone_number = inputData.phone_number.trim();
      }
      if (inputData.job_title && typeof inputData.job_title === 'string') {
        payload.job_title = inputData.job_title.trim();
      }
      if (inputData.company_size && typeof inputData.company_size === 'string') {
        payload.company_size = inputData.company_size.trim();
      }
      if (inputData.budget && typeof inputData.budget === 'string') {
        payload.budget = inputData.budget.trim();
      }
    }

    // Ensure payload has required fields (name and email) with valid string values
    if (!payload.email || !payload.name) {
      console.error('Clay webhook payload missing required fields (name and email):', { 
        hasEmail: !!payload.email, 
        hasName: !!payload.name,
        inputData 
      });
      return false;
    }

    // Validate that email and name are non-empty strings
    if (payload.email.length === 0 || payload.name.length === 0) {
      console.error('Clay webhook payload has empty required fields:', payload);
      return false;
    }

    // Convert payload to JSON string - ensure it's properly stringified
    let payloadString: string;
    try {
      payloadString = JSON.stringify(payload);
      // Verify the stringified result is valid JSON
      const testParse = JSON.parse(payloadString);
      if (!testParse.email || !testParse.name) {
        throw new Error('Stringified payload missing required fields');
      }
    } catch (error) {
      console.error('Failed to stringify payload:', error);
      console.error('Payload object:', payload);
      console.error('Payload type:', typeof payload);
      return false;
    }
    
    // Log the payload being sent (for debugging)
    console.log('=== CLAY WEBHOOK REQUEST ===');
    console.log('URL:', webhookUrl);
    console.log('Headers:', JSON.stringify(headers, null, 2));
    console.log('Payload object:', JSON.stringify(payload, null, 2));
    console.log('Payload string:', payloadString);
    console.log('Payload string type:', typeof payloadString);
    console.log('Payload string length:', payloadString.length);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: payloadString,
    });
    
    // Log response for debugging
    console.log('Clay webhook response status:', response.status, response.statusText);
    
    // Read response body for debugging (before checking ok, as we need to read it first)
    let responseText = '';
    try {
      responseText = await response.text();
      if (responseText) {
        console.log('Clay webhook response body:', responseText);
      }
    } catch (e) {
      console.warn('Could not read response body:', e);
    }

    if (!response.ok) {
      console.error(`Clay.com webhook failed: ${response.status} ${response.statusText}`);
      console.error('Response body:', responseText);
      return false;
    }

    // Clay webhook queues the data for enrichment - it doesn't return enriched data immediately
    // The enriched data will be sent back via a webhook callback
    // Return true to indicate successful queueing
    return true;
  } catch (error) {
    console.error('Error calling Clay.com webhook:', error);
    return false;
  }
}

import { getDatabase } from './db';

export async function storeEnrichmentData(userId: number, enrichmentData: any): Promise<void> {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO user_enrichments (user_id, clay_data, enriched_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `);
  
  stmt.run(userId, JSON.stringify(enrichmentData));
}

export async function getEnrichmentData(userId: number): Promise<any | null> {
  const db = getDatabase();
  
  const stmt = db.prepare('SELECT clay_data FROM user_enrichments WHERE user_id = ?');
  const result = stmt.get(userId) as any;
  
  if (!result) {
    return null;
  }
  
  try {
    return JSON.parse(result.clay_data);
  } catch {
    return null;
  }
}

