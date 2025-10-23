// Simple proxy server to handle CORS issues with Anthropic API
// Run this with: node proxy-server.js

const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Direct proxy to Anthropic API
app.post('/api/v1/messages', async (req, res) => {
  try {
    console.log('Proxying request to Anthropic API...');
    
    const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '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';
    
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const postData = JSON.stringify(req.body);
    
    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('Making request to Anthropic with:', {
      hasApiKey: !!apiKey,
      bodySize: postData.length,
      model: req.body.model
    });

    const proxyReq = https.request(options, (proxyRes) => {
      let data = '';
      
      proxyRes.on('data', (chunk) => {
        data += chunk;
      });
      
      proxyRes.on('end', () => {
        console.log('Received response from Anthropic:', {
          status: proxyRes.statusCode,
          dataLength: data.length
        });
        
        res.status(proxyRes.statusCode);
        res.set({
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.send(data);
      });
    });

    proxyReq.on('error', (error) => {
      console.error('Proxy request error:', error);
      res.status(500).json({ error: 'Proxy request failed', details: error.message });
    });

    proxyReq.write(postData);
    proxyReq.end();

  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log('API endpoint: http://localhost:3001/api/v1/messages');
});
