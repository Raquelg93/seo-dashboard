document.addEventListener('DOMContentLoaded', function () {
    // Initialize variables for charts
    let searchPerformanceChart = null;
    let deviceChart = null;

    // Form submission event
    document.getElementById('analyze-form').addEventListener('submit', function (e) {
        e.preventDefault();

        const urlInput = document.getElementById('url-input');
        const url = urlInput.value.trim();

        if (!url) {
            showError('Please enter a valid URL');
            return;
        }

        analyzeWebsite(url);
    });

    // Function to analyze website
    async function analyzeWebsite(url) {
        // Show loading, hide content and errors
        document.getElementById('loading').classList.remove('d-none');
        document.getElementById('dashboard-content').classList.add('d-none');
        document.getElementById('error-message').classList.add('d-none');

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to analyze website');
            }

            // Process and display the data
            displayDashboardData(data);

            // Hide loading, show content
            document.getElementById('loading').classList.add('d-none');
            document.getElementById('dashboard-content').classList.remove('d-none');

        } catch (error) {
            // Hide loading, show error
            document.getElementById('loading').classList.add('d-none');
            showError(error.message);
        }
    }

    // Function to display dashboard data
    function displayDashboardData(data) {
        // Display overview stats
        displayOverviewStats(data);

        // Display search performance chart
        displaySearchPerformanceChart(data);

        // Display top queries table
        displayTopQueries(data);

        // Display device breakdown
        displayDeviceBreakdown(data);

        // Display SEO health check
        displaySeoHealthCheck(data);
    }

    // Function to display overview stats
    function displayOverviewStats(data) {
        const overviewElement = document.getElementById('overview-stats');
        overviewElement.innerHTML = '';

        // Create stats cards
        const stats = [
            {
                title: 'Total Clicks',
                value: getTotalClicks(data),
                change: '+5.2%' // Placeholder - would be calculated in real implementation
            },
            {
                title: 'Total Impressions',
                value: getTotalImpressions(data),
                change: '+12.8%'
            },
            {
                title: 'Average CTR',
                value: getAverageCtr(data) + '%',
                change: '-0.3%'
            },
            {
                title: 'Average Position',
                value: getAveragePosition(data),
                change: '+0.8'
            }
        ];

        stats.forEach(stat => {
            const colDiv = document.createElement('div');
            colDiv.className = 'col-md-3 col-sm-6';

            const changeClass = stat.change.startsWith('+') ? 'positive-change' : 'negative-change';

            colDiv.innerHTML = `
          <div class="stat-card">
            <div class="stat-card-title">${stat.title}</div>
            <div class="stat-card-value">${stat.value}</div>
            <div class="stat-card-change ${changeClass}">${stat.change}</div>
          </div>
        `;

            overviewElement.appendChild(colDiv);
        });
    }

    // Function to display search performance chart
    function displaySearchPerformanceChart(data) {
        const ctx = document.getElementById('search-performance-chart').getContext('2d');

        // Destroy previous chart if exists
        if (searchPerformanceChart) {
            searchPerformanceChart.destroy();
        }

        // Use sample data for the chart (would be replaced with actual data)
        // In a real implementation, we'd process data.searchConsole.data
        const dates = getLast14Days();
        const clicks = generateRandomData(14, 50, 200);
        const impressions = generateRandomData(14, 500, 2000);

        searchPerformanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'Clicks',
                        data: clicks,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 2,
                        tension: 0.1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Impressions',
                        data: impressions,
                        borderColor: '#2ecc71',
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        borderWidth: 2,
                        tension: 0.1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Clicks'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Impressions'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
    }

    // Function to display top queries table
    function displayTopQueries(data) {
        const tableBody = document.getElementById('queries-table');
        tableBody.innerHTML = '';

        // Use sample data for the table (would be replaced with actual data)
        // In a real implementation, we'd process data.searchConsole.data
        const sampleQueries = [
            { query: 'sample keyword 1', clicks: 124, impressions: 1250, ctr: 9.92, position: 3.2 },
            { query: 'sample keyword 2', clicks: 98, impressions: 980, ctr: 10.00, position: 4.5 },
            { query: 'sample keyword 3', clicks: 76, impressions: 850, ctr: 8.94, position: 5.1 },
            { query: 'sample keyword 4', clicks: 65, impressions: 720, ctr: 9.03, position: 6.3 },
            { query: 'sample keyword 5', clicks: 54, impressions: 610, ctr: 8.85, position: 7.8 }
        ];

        sampleQueries.forEach(item => {
            const row = document.createElement('tr');

            row.innerHTML = `
          <td>${item.query}</td>
          <td>${item.clicks}</td>
          <td>${item.impressions}</td>
          <td>${item.ctr.toFixed(2)}%</td>
          <td>${item.position.toFixed(1)}</td>
        `;

            tableBody.appendChild(row);
        });
    }

    // Function to display device breakdown
    function displayDeviceBreakdown(data) {
        const ctx = document.getElementById('device-chart').getContext('2d');

        // Destroy previous chart if exists
        if (deviceChart) {
            deviceChart.destroy();
        }

        // Sample data (would be replaced with actual data)
        const deviceData = {
            labels: ['Desktop', 'Mobile', 'Tablet'],
            datasets: [{
                label: 'Clicks by Device',
                data: [65, 30, 5],
                backgroundColor: [
                    'rgba(52, 152, 219, 0.7)',
                    'rgba(46, 204, 113, 0.7)',
                    'rgba(155, 89, 182, 0.7)'
                ],
                borderColor: [
                    'rgba(52, 152, 219, 1)',
                    'rgba(46, 204, 113, 1)',
                    'rgba(155, 89, 182, 1)'
                ],
                borderWidth: 1
            }]
        };

        deviceChart = new Chart(ctx, {
            type: 'doughnut',
            data: deviceData,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                    }
                }
            }
        });
    }

    // Function to display SEO health check
    function displaySeoHealthCheck(data) {
        const seoElement = document.getElementById('seo-checklist');
        seoElement.innerHTML = '';

        // Use SEO checks from data or fallback to sample data
        const seoChecks = data.seoChecks || {
            title: 'Sample Page Title',
            titleLength: 25,
            description: 'This is a sample meta description for demonstration purposes.',
            descriptionLength: 65,
            h1Count: 1,
            imgTotal: 12,
            imgWithoutAlt: 3,
            sslSecure: true,
            pageSpeed: {
                performance: 0.78,
                accessibility: 0.92,
                bestPractices: 0.85,
                seo: 0.90
            }
        };

        // Create SEO check items
        const checks = [
            {
                label: 'Title',
                value: seoChecks.title,
                subtext: `Length: ${seoChecks.titleLength} characters`,
                status: getSeoStatus(seoChecks.titleLength, 30, 60),
                score: getSeoScore(seoChecks.titleLength, 30, 60)
            },
            {
                label: 'Meta Description',
                value: seoChecks.description,
                subtext: `Length: ${seoChecks.descriptionLength} characters`,
                status: getSeoStatus(seoChecks.descriptionLength, 50, 160),
                score: getSeoScore(seoChecks.descriptionLength, 50, 160)
            },
            {
                label: 'Heading Structure',
                value: `${seoChecks.h1Count} H1 tag(s)`,
                subtext: 'Best practice: One H1 tag per page',
                status: seoChecks.h1Count === 1 ? 'good' : 'warning',
                score: seoChecks.h1Count === 1 ? 100 : 70
            },
            {
                label: 'Image Optimization',
                value: `${seoChecks.imgTotal - seoChecks.imgWithoutAlt}/${seoChecks.imgTotal} images have alt text`,
                subtext: 'Best practice: All images should have alt text',
                status: seoChecks.imgWithoutAlt === 0 ? 'good' : 'warning',
                score: Math.round(((seoChecks.imgTotal - seoChecks.imgWithoutAlt) / seoChecks.imgTotal) * 100)
            },
            {
                label: 'SSL Security',
                value: seoChecks.sslSecure ? 'Secure (HTTPS)' : 'Not Secure (HTTP)',
                subtext: 'Best practice: Use HTTPS for security',
                status: seoChecks.sslSecure ? 'good' : 'bad',
                score: seoChecks.sslSecure ? 100 : 0
            },
            {
                label: 'Performance Score',
                value: `${Math.round(seoChecks.pageSpeed.performance * 100)}/100`,
                subtext: 'Based on Lighthouse performance metrics',
                status: getSeoStatus(seoChecks.pageSpeed.performance, 0.5, 0.9),
                score: Math.round(seoChecks.pageSpeed.performance * 100)
            },
            {
                label: 'SEO Score',
                value: `${Math.round(seoChecks.pageSpeed.seo * 100)}/100`,
                subtext: 'Based on Lighthouse SEO metrics',
                status: getSeoStatus(seoChecks.pageSpeed.seo, 0.7, 0.9),
                score: Math.round(seoChecks.pageSpeed.seo * 100)
            }
        ];

        checks.forEach(check => {
            const checkItem = document.createElement('div');
            checkItem.className = 'seo-check-item';

            checkItem.innerHTML = `
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="seo-check-label">${check.label}</span>
            <span class="seo-check-value">${check.value}</span>
          </div>
          <div class="text-muted small mb-2">${check.subtext}</div>
          <div class="progress">
            <div class="progress-bar progress-${check.status}" 
                 role="progressbar" 
                 style="width: ${check.score}%" 
                 aria-valuenow="${check.score}" 
                 aria-valuemin="0" 
                 aria-valuemax="100"></div>
          </div>
        `;

            seoElement.appendChild(checkItem);
        });
    }

    // Helper function to show error messages
    function showError(message) {
        const errorElement = document.getElementById('error-message');
        errorElement.textContent = message;
        errorElement.classList.remove('d-none');
    }

    // Helper function to get SEO status (good, warning, bad)
    function getSeoStatus(value, min, max) {
        if (value >= max) return 'good';
        if (value >= min) return 'warning';
        return 'bad';
    }

    // Helper function to get SEO score (0-100)
    function getSeoScore(value, min, max) {
        if (value < min) return Math.round((value / min) * 70);
        if (value > max) return 100;
        return Math.round(70 + ((value - min) / (max - min)) * 30);
    }

    // Helper function to get total clicks
    function getTotalClicks(data) {
        // In a real implementation, calculate from data.searchConsole
        return 417; // Sample value
    }

    // Helper function to get total impressions
    function getTotalImpressions(data) {
        // In a real implementation, calculate from data.searchConsole
        return 4410; // Sample value
    }

    // Helper function to get average CTR
    function getAverageCtr(data) {
        // In a real implementation, calculate from data.searchConsole
        return 9.46; // Sample value
    }

    // Helper function to get average position
    function getAveragePosition(data) {
        // In a real implementation, calculate from data.searchConsole
        return 5.3; // Sample value
    }

    // Helper function to get last 14 days as labels
    function getLast14Days() {
        const dates = [];
        for (let i = 13; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
        return dates;
    }

    // Helper function to generate random data
    function generateRandomData(length, min, max) {
        return Array.from({ length }, () => Math.floor(Math.random() * (max - min + 1)) + min);
    }
});