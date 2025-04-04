const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Google OAuth configuration
  const clientId = process.env.GOOGLE_CLIENT_ID || 'your-client-id';
  const redirectUri = process.env.REDIRECT_URI || 'https://seo-dashboard-raquel.netlify.app/.netlify/functions/auth-callback';
  
  // Define the scopes we need
  const scopes = [
    'https://www.googleapis.com/auth/webmasters.readonly',
    'https://www.googleapis.com/auth/analytics.readonly'
  ];
  
  // Create the authorization URL
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes.join(' '))}&access_type=offline&prompt=consent`;
  
  // Redirect to Google's OAuth page
  return {
    statusCode: 302,
    headers: {
      Location: authUrl
    },
    body: ''
  };
};
