const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  // Serve the dashboard.ejs content
  const dashboardPath = path.join(__dirname, '../views/dashboard.ejs');
  
  try {
    // Read the file
    const template = fs.readFileSync(dashboardPath, 'utf8');
    
    // Render the EJS template with the proper variables
    const html = ejs.render(template, {
      title: 'SEO Dashboard'
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: html,
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: `Error: ${error.message}`,
    };
  }
};
