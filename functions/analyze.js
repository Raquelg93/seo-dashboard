// functions/analyze.js
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const fetch = require('node-fetch');
const cheerio = require('cheerio');

// Initialize OAuth2 client
const oauth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.REDIRECT_URI
);

// Main function handler
exports.handler = async function (event, context) {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        // Parse request body
        const payload = JSON.parse(event.body);
        const { url } = payload;

        if (!url) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'URL is required' })
            };
        }

        // Check for token in cookies or headers
        const token = getTokenFromRequest(event);

        if (!token) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Authentication required' })
            };
        }

        // Set token for API calls
        oauth2Client.setCredentials(token);

        // Get the domain from URL
        const domain = new URL(url).hostname;

        // Fetch data in parallel
        const [searchConsoleData, analyticsData, seoChecks] = await Promise.all([
            getSearchConsoleData(domain, oauth2Client),
            getAnalyticsData(domain, oauth2Client),
            performSeoChecks(url)
        ]);

        // Return combined results
        return {
            statusCode: 200,
            body: JSON.stringify({
                url,
                domain,
                searchConsole: searchConsoleData,
                analytics: analyticsData,
                seoChecks
            })
        };

    } catch (error) {
        console.error('Error in analyze function:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

// Helper function to get token from request
function getTokenFromRequest(event) {
    // In a real implementation, you would securely retrieve the token
    // from cookies, headers, or a database

    // For demo purposes, return a placeholder token
    // In production, this should be properly implemented
    return {
        access_token: 'demo_token',
        refresh_token: 'demo_refresh_token',
        token_type: 'Bearer',
        expiry_date: Date.now() + 3600000
    };
}

// Helper function to get Search Console data
async function getSearchConsoleData(domain, auth) {
    try {
        // In a real implementation, this would call the Search Console API
        // Since we can't make actual API calls in this demo, return sample data

        return {
            siteUrl: `https://${domain}`,
            data: {
                rows: generateSampleSearchConsoleData()
            }
        };
    } catch (error) {
        console.error('Error fetching Search Console data:', error);
        return { error: error.message };
    }
}

// Helper function to get Analytics data
async function getAnalyticsData(domain, auth) {
    try {
        // In a real implementation, this would call the Google Analytics API
        // Since we can't make actual API calls in this demo, return sample data

        return {
            accountId: 'sample-account',
            propertyId: 'sample-property',
            viewId: 'sample-view',
            data: {
                rows: generateSampleAnalyticsData()
            }
        };
    } catch (error) {
        console.error('Error fetching Analytics data:', error);
        return { error: error.message };
    }
}

// Helper function to perform SEO checks
async function performSeoChecks(url) {
    try {
        // Fetch the page
        const response = await fetch(url);
        const html = await response.text();

        // Parse HTML with cheerio
        const $ = cheerio.load(html);

        // Extract SEO elements
        const title = $('title').text();
        const description = $('meta[name="description"]').attr('content') || '';
        const h1Elements = $('h1');
        const imgElements = $('img');
        const imgWithAlt = $('img[alt]');

        // Check basic SEO factors
        return {
            title,
            titleLength: title.length,
            description,
            descriptionLength: description.length,
            h1Tags: h1Elements.map((i, el) => $(el).text()).get(),
            h1Count: h1Elements.length,
            imgTotal: imgElements.length,
            imgWithoutAlt: imgElements.length - imgWithAlt.length,
            sslSecure: url.startsWith('https://'),
            // These would be from Lighthouse in a real implementation
            pageSpeed: {
                performance: Math.random() * 0.3 + 0.7, // Random score between 0.7-1.0
                accessibility: Math.random() * 0.2 + 0.8, // Random score between 0.8-1.0
                bestPractices: Math.random() * 0.2 + 0.8, // Random score between 0.8-1.0
                seo: Math.random() * 0.1 + 0.9 // Random score between 0.9-1.0
            }
        };
    } catch (error) {
        console.error('Error performing SEO checks:', error);
        return { error: error.message };
    }
}

// Helper function to generate sample Search Console data
function generateSampleSearchConsoleData() {
    const keywords = [
        'sample keyword 1',
        'sample keyword 2',
        'sample keyword 3',
        'sample keyword 4',
        'sample keyword 5'
    ];

    const pages = [
        '/home',
        '/about',
        '/services',
        '/blog',
        '/contact'
    ];

    const devices = ['DESKTOP', 'MOBILE', 'TABLET'];
    const countries = ['us', 'ca', 'uk', 'au', 'de'];

    const rows = [];

    // Generate sample data
    for (let i = 0; i < 20; i++) {
        const keyword = keywords[Math.floor(Math.random() * keywords.length)];
        const page = pages[Math.floor(Math.random() * pages.length)];
        const device = devices[Math.floor(Math.random() * devices.length)];
        const country = countries[Math.floor(Math.random() * countries.length)];

        const clicks = Math.floor(Math.random() * 100);
        const impressions = clicks * (Math.floor(Math.random() * 10) + 5);
        const ctr = (clicks / impressions) * 100;
        const position = Math.random() * 10 + 1;

        rows.push({
            keys: [keyword, page, device, country],
            clicks,
            impressions,
            ctr,
            position
        });
    }

    return rows;
}

// Helper function to generate sample Analytics data
function generateSampleAnalyticsData() {
    const rows = [];
    const sources = ['google', 'bing', 'yahoo', 'duckduckgo'];

    // Generate 14 days of data
    for (let i = 0; i < 14; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0].replace(/-/g, '');

        for (const source of sources) {
            const sessions = Math.floor(Math.random() * 100);
            const users = Math.floor(sessions * 0.9);
            const pageviews = Math.floor(sessions * (Math.random() + 2));
            const bounceRate = (Math.random() * 50 + 30).toFixed(2);
            const avgSessionDuration = Math.floor(Math.random() * 180 + 60);

            rows.push([
                dateString,
                source,
                'organic',
                sessions.toString(),
                users.toString(),
                pageviews.toString(),
                bounceRate,
                avgSessionDuration.toString()
            ]);
        }
    }

    return rows;
}