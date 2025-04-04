exports.handler = async function(event, context) {
  // This is a simplified auth function
  const redirectUrl = '/.netlify/functions/dashboard';
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
    },
    body: `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Google Authentication</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css">
        <meta http-equiv="refresh" content="5;url=${redirectUrl}">
      </head>
      <body>
        <div class="container mt-5">
          <div class="card">
            <div class="card-body text-center">
              <h3 class="card-title">Google Authentication</h3>
              <div class="alert alert-info">
                <p>This is a demonstration version of the authentication flow.</p>
                <p>In a production version, this would redirect you to Google's OAuth consent screen.</p>
              </div>
              <p>You'll be redirected to the dashboard in 5 seconds...</p>
              <a href="${redirectUrl}" class="btn btn-primary">Go to Dashboard Now</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };
};
