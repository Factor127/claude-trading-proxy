// api/proxy.js
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { type, apiKey, prompt, url } = req.body || {};

    // Handle Claude API calls
    if (type === 'claude') {
      if (!apiKey || !prompt) {
        return res.status(400).json({ error: 'Missing apiKey or prompt' });
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

      if (!response.ok) {
        const errorData = await response.json();
        return res.status(response.status).json({ 
          error: errorData.error?.message || 'Claude API error' 
        });
      }

      const data = await response.json();
      return res.status(200).json({ analysis: data.content[0].text });
    }

    // Handle stock data API calls
    if (type === 'stock' && url) {
      const response = await fetch(url);
      
      if (!response.ok) {
        return res.status(response.status).json({ 
          error: `Stock API error: ${response.statusText}` 
        });
      }

      const data = await response.json();
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: 'Invalid request type' });

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'I
