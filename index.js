// index.js - Main application file for SEO Dashboard

// Import necessary packages
const express = require('express');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Set up middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Google API credentials
const credentials = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI || `http://localhost:${port}/auth/callback`
};

// Initialize OAuth client
const oauth2Client = new OAuth2(
    credentials.clientId,
    credentials.clientSecret,
    credentials.redirectUri
);

// Define the required scopes
const scopes = [
    'https://www.googleapis.com/auth/webmasters.readonly',
    'https://www.googleapis.com/auth/analytics.readonly'
];

// Routes
app.get('/', (req, res) => {
    // Check if we have tokens in session
    const tokens = loadTokens();
    const isAuthenticated = tokens && tokens.access_token;

    res.render('index', {
        isAuthenticated: isAuthenticated,
        error: req.query.error || null
    });
});

// Start the OAuth flow
app.get('/auth', (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent' // Always ask for consent to ensure we get a refresh token
    });

    res.redirect(authUrl);
});

// OAuth callback
app.get('/auth/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.redirect('/?error=No authorization code received');
    }

    try {
        // Exchange the code for tokens
        const { tokens } = await oauth2Client.getToken(code);

        // Save tokens to file (in production, use a secure database)
        saveTokens(tokens);

        // Set credentials for future API calls
        oauth2Client.setCredentials(tokens);

        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error getting tokens:', error);
        res.redirect(`/?error=${encodeURIComponent(error.message)}`);
    }
});

// Dashboard page
app.get('/dashboard', (req, res) => {
    const tokens = loadTokens();

    if (!tokens || !tokens.access_token) {
        return res.redirect('/?error=Not authenticated');
    }

    // Set credentials for API calls
    oauth2Client.setCredentials(tokens);

    res.render('dashboard', {
        title: 'SEO Dashboard'
    });
});

// API endpoint to analyze a URL
app.post('/api/analyze', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const tokens = loadTokens();

        if (!tokens || !tokens.access_token) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        // Set credentials for API calls
        oauth2Client.setCredentials(tokens);

        // Get the domain from the URL
        const domain = new URL(url).hostname;

        // Fetch data from Search Console API
        const searchConsoleData = await getSearchConsoleData(domain);

        // Fetch data from Google Analytics (if connected)
        let analyticsData = null;
        try {
            analyticsData = await getAnalyticsData(domain);
        } catch (e) {
            console.log('Analytics data not available:', e.message);
        }

        // Perform additional SEO checks
        const seoChecks = await performSeoChecks(url);

        res.json({
            url,
            domain,
            searchConsole: searchConsoleData,
            analytics: analyticsData,
            seoChecks
        });
    } catch (error) {
        console.error('Error analyzing URL:', error);
        res.status(500).json({ error: error.message });
    }
});

// Helper function to get Search Console data
async function getSearchConsoleData(domain) {
    try {
        const webmasters = google.webmasters('v3');

        // Check if the site is verified
        const sites = await webmasters.sites.list({
            auth: oauth2Client
        });

        const siteUrl = sites.data.siteEntry.find(site =>
            site.siteUrl.includes(domain)
        )?.siteUrl;

        if (!siteUrl) {
            return {
                error: 'Site not found in Search Console',
                availableSites: sites.data.siteEntry.map(site => site.siteUrl)
            };
        }

        // Get search performance data
        const now = new Date();
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - 28); // Last 28 days

        const searchData = await webmasters.searchanalytics.query({
            auth: oauth2Client,
            siteUrl,
            requestBody: {
                startDate: startDate.toISOString().split('T')[0],
                endDate: now.toISOString().split('T')[0],
                dimensions: ['query', 'page', 'device', 'country'],
                rowLimit: 500
            }
        });

        return {
            siteUrl,
            data: searchData.data
        };
    } catch (error) {
        console.error('Error fetching Search Console data:', error);
        return { error: error.message };
    }
}

