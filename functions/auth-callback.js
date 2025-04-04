const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Get the authorization code from the query parameters
  const code = event.queryStringParameters?.code;
  
  if (!code) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html'
      },
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authentication Error</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css">
        </head>
        <body>
          <div class="container mt-5">
            <div class="alert alert-danger">
              <h4>Authentication Error</h4>
              <p>No authorization code received from Google.</p>
            </div>
            <a href="/" class="btn btn-primary">Back to Home</a>
          </div>
        </body>
        </html>
      `
    };
  }
  
  try {
    // Exchange the authorization code for tokens
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
    
    // For debugging - in production you wouldn't display tokens
    console.log('Access token received:', tokenData.access_token.substring(0, 10) + '...');
    
    // Store tokens in secure cookies
    // Note: In production, you'd want to use a more secure method
    const cookieOptions = 'Path=/; HttpOnly; SameSite=Strict; Secure;';
    const accessCookie = `access_token=${tokenData.access_token}; ${cookieOptions} Max-Age=${tokenData.expires_in}`;
    
    let cookies = [accessCookie];
    
    // Add refresh token cookie if available
    if (tokenData.refresh_token) {
      const refreshCookie = `refresh_token=${tokenData.refresh_token}; ${cookieOptions} Max-Age=7776000`; // 90 days
      cookies.push(refreshCookie);
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
        'Set-Cookie': cookies
      },
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Successfully Connected</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css">
          <meta http-equiv="refresh" content="5;url=/.netlify/functions/dashboard">
        </head>
        <body>
          <div class="container mt-5">
            <div class="alert alert-success">
              <h4>Successfully Connected!</h4>
              <p>You have successfully connected with Google.</p>
              <p>Access token received and stored securely.</p>
              <p>You will be redirected to the dashboard in 5 seconds...</p>
            </div>
            <a href="/.netlify/functions/dashboard" class="btn btn-primary">Go to Dashboard Now</a>
          </div>
        </body>
        </html>
      `
    };
  } catch (error) {
    console.error('OAuth error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/html'
      },
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authentication Error</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css">
        </head>
        <body>
          <div class="container mt-5">
            <div class="alert alert-danger">
              <h4>Authentication Error</h4>
              <p>Error: ${error.message}</p>
              <p>Check the Netlify function logs for more details.</p>
            </div>
            <a href="/" class="btn btn-primary">Back to Home</a>
          </div>
        </body>
        </html>
      `
    };
  }
};
