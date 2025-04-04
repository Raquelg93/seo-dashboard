// Add this at the top of your file
const cookie = require('cookie');

// Then in your handler function, add this before making API calls
// Parse cookies from request headers
const cookies = cookie.parse(event.headers.cookie || '');
const accessToken = cookies.access_token;

if (!accessToken) {
  return {
    statusCode: 401,
    body: JSON.stringify({ 
      error: 'Authentication required', 
      message: 'Please connect with Google to access this feature'
    })
  };
}

// Then use the accessToken in your API calls to Google
