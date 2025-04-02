exports.handler = async (event, context) => {
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
        <link rel="stylesheet" href="/css/style.css">
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
              </ul>
            </div>
          </div>
        </nav>

        <div class="container mt-4">
          <h1>SEO Dashboard</h1>
          
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
          
          <div id="dashboard-placeholder" class="text-center my-5">
            <p>Enter a URL above to analyze its SEO performance.</p>
          </div>
        </div>

        <footer class="footer mt-5 py-3 bg-light">
          <div class="container text-center">
            <span class="text-muted">Your SEO Dashboard &copy; 2025</span>
          </div>
        </footer>

        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
        <script>
          // Simple placeholder functionality
          document.getElementById('analyze-form').addEventListener('submit', function(e) {
            e.preventDefault();
            const url = document.getElementById('url-input').value;
            document.getElementById('dashboard-placeholder').innerHTML = 
              '<div class="alert alert-info">Analyzing ' + url + '... This is a demo version. Integration with real APIs would be implemented in a production version.</div>';
          });
        </script>
      </body>
      </html>
    `,
  };
};
