const fetch = require('node-fetch');
const cookie = require('cookie');

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
    
    // Get the domain from URL
    const domain = new URL(url).hostname;
    
    // Get access token from cookie
    const cookies = cookie.parse(event.headers.cookie || '');
    const accessToken = cookies.token;
    
    if (!accessToken) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Authentication required. Please connect with Google first.' })
      };
    }
    
    // Fetch data in parallel
    const [searchConsoleData, analyticsData, seoChecks] = await Promise.all([
      getSearchConsoleData(url, domain, accessToken),
      getAnalyticsData(domain, accessToken),
      performBasicSEOChecks(url)
    ]);
    
    // Return all data
    return {
      statusCode: 200,
      body: JSON.stringify({
        url,
        domain,
        seoChecks,
        searchConsole: searchConsoleData,
        analytics: analyticsData,
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

// Function to get real Search Console data
async function getSearchConsoleData(url, domain, accessToken) {
  try {
    // First, get a list of sites in Search Console
    const sitesResponse = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const sitesData = await sitesResponse.json();
    
    if (sitesData.error) {
      throw new Error(sitesData.error.message || 'Failed to fetch sites');
    }
    
    // Find the site that matches our domain
    let siteUrl = '';
    
    if (sitesData.siteEntry) {
      const matchingSite = sitesData.siteEntry.find(site => {
        const siteUrlObj = new URL(site.siteUrl);
        return siteUrlObj.hostname === domain || 
               domain.endsWith('.' + siteUrlObj.hostname) || 
               siteUrlObj.hostname.endsWith('.' + domain);
      });
      
      if (matchingSite) {
        siteUrl = matchingSite.siteUrl;
      }
    }
    
    if (!siteUrl) {
      return {
        error: 'Site not found in Search Console',
        availableSites: sitesData.siteEntry ? sitesData.siteEntry.map(site => site.siteUrl) : []
      };
    }
    
    // Get search performance data for the last 28 days
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - 28);
    
    const queryData = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
      dimensions: ['query', 'page', 'device'],
      rowLimit: 100
    };
    
    const searchResponse = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(queryData)
    });
    
    const searchData = await searchResponse.json();
    
    if (searchData.error) {
      throw new Error(searchData.error.message || 'Failed to fetch search data');
    }
    
    return {
      siteUrl,
      data: searchData
    };
  } catch (error) {
    console.error('Search Console API error:', error);
    return { error: error.message };
  }
}

// Function to get real Analytics data
async function getAnalyticsData(domain, accessToken) {
  try {
    // First, get accounts list
    const accountsResponse = await fetch('https://www.googleapis.com/analytics/v3/management/accounts', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const accountsData = await accountsResponse.json();
    
    if (accountsData.error) {
      throw new Error(accountsData.error.message || 'Failed to fetch accounts');
    }
    
    // Process each account to find matching property
    let viewId = null;
    
    if (accountsData.items && accountsData.items.length > 0) {
      for (const account of accountsData.items) {
        // Get properties for this account
        const propertiesResponse = await fetch(`https://www.googleapis.com/analytics/v3/management/accounts/${account.id}/webproperties`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        const propertiesData = await propertiesResponse.json();
        
        if (propertiesData.error) continue;
        
        // Find a property that matches our domain
        const matchingProperty = propertiesData.items?.find(property => {
          return property.websiteUrl.includes(domain);
        });
        
        if (matchingProperty) {
          // Get views for this property
          const viewsResponse = await fetch(`https://www.googleapis.com/analytics/v3/management/accounts/${account.id}/webproperties/${matchingProperty.id}/profiles`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          
          const viewsData = await viewsResponse.json();
          
          if (viewsData.items && viewsData.items.length > 0) {
            viewId = viewsData.items[0].id;
            break;
          }
        }
      }
    }
    
    if (!viewId) {
      return {
        error: 'No matching Analytics view found',
        availableAccounts: accountsData.items || []
      };
    }
    
    // Now get the actual analytics data
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - 28);
    
    const analyticsResponse = await fetch(`https://www.googleapis.com/analytics/v3/data/ga?ids=ga:${viewId}&start-date=${startDate.toISOString().split('T')[0]}&end-date=${now.toISOString().split('T')[0]}&metrics=ga:sessions,ga:users,ga:pageviews,ga:bounceRate,ga:avgSessionDuration&dimensions=ga:medium&filters=ga:medium==organic`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const analyticsData = await analyticsResponse.json();
    
    if (analyticsData.error) {
      throw new Error(analyticsData.error.message || 'Failed to fetch analytics data');
    }
    
    return analyticsData;
  } catch (error) {
    console.error('Analytics API error:', error);
    return { error: error.message };
  }
}

// Your existing performBasicSEOChecks function
async function performBasicSEOChecks(url) {
  // Same implementation as before
  // ...
}
