export default async function handler(req, res) {
  // Set CORS headers for ALL responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle GET requests
  if (req.method === 'GET') {
    res.status(200).json({ message: 'Proxy is working! Use POST for API calls.' });
    return;
  }

  // Handle POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { type, apiKey, prompt, url } = req.body || {};

    // Handle Claude API calls
    if (type === 'claude') {
      if (!apiKey || !prompt) {
        res.status(400).json({ error: 'Missing apiKey or prompt' });
        return;
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1500,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        res.status(response.status).json({ 
          error: data.error?.message || 'Claude API error' 
        });
        return;
      }

      res.status(200).json({ analysis: data.content[0].text });
      return;
    }

    // Handle stock data API calls
    if (type === 'stock' && url) {
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        res.status(response.status).json({ 
          error: `Stock API error: ${response.statusText}` 
        });
        return;
      }

      res.status(200).json(data);
      return;
    }

    res.status(400).json({ error: 'Invalid request type. Use type: "claude" or "stock"' });

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}