// Helper function to get Google Analytics data
async function getAnalyticsData(domain) {
    try {
        const analytics = google.analytics('v3');

        // Get list of accounts
        const accounts = await analytics.management.accounts.list({
            auth: oauth2Client
        });

        // Find the right account for the domain
        let accountId, propertyId, viewId;

        for (const account of accounts.data.items) {
            const properties = await analytics.management.webproperties.list({
                auth: oauth2Client,
                accountId: account.id
            });

            const property = properties.data.items.find(p =>
                p.websiteUrl && p.websiteUrl.includes(domain)
            );

            if (property) {
                accountId = account.id;
                propertyId = property.id;

                // Get the first view
                const views = await analytics.management.profiles.list({
                    auth: oauth2Client,
                    accountId,
                    webPropertyId: propertyId
                });

                if (views.data.items.length > 0) {
                    viewId = views.data.items[0].id;
                    break;
                }
            }
        }

        if (!viewId) {
            return {
                error: 'No Analytics view found for this domain',
                availableAccounts: accounts.data.items.map(a => a.name)
            };
        }

        // Get analytics data
        const now = new Date();
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - 28); // Last 28 days

        const report = await analytics.data.ga.get({
            auth: oauth2Client,
            'ids': `ga:${viewId}`,
            'start-date': startDate.toISOString().split('T')[0],
            'end-date': now.toISOString().split('T')[0],
            'metrics': 'ga:sessions,ga:users,ga:pageviews,ga:bounceRate,ga:avgSessionDuration',
            'dimensions': 'ga:source,ga:medium',
            'sort': '-ga:sessions',
            'filters': 'ga:medium==organic',
            'max-results': 50
        });

        return {
            accountId,
            propertyId,
            viewId,
            data: report.data
        };
    } catch (error) {
        console.error('Error fetching Analytics data:', error);
        return { error: error.message };
    }
}

// Helper function to perform basic SEO checks
async function performSeoChecks(url) {
    try {
        // Fetch the HTML of the page
        const response = await fetch(url);
        const html = await response.text();

        // Extract title
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : null;

        // Extract meta description
        const descriptionMatch = html.match(/<meta\s+name="description"\s+content="(.*?)"/i);
        const description = descriptionMatch ? descriptionMatch[1] : null;

        // Extract h1 tags
        const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/gi);
        const h1Tags = h1Match ? h1Match.map(h => h.replace(/<[^>]*>/g, '')) : [];

        // Count images without alt text
        const imgTotal = (html.match(/<img[^>]*>/gi) || []).length;
        const imgWithAltCount = (html.match(/<img[^>]*alt="[^"]+"/gi) || []).length;
        const imgWithoutAlt = imgTotal - imgWithAltCount;

        // Check basic performance metrics using Lighthouse API
        // Note: In a production app, you would typically use the Lighthouse API or a similar service

        return {
            title,
            titleLength: title ? title.length : 0,
            description,
            descriptionLength: description ? description.length : 0,
            h1Tags,
            h1Count: h1Tags.length,
            imgTotal,
            imgWithoutAlt,
            sslSecure: url.startsWith('https://'),
            // These are placeholder values - in a real app you'd use actual API data
            pageSpeed: {
                performance: 0.78,
                accessibility: 0.92,
                bestPractices: 0.85,
                seo: 0.90
            }
        };
    } catch (error) {
        console.error('Error performing SEO checks:', error);
        return { error: error.message };
    }
}

// Helper functions to save and load tokens
function saveTokens(tokens) {
    const tokenPath = path.join(__dirname, '.tokens.json');
    fs.writeFileSync(tokenPath, JSON.stringify(tokens));
}

function loadTokens() {
    const tokenPath = path.join(__dirname, '.tokens.json');

    if (fs.existsSync(tokenPath)) {
        const tokensString = fs.readFileSync(tokenPath, 'utf8');
        return JSON.parse(tokensString);
    }

    return null;
}

// Start the server
app.listen(port, () => {
    console.log(`SEO Dashboard app listening at http://localhost:${port}`);
});