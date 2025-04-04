exports.handler = async (event, context) => {
  // Parse cookies to check authentication
  const cookieHeader = event.headers.cookie || '';
  const cookies = parseCookies(cookieHeader);
  const isAuthenticated = !!cookies.access_token;
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
    },
    body: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SEO Dashboard</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f8fa;
            color: #333;
          }
          .card {
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            border: none;
            margin-bottom: 20px;
          }
          .card-title {
            color: #2c3e50;
            font-weight: 600;
            margin-bottom: 20px;
          }
          .progress {
            height: 8px;
            margin-top: 5px;
          }
          .spinner-border {
            width: 3rem; 
            height: 3rem;
            margin-bottom: 1rem;
          }
        </style>
      </head>
      <body>
       <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container">
          <a class="navbar-brand" href="/">SEO Dashboard</a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ms-auto">
              <li class="nav-item">
                <a class="nav-link" href="/">Home</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="/.netlify/functions/dashboard">Dashboard</a>
              </li>
              ${isAuthenticated 
                ? `<li class="nav-item"><a class="nav-link" href="/.netlify/functions/logout">Logout</a></li>`
                : `<li class="nav-item"><a class="nav-link" href="/.netlify/functions/auth">Connect with Google</a></li>`
              }
            </ul>
          </div>
        </div>
      </nav>
        <div class="container mt-4">
          <h1>SEO Dashboard</h1>
          
          ${!isAuthenticated ? `
          <div class="alert alert-info mb-4">
            <strong>Note:</strong> You are currently using the demo version. 
            To access real Google Search Console and Analytics data, please 
            <a href="/.netlify/functions/auth" class="alert-link">Connect with Google</a>.
          </div>
          ` : `
          <div class="alert alert-success mb-4">
            <strong>Connected!</strong> You are authenticated with Google. 
            Your analysis will use real Search Console and Analytics data if available.
          </div>
          `}
          
          <div class="row mb-4">
            <div class="col-md-12">
              <div class="card">
                <div class="card-body">
                  <h5 class="card-title">Analyze Website</h5>
                  <form id="analyze-form">
                    <div class="input-group mb-3">
                      <input type="url" class="form-control" id="url-input" placeholder="Enter website URL (e.g., https://example.com)" required>
                      <button class="btn btn-primary" type="submit" id="analyze-button">
                        Analyze
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          
          <div id="dashboard-placeholder" class="mt-4">
            <div id="results-area">
              <p class="text-center text-muted">Enter a URL above to analyze its SEO performance.</p>
            </div>
          </div>
        </div>
        
        <footer class="footer mt-5 py-3 bg-light">
          <div class="container text-center">
            <span class="text-muted">Your SEO Dashboard &copy; 2025</span>
          </div>
        </footer>
        
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
        <script>
          // Real SEO analysis function with direct API call
          async function analyzeSEO(url) {
            const resultsArea = document.getElementById('results-area');
            
            // Show loading state
            resultsArea.innerHTML = '<div class="text-center"><div class="spinner-border text-primary"></div><p>Analyzing ' + url + '...</p></div>';
            
            try {
              // Call your serverless function to analyze the URL
              const response = await fetch('/.netlify/functions/analyze', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
              });
              
              const data = await response.json();
              
              if (response.ok) {
                displayAnalysisResults(data);
              } else {
                throw new Error(data.error || 'Analysis failed');
              }
            } catch (error) {
              resultsArea.innerHTML = '<div class="alert alert-danger">Error: ' + error.message + '</div>';
            }
          }
          
          // Function to display the analysis results
          function displayAnalysisResults(data) {
            const resultsArea = document.getElementById('results-area');
            
            // Start building the results HTML
            let html = '<div class="row">';
            
            // SEO Checks section
            if (data.seoChecks) {
              html += '<div class="col-md-6"><div class="card">';
              html += '<div class="card-body">';
              html += '<h5 class="card-title">SEO Health Check</h5>';
              
              // Title
              const titleStatus = getTitleStatus(data.seoChecks.title, data.seoChecks.titleLength);
              html += '<div class="mb-3">';
              html += '<strong>Title:</strong> ' + (data.seoChecks.title || '<span class="text-danger">Missing</span>');
              html += '<div class="text-muted small">Length: ' + (data.seoChecks.titleLength || 0) + ' characters ' + titleStatus.message + '</div>';
              html += '<div class="progress">';
              html += '<div class="progress-bar bg-' + titleStatus.color + '" style="width: ' + titleStatus.width + '%"></div>';
              html += '</div></div>';
              
              // Meta Description
              const descStatus = getDescriptionStatus(data.seoChecks.description, data.seoChecks.descriptionLength);
              html += '<div class="mb-3">';
              html += '<strong>Meta Description:</strong> ' + (data.seoChecks.description || '<span class="text-danger">Missing</span>');
              html += '<div class="text-muted small">Length: ' + (data.seoChecks.descriptionLength || 0) + ' characters ' + descStatus.message + '</div>';
              html += '<div class="progress">';
              html += '<div class="progress-bar bg-' + descStatus.color + '" style="width: ' + descStatus.width + '%"></div>';
              html += '</div></div>';
              
              // H1 Tags
              const h1Status = getH1Status(data.seoChecks.h1Count);
              html += '<div class="mb-3">';
              html += '<strong>H1 Tags:</strong> ' + data.seoChecks.h1Count + ' found';
              if (data.seoChecks.h1Tags && data.seoChecks.h1Tags.length) {
                html += '<div class="text-muted small">' + data.seoChecks.h1Tags.join(', ') + '</div>';
              }
              html += '<div class="progress">';
              html += '<div class="progress-bar bg-' + h1Status.color + '" style="width: ' + h1Status.width + '%"></div>';
              html += '</div></div>';
              
              // Images
              const imgStatus = getImgAltStatus(data.seoChecks.imgCount, data.seoChecks.imgWithAlt);
              html += '<div class="mb-3">';
              html += '<strong>Images:</strong> ' + data.seoChecks.imgCount + ' total, ' + 
                     (data.seoChecks.imgCount - data.seoChecks.imgWithAlt) + ' missing alt text';
              html += '<div class="progress">';
              html += '<div class="progress-bar bg-' + imgStatus.color + '" style="width: ' + imgStatus.width + '%"></div>';
              html += '</div></div>';
              
              // SSL Status
              const sslStatus = getSslStatus(data.seoChecks.sslSecure);
              html += '<div class="mb-3">';
              html += '<strong>SSL Security:</strong> ' + (data.seoChecks.sslSecure ? 'Secure (HTTPS)' : 'Not Secure (HTTP)');
              html += '<div class="progress">';
              html += '<div class="progress-bar bg-' + sslStatus.color + '" style="width: ' + sslStatus.width + '%"></div>';
              html += '</div></div>';
              
              html += '</div></div></div>';
            }
            
            // Performance Data section
            if (data.performanceData) {
              html += '<div class="col-md-6"><div class="card">';
              html += '<div class="card-body">';
              html += '<h5 class="card-title">Performance Metrics</h5>';
              
              if (data.performanceData.error) {
                html += '<div class="alert alert-warning">' + data.performanceData.error + '</div>';
              } else {
                // Performance score
                const perfScore = data.performanceData.performance ? Math.round(data.performanceData.performance * 100) : 'N/A';
                const perfColor = getPerfColor(data.performanceData.performance);
                
                html += '<div class="mb-3 text-center">';
                html += '<div class="display-4 fw-bold text-' + perfColor + '">' + perfScore + '</div>';
                html += '<div class="text-muted">Performance Score</div>';
                html += '</div>';
                
                // Core Web Vitals table
                html += '<table class="table table-sm">';
                html += '<tr><td>First Contentful Paint</td><td>' + 
                       (data.performanceData.firstContentfulPaint || 'N/A') + '</td></tr>';
                html += '<tr><td>Largest Contentful Paint</td><td>' + 
                       (data.performanceData.largestContentfulPaint || 'N/A') + '</td></tr>';
                html += '<tr><td>Cumulative Layout Shift</td><td>' + 
                       (data.performanceData.cumulativeLayoutShift || 'N/A') + '</td></tr>';
                html += '<tr><td>Time to Interactive</td><td>' + 
                       (data.performanceData.timeToInteractive || 'N/A') + '</td></tr>';
                html += '</table>';
              }
              
              html += '</div></div></div>';
            }
            
            html += '</div>'; // End row
            
            // Search Console Data section
            if (data.searchConsole && data.searchConsole.data) {
              html += '<div class="card mt-4">';
              html += '<div class="card-body">';
              html += '<h5 class="card-title">Search Performance</h5>';
              
              // Overview
              html += '<div class="row text-center mb-3">';
              if (data.searchConsole.data.totals) {
                const totals = data.searchConsole.data.totals;
                html += '<div class="col-md-3"><div class="h4">' + Math.round(totals.clicks) + '</div><div class="text-muted">Clicks</div></div>';
                html += '<div class="col-md-3"><div class="h4">' + Math.round(totals.impressions) + '</div><div class="text-muted">Impressions</div></div>';
                html += '<div class="col-md-3"><div class="h4">' + (totals.ctr * 100).toFixed(2) + '%</div><div class="text-muted">CTR</div></div>';
                html += '<div class="col-md-3"><div class="h4">' + totals.position.toFixed(1) + '</div><div class="text-muted">Avg. Position</div></div>';
              }
              html += '</div>';
              
              // Top Queries
              if (data.searchConsole.data.rows && data.searchConsole.data.rows.length) {
                html += '<h6>Top Search Queries</h6>';
                html += '<div class="table-responsive">';
                html += '<table class="table table-sm">';
                html += '<thead><tr><th>Query</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Position</th></tr></thead>';
                html += '<tbody>';
                
                // Show top 5 queries
                const topQueries = data.searchConsole.data.rows.slice(0, 5);
                
                topQueries.forEach(row => {
                  html += '<tr>';
                  html += '<td>' + row.keys[0] + '</td>';
                  html += '<td>' + Math.round(row.clicks) + '</td>';
                  html += '<td>' + Math.round(row.impressions) + '</td>';
                  html += '<td>' + (row.ctr * 100).toFixed(2) + '%</td>';
                  html += '<td>' + row.position.toFixed(1) + '</td>';
                  html += '</tr>';
                });
                
                html += '</tbody></table></div>';
                
                ${!isAuthenticated ? `
                html += '<div class="alert alert-info mt-3">';
                html += '<strong>Note:</strong> This is simulated search performance data for demonstration purposes. ';
                html += 'Connect with Google to see real data from Search Console.';
                html += '</div>';
                ` : ''}
              }
              
              html += '</div></div>';
            }
            
            // Analytics data section (only shown when authenticated)
            if (data.analytics && isAuthenticated) {
              html += '<div class="card mt-4">';
              html += '<div class="card-body">';
              html += '<h5 class="card-title">Google Analytics Data</h5>';
              
              if (data.analytics.error) {
                html += '<div class="alert alert-warning">' + data.analytics.error + '</div>';
              } else if (data.analytics.rows && data.analytics.rows.length > 0) {
                // Display analytics data
                html += '<div class="table-responsive">';
                html += '<table class="table table-sm">';
                html += '<thead><tr><th>Source/Medium</th><th>Sessions</th><th>Users</th><th>Bounce Rate</th><th>Avg. Session Duration</th></tr></thead>';
                html += '<tbody>';
                
                data.analytics.rows.forEach(row => {
                  html += '<tr>';
                  html += '<td>' + row[0] + '/' + row[1] + '</td>';
                  html += '<td>' + row[2] + '</td>';
                  html += '<td>' + row[3] + '</td>';
                  html += '<td>' + row[4] + '%</td>';
                  html += '<td>' + formatTime(row[5]) + '</td>';
                  html += '</tr>';
                });
                
                html += '</tbody></table></div>';
              } else {
                html += '<div class="alert alert-info">No Analytics data available for this URL.</div>';
              }
              
              html += '</div></div>';
            }
            
            // Analysis date
            if (data.analysisDate) {
              html += '<div class="text-muted text-end small mt-2">Analysis performed: ' + 
                      new Date(data.analysisDate).toLocaleString() + '</div>';
            }
            
            resultsArea.innerHTML = html;
          }
          
          // Helper functions for rating SEO elements
          function getTitleStatus(title, length) {
            if (!title) return { color: 'danger', width: 25, message: '(Missing)' };
            if (length < 30) return { color: 'warning', width: 50, message: '(Too short)' };
            if (length > 60) return { color: 'warning', width: 50, message: '(Too long)' };
            return { color: 'success', width: 100, message: '(Good length)' };
          }
          
          function getDescriptionStatus(desc, length) {
            if (!desc) return { color: 'danger', width: 25, message: '(Missing)' };
            if (length < 50) return { color: 'warning', width: 50, message: '(Too short)' };
            if (length > 160) return { color: 'warning', width: 50, message: '(Too long)' };
            return { color: 'success', width: 100, message: '(Good length)' };
          }
          
          function getH1Status(count) {
            if (count === 0) return { color: 'danger', width: 25, message: '(Missing)' };
            if (count > 1) return { color: 'warning', width: 50, message: '(Multiple H1s)' };
            return { color: 'success', width: 100, message: '(Good)' };
          }
          
          function getImgAltStatus(total, withAlt) {
            if (total === 0) return { color: 'success', width: 100, message: '(No images)' };
            const percentage = total > 0 ? (withAlt / total) * 100 : 0;
            if (percentage === 100) return { color: 'success', width: 100, message: '(All have alt text)' };
            if (percentage >= 80) return { color: 'warning', width: 75, message: '(Most have alt text)' };
            return { color: 'danger', width: 40, message: '(Many missing alt text)' };
          }
          
          function getSslStatus(isSecure) {
            return isSecure 
              ? { color: 'success', width: 100, message: '(Secure)' }
              : { color: 'danger', width: 25, message: '(Not secure)' };
          }
          
          function getPerfColor(score) {
            if (!score) return 'secondary';
            if (score >= 0.9) return 'success';
            if (score >= 0.5) return 'warning';
            return 'danger';
          }
          
          function formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.round(seconds % 60);
            return mins + ':' + (secs < 10 ? '0' : '') + secs;
          }
          
          // Set up the form submission
          document.addEventListener('DOMContentLoaded', function() {
            const form = document.getElementById('analyze-form');
            if (form) {
              form.addEventListener('submit', function(e) {
                e.preventDefault();
                const url = document.getElementById('url-input').value;
                if (url) {
                  analyzeSEO(url);
                }
              });
            }
          });
        </script>
      </body>
      </html>
    `,
  };
};

// Helper function to parse cookies
function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const name = parts.shift().trim();
    const value = decodeURIComponent(parts.join('='));
    cookies[name] = value;
  });
  
  return cookies;
}
