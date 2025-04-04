const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Get the authorization code from the query parameters
  const code = event.queryStringParameters.code;
  
  if (!code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'No authorization code received' })
    };
  }
  
  try {
    // Exchange the code for access and refresh tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code: code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.REDIRECT_URI || 'https://seo-dashboard-raquel.netlify.app/.netlify/functions/auth-callback',
        grant_type: 'authorization_code'
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error);
    }
    
    // Store the tokens in the database or return them to the client
    // For simplicity in this example, we'll just store in cookies
    // In production, you should use a secure database

    // Create a cookie with the access token
    const cookieHeader = `token=${tokenData.access_token}; Path=/; HttpOnly; Max-Age=${tokenData.expires_in}`;
    const refreshCookieHeader = `refresh_token=${tokenData.refresh_token}; Path=/; HttpOnly; Max-Age=31536000`; // 1 year
    
    // Redirect back to the dashboard
    return {
      statusCode: 302,
      headers: {
        'Location': '/.netlify/functions/dashboard',
        'Set-Cookie': [cookieHeader, refreshCookieHeader],
        'Cache-Control': 'no-cache'
      },
      body: ''
    };
  } catch (error) {
    console.error('OAuth error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
