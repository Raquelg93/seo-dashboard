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
    // This is a simplified version that doesn't actually connect to Google
    // In a production version, you would exchange the code for tokens
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html'
      },
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Successfully Connected</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css">
        </head>
        <body>
          <div class="container mt-5">
            <div class="alert alert-success">
              <h4>Successfully Connected!</h4>
              <p>You have successfully connected with Google.</p>
              <p><strong>Note:</strong> This is a demonstration. In a production version, this would actually connect to your Google Search Console and Analytics accounts.</p>
            </div>
            <a href="/.netlify/functions/dashboard" class="btn btn-primary">Go to Dashboard</a>
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
            </div>
            <a href="/" class="btn btn-primary">Back to Home</a>
          </div>
        </body>
        </html>
      `
    };
  }
};
