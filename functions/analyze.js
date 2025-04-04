// functions/analyze.js
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
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
    
    // Extract domain from URL
    const domain = new URL(url).hostname;
    
    // Perform basic SEO checks
    const seoChecks = await performBasicSEOChecks(url);
    
    // Get mobile-friendliness from Google PageSpeed API (no auth required)
    let pageSpeedData = {};
    try {
      const pagespeedUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile`;
      const pagespeedResponse = await fetch(pagespeedUrl);
      pageSpeedData = await pagespeedResponse.json();
    } catch (e) {
      console.log('PageSpeed API error:', e);
      pageSpeedData = { error: 'Could not fetch PageSpeed data' };
    }
    
    // Process PageSpeed data
    const performanceData = processPageSpeedData(pageSpeedData);
    
    // Mock search performance data
    // In a real implementation, this would come from Google Search Console API
    const searchPerformance = generateMockSearchData(url, domain);
    
    // Return all data
    return {
      statusCode: 200,
      body: JSON.stringify({
        url,
        domain,
        seoChecks,
        performanceData,
        searchConsole: searchPerformance,
        analysisDate: new Date().toISOString()
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

// Perform basic SEO checks
async function performBasicSEOChecks(url) {
  try {
    // Fetch the website HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEODashboard/1.0; +https://seo-dashboard-raquel.netlify.app)'
      }
    });
    const html = await response.text();
    
    // Check title
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : null;
    
    // Check meta description
    const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i) || 
                             html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
    const description = descriptionMatch ? descriptionMatch[1].trim() : null;
    
    // Check H1 tags
    const h1Matches = html.match(/<h1[^>]*>(.*?)<\/h1>/gi);
    const h1Count = h1Matches ? h1Matches.length : 0;
    
    // Extract H1 content
    let h1Content = [];
    if (h1Matches) {
      h1Content = h1Matches.map(h => h.replace(/<\/?[^>]+(>|$)/g, "").trim());
    }
    
    // Check images and alt text
    const imgMatches = html.match(/<img[^>]*>/gi) || [];
    const imgCount = imgMatches.length;
    
    // Count images with alt text
    const imgWithAltCount = imgMatches.filter(img => img.match(/alt=["'][^"']*["']/i)).length;
    
    // Check canonical URL
    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["'][^>]*>/i) ||
                          html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']canonical["'][^>]*>/i);
    const canonicalUrl = canonicalMatch ? canonicalMatch[1] : null;
    
    // Check meta robots
    const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
                        html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']robots["'][^>]*>/i);
    const robotsMeta = robotsMatch ? robotsMatch[1] : "index, follow"; // Default if not specified
    
    // Check heading structure
    const h2Count = (html.match(/<h2[^>]*>.*?<\/h2>/gi) || []).length;
    const h3Count = (html.match(/<h3[^>]*>.*?<\/h3>/gi) || []).length;
    
    // Check for schema markup
    const hasSchemaMarkup = html.includes('application/ld+json') || 
                            html.includes('itemtype="http://schema.org/') ||
                            html.includes('itemtype="https://schema.org/');
    
    // Check for social meta tags
    const hasOpenGraph = html.includes('property="og:') || html.includes('property=\'og:');
    const hasTwitterCards = html.includes('name="twitter:') || html.includes('name=\'twitter:');
    
    // Check page size
    const pageSize = html.length;
    const pageSizeKB = Math.round(pageSize / 1024);
    
    // Return all checks
    return {
      title,
      titleLength: title ? title.length : 0,
      description,
      descriptionLength: description ? description.length : 0,
      h1Tags: h1Content,
      h1Count,
      h2Count,
      h3Count,
      headingStructure: {
        h1: h1Count,
        h2: h2Count,
        h3: h3Count
      },
      imgCount,
      imgWithAlt: imgWithAltCount,
      imgWithoutAlt: imgCount - imgWithAltCount,
      canonicalUrl,
      robotsMeta,
      hasSchemaMarkup,
      socialTags: {
        openGraph: hasOpenGraph,
        twitterCards: hasTwitterCards
      },
      sslSecure: url.startsWith('https://'),
      pageSize: pageSizeKB + ' KB',
      checks: {
        title: getTitleStatus(title),
        description: getDescriptionStatus(description),
        h1: getH1Status(h1Count),
        imgAlt: getImgAltStatus(imgCount, imgWithAltCount),
        ssl: getSslStatus(url.startsWith('https://')),
        canonical: !!canonicalUrl,
        schema: hasSchemaMarkup,
        socialTags: hasOpenGraph || hasTwitterCards
      }
    };
  } catch (error) {
    console.error('Error performing SEO checks:', error);
    return { error: error.message };
  }
}

// Process PageSpeed data
function processPageSpeedData(data) {
  if (data.error) {
    return { error: data.error };
  }
  
  try {
    // Extract key metrics if available
    const metrics = data.lighthouseResult?.audits || {};
    
    return {
      performance: data.lighthouseResult?.categories?.performance?.score || null,
      firstContentfulPaint: metrics['first-contentful-paint']?.displayValue || 'n/a',
      speedIndex: metrics['speed-index']?.displayValue || 'n/a',
      largestContentfulPaint: metrics['largest-contentful-paint']?.displayValue || 'n/a',
      timeToInteractive: metrics['interactive']?.displayValue || 'n/a',
      totalBlockingTime: metrics['total-blocking-time']?.displayValue || 'n/a',
      cumulativeLayoutShift: metrics['cumulative-layout-shift']?.displayValue || 'n/a',
      mobileFriendly: !metrics['viewport']?.score || metrics['viewport']?.score === 1,
      passed: {
        viewport: metrics['viewport']?.score === 1,
        https: metrics['is-on-https']?.score === 1,
        robotsTxt: metrics['robots-txt']?.score === 1,
        legibleFontSizes: metrics['font-size']?.score === 1
      }
    };
  } catch (e) {
    console.error('Error processing PageSpeed data:', e);
    return { error: 'Failed to process performance data' };
  }
}

// Generate mock search data to simulate Search Console
function generateMockSearchData(url, domain) {
  // Create realistic but mock data
  const currentDate = new Date();
  const startDate = new Date();
  startDate.setDate(currentDate.getDate() - 28);
  
  // Common search queries based on website type
  const queries = [
    domain.replace('www.', '') + ' reviews',
    'how to ' + domain.split('.')[0],
    domain.split('.')[0] + ' vs competitors',
    'best ' + domain.split('.')[0] + ' services',
    domain.split('.')[0] + ' discount',
    domain.split('.')[0] + ' pricing',
    'is ' + domain.split('.')[0] + ' worth it',
    domain.split('.')[0] + ' alternatives',
    'how does ' + domain.split('.')[0] + ' work',
    domain.split('.')[0] + ' customer service'
  ];
  
  // Generate random but plausible performance data for each query
  const rows = queries.map(query => {
    const impressions = Math.floor(Math.random() * 1000) + 100;
    const ctr = Math.random() * 0.1 + 0.01; // CTR between 1-11%
    const clicks = Math.floor(impressions * ctr);
    const position = Math.random() * 15 + 1; // Position between 1-16
    
    return {
      keys: [query, url, 'MOBILE', 'us'],
      clicks,
      impressions,
      ctr,
      position
    };
  });
  
  // Sort by clicks (highest first)
  rows.sort((a, b) => b.clicks - a.clicks);
  
  // Generate day-by-day data for the main domain query
  const dailyData = [];
  for (let i = 0; i < 28; i++) {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + i);
    
    // Generate some trend with randomness
    const dayFactor = 1 + (i / 28) * 0.5; // Gradual improvement over time
    const randomFactor = 0.8 + Math.random() * 0.4; // Random variation
    
    const impressions = Math.floor(150 * dayFactor * randomFactor);
    const ctr = (0.05 + (i / 28) * 0.02) * randomFactor; // Gradually improving CTR
    const clicks = Math.floor(impressions * ctr);
    const position = 8 - (i / 28) * 3 * randomFactor; // Gradually improving position
    
    dailyData.push({
      date: day.toISOString().split('T')[0],
      clicks,
      impressions,
      ctr,
      position
    });
  }
  
  // Calculate totals
  const totalClicks = rows.reduce((sum, row) => sum + row.clicks, 0);
  const totalImpressions = rows.reduce((sum, row) => sum + row.impressions, 0);
  const averageCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const averagePosition = rows.reduce((sum, row) => sum + row.position, 0) / rows.length;
  
  return {
    siteUrl: url.startsWith('http') ? url : 'https://' + url,
    data: {
      rows,
      dailyData,
      totals: {
        clicks: totalClicks,
        impressions: totalImpressions,
        ctr: averageCtr,
        position: averagePosition
      }
    }
  };
}

// Helper functions to evaluate SEO elements
function getTitleStatus(title) {
  if (!title) return { status: 'error', message: 'Missing title tag' };
  if (title.length < 30) return { status: 'warning', message: 'Title too short (less than 30 characters)' };
  if (title.length > 60) return { status: 'warning', message: 'Title too long (more than 60 characters)' };
  return { status: 'good', message: 'Title length is optimal' };
}

function getDescriptionStatus(description) {
  if (!description) return { status: 'error', message: 'Missing meta description' };
  if (description.length < 50) return { status: 'warning', message: 'Description too short (less than 50 characters)' };
  if (description.length > 160) return { status: 'warning', message: 'Description too long (more than 160 characters)' };
  return { status: 'good', message: 'Description length is optimal' };
}

function getH1Status(count) {
  if (count === 0) return { status: 'error', message: 'Missing H1 tag' };
  if (count > 1) return { status: 'warning', message: 'Multiple H1 tags (recommended to have just one)' };
  return { status: 'good', message: 'H1 tag is properly used' };
}

function getImgAltStatus(total, withAlt) {
  if (total === 0) return { status: 'good', message: 'No images on page' };
  if (withAlt === total) return { status: 'good', message: 'All images have alt text' };
  if (withAlt / total >= 0.8) return { status: 'warning', message: 'Most images have alt text' };
  return { status: 'error', message: 'Many images missing alt text' };
}

function getSslStatus(isSecure) {
  return isSecure 
    ? { status: 'good', message: 'Site is secure (HTTPS)' }
    : { status: 'error', message: 'Site is not secure (HTTP)' };
}
