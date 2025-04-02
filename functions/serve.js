const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  // Serve the index.ejs content
  const indexPath = path.join(__dirname, '../views/index.ejs');
  
  try {
    // Read the file
    const html = fs.readFileSync(indexPath, 'utf8');
    
    // Simple string replacements for EJS tags
    const processedHtml = html
      .replace('<%= error %>', '')
      .replace('<% if (isAuthenticated) { %>', '')
      .replace('<% } else { %>', '')
      .replace('<% } %>', '')
      .replace('<%= new Date().getFullYear() %>', new Date().getFullYear().toString());

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: processedHtml,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: `Error: ${error.message}`,
    };
  }
};
