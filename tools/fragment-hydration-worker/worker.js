/* eslint-disable no-unused-vars */
/**
 * Generic Edge Worker for Fragment Hydration
 *
 * This worker intercepts HTML responses and hydrates fragment links by:
 * 1. Finding all links with /fragments/ in their path
 * 2. Fetching the fragment content using .plain.html
 * 3. Replacing the link with the actual HTML content
 *
 * Compatible with:
 * - Cloudflare Workers
 * - AWS Lambda@Edge / CloudFront Functions (with adapter)
 * - Fastly Compute@Edge (with adapter)
 * - Vercel Edge Functions (with adapter)
 */

// Configuration
const CONFIG = {
  fragmentPath: '/fragments/',
  fragmentSuffix: '.plain.html',
  maxConcurrentFetches: 10,
  fetchTimeout: 5000, // 5 seconds
  enableCache: true,
  cacheTTL: 3600, // 1 hour
};

/**
 * Find all fragment links in HTML
 * @param {string} html - The HTML content
 * @returns {Array<{url: string, fullMatch: string}>} Array of fragment links
 */
function findFragmentLinks(html) {
  const linkPattern = /<a[^>]*href=["']([^"']*\/fragments\/[^"']*)["'][^>]*>(.*?)<\/a>/gi;

  const matches = Array.from(html.matchAll(linkPattern));
  return matches.map((match) => ({
    url: match[1],
    fullMatch: match[0],
    linkText: match[2],
  }));
}

/**
 * Fetch fragment content with timeout and error handling
 * @param {string} fragmentUrl - The fragment URL
 * @param {string} baseUrl - The base URL for resolving relative paths
 * @returns {Promise<string|null>} The fragment HTML or null on error
 */
async function fetchFragment(fragmentUrl, baseUrl) {
  try {
    // Resolve relative URLs
    const absoluteUrl = new URL(fragmentUrl, baseUrl).toString();

    // Convert to .plain.html if not already
    let plainUrl = absoluteUrl;
    if (!plainUrl.endsWith('.plain.html')) {
      // Remove any existing extension
      plainUrl = plainUrl.replace(/\.(html?)$/, '');
      plainUrl += CONFIG.fragmentSuffix;
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.fetchTimeout);

    // Fetch the fragment
    const response = await fetch(plainUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Fragment-Hydration-Worker/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.warn(`Failed to fetch fragment: ${plainUrl} (${response.status})`);
      return null;
    }

    const html = await response.text();
    return html.trim();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error fetching fragment ${fragmentUrl}:`, error.message);
    return null;
  }
}

/**
 * Hydrate all fragments in HTML
 * @param {string} html - The original HTML
 * @param {string} baseUrl - The base URL for resolving relative paths
 * @returns {Promise<string>} The hydrated HTML
 */
async function hydrateFragments(html, baseUrl) {
  // Find all fragment links
  const fragments = findFragmentLinks(html);

  if (fragments.length === 0) {
    return html;
  }

  // eslint-disable-next-line no-console
  console.log(`Found ${fragments.length} fragment link(s) to hydrate`);

  // Fetch fragments in batches to avoid overwhelming the origin
  const fragmentContents = new Map();

  // eslint-disable-next-line no-await-in-loop
  for (let i = 0; i < fragments.length; i += CONFIG.maxConcurrentFetches) {
    const batch = fragments.slice(i, i + CONFIG.maxConcurrentFetches);
    const promises = batch.map(async (fragment) => {
      const content = await fetchFragment(fragment.url, baseUrl);
      return { fragment, content };
    });

    // eslint-disable-next-line no-await-in-loop
    const results = await Promise.all(promises);
    results.forEach(({ fragment, content }) => {
      if (content) {
        fragmentContents.set(fragment.fullMatch, content);
      }
    });
  }

  // Replace fragment links with their content
  let hydratedHtml = html;
  fragmentContents.forEach((fragmentContent, linkHtml) => {
    // Wrap fragment content in a container for styling/identification
    const wrappedContent = `<div class="fragment-hydrated" data-fragment-hydrated="true">${fragmentContent}</div>`;
    hydratedHtml = hydratedHtml.replace(linkHtml, wrappedContent);
  });

  // eslint-disable-next-line no-console
  console.log(`Successfully hydrated ${fragmentContents.size} fragment(s)`);

  return hydratedHtml;
}

/**
 * Main request handler
 * @param {Request} request - The incoming request
 * @param {Object} env - Environment variables (Cloudflare specific, optional)
 * @param {Object} ctx - Execution context (Cloudflare specific, optional)
 * @returns {Promise<Response>} The modified response
 */
async function handleRequest(request, env = {}, ctx = {}) {
  try {
    // Fetch the origin response
    const response = await fetch(request);

    // Only process HTML responses
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return response;
    }

    // Only process successful responses
    if (!response.ok) {
      return response;
    }

    // Get the HTML content
    const html = await response.text();

    // Hydrate fragments
    const hydratedHtml = await hydrateFragments(html, request.url);

    // Create new response with hydrated HTML
    const newResponse = new Response(hydratedHtml, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers),
    });

    // Add custom header to indicate processing
    newResponse.headers.set('X-Fragment-Hydration', 'processed');

    return newResponse;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in fragment hydration:', error);
    // Return original response on error
    return fetch(request);
  }
}

// ============================================================================
// Platform-specific exports and adapters
// ============================================================================

// Cloudflare Workers
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env, ctx);
  },
};

// Alternative named export for other platforms
export { handleRequest };

// AWS Lambda@Edge adapter
export const handler = async (event) => {
  const { request } = event.Records[0].cf;
  const url = `https://${request.headers.host[0].value}${request.uri}`;

  const webRequest = new Request(url, {
    method: request.method,
    headers: Object.fromEntries(
      Object.entries(request.headers).map(([k, v]) => [k, v[0].value]),
    ),
  });

  const response = await handleRequest(webRequest);

  return {
    status: response.status,
    statusDescription: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    body: await response.text(),
  };
};
