# Fragment Hydration Worker

A generic edge worker that automatically hydrates AEM fragment links in HTML responses by fetching and embedding the actual fragment content.

## What It Does

This worker intercepts HTML responses from your origin and:

1. **Finds fragment links** - Locates all `<a>` tags with `/fragments/` in their path
2. **Fetches fragment content** - Retrieves the plain HTML for each fragment using `.plain.html`
3. **Replaces links with content** - Substitutes the link with the actual fragment HTML
4. **Returns hydrated HTML** - Delivers a fully hydrated page to the browser

### Example Transformation

**Before (from origin):**
```html
<div class="content-section">
  <h3>Featured Products</h3>
  <a href="/fragments/product-showcase">Product Showcase</a>
</div>
<div class="content">
  <p>This is regular page content that is not affected.</p>
</div>
<div class="content-section">
  <h3>What Our Customers Say</h3>
  <a href="/fragments/testimonials">Customer Testimonials</a>
</div>
```

**After (delivered to browser):**
```html
<div class="content-section">
  <h3>Featured Products</h3>
  <div class="fragment-hydrated" data-fragment-hydrated="true">
    <div class="product-showcase">
      <div class="product">...</div>
      <div class="product">...</div>
    </div>
  </div>
</div>
<div class="content">
  <p>This is regular page content that is not affected.</p>
</div>
<div class="content-section">
  <h3>What Our Customers Say</h3>
  <div class="fragment-hydrated" data-fragment-hydrated="true">
    <div class="testimonials">
      <blockquote>...</blockquote>
      <blockquote>...</blockquote>
    </div>
  </div>
</div>
```

## Features

- **Generic and portable** - Works with Cloudflare Workers, AWS Lambda@Edge, and other edge platforms
- **Performance optimized** - Parallel fragment fetching with configurable concurrency
- **Error resilient** - Gracefully handles fragment fetch failures
- **Timeout protection** - Prevents slow fragments from blocking page delivery
- **Zero client-side JavaScript** - All processing happens at the edge
- **Identification markers** - Hydrated fragments are wrapped with class and data attributes

## Configuration

Edit the `CONFIG` object in [worker.js](worker.js:15-22) to customize behavior:

```javascript
const CONFIG = {
  fragmentPath: '/fragments/',        // Path pattern to identify fragment links
  fragmentSuffix: '.plain.html',      // Suffix to append when fetching fragments
  maxConcurrentFetches: 10,           // Max parallel fragment fetches
  fetchTimeout: 5000,                 // Timeout in milliseconds
  enableCache: true,                  // Enable caching (future feature)
  cacheTTL: 3600,                     // Cache TTL in seconds
};
```

## Deployment

### Cloudflare Workers

1. **Install Wrangler CLI:**
   ```bash
   npm install -g wrangler
   ```

2. **Install dependencies:**
   ```bash
   cd tools/fragment-hydration-worker
   npm install
   ```

3. **Configure your domain:**
   Edit [wrangler.toml](wrangler.toml:6-9) and uncomment the routes section:
   ```toml
   routes = [
     { pattern = "your-domain.com/*", zone_name = "your-domain.com" }
   ]
   ```

4. **Test locally:**
   ```bash
   npm run dev
   ```
   Visit http://localhost:8787 to test

5. **Deploy to production:**
   ```bash
   npm run deploy
   ```

### AWS Lambda@Edge

1. **Create Lambda function:**
   - Use Node.js 18.x runtime
   - Copy the worker code
   - Use the `handler` export

2. **Attach to CloudFront:**
   - Add to CloudFront distribution
   - Trigger type: Origin Response
   - Include body: Yes

### Other Platforms

The worker uses standard Web APIs (`Request`, `Response`, `fetch`) and can be adapted for:

- **Vercel Edge Functions** - Export `handleRequest` as default
- **Fastly Compute@Edge** - Adapt the main handler
- **Akamai EdgeWorkers** - Use the handleRequest function
- **Deno Deploy** - Works with minimal changes

## Testing

### Run the test suite:
```bash
cd tools/fragment-hydration-worker
node test.js
```

### Manual testing:
1. Start the worker in dev mode: `npm run dev`
2. Create a test HTML page with fragment links
3. Fetch the page and verify fragments are hydrated

### Testing with curl:
```bash
# Test with a real page
curl http://localhost:8787/your-test-page

# Should see fragment content instead of links
```

## Performance Considerations

### Fragment Fetch Optimization

- **Parallel fetching** - Multiple fragments fetched concurrently
- **Batch processing** - Controlled by `maxConcurrentFetches`
- **Timeout protection** - Prevents slow fragments from blocking
- **Failure isolation** - One failed fragment doesn't break the page

### Recommended Settings

- **Few fragments (1-3)**: `maxConcurrentFetches: 10`
- **Many fragments (5+)**: `maxConcurrentFetches: 5`
- **Slow origin**: Reduce `fetchTimeout` to 3000ms

### Caching Strategy

For production use, consider:
- Enabling CDN caching on fragment `.plain.html` responses
- Implementing KV storage for fragment caching (Cloudflare)
- Setting appropriate Cache-Control headers

## Troubleshooting

### Fragments not hydrating

1. **Check console logs** - Worker logs fragment fetch attempts
2. **Verify fragment URLs** - Ensure fragments are accessible at `{url}.plain.html`
3. **Check timeouts** - Increase `fetchTimeout` if fragments are slow
4. **Test fragments directly** - Curl `https://your-site.com/fragments/name.plain.html`

### Performance issues

1. **Reduce concurrent fetches** - Lower `maxConcurrentFetches`
2. **Check fragment response times** - Optimize slow fragments
3. **Enable caching** - Cache fragment responses at CDN
4. **Monitor worker execution time** - Should be under 100ms typically

### Worker not processing pages

1. **Check content-type** - Worker only processes `text/html`
2. **Check response status** - Worker only processes successful responses (200-299)
3. **Verify routing** - Ensure worker is attached to the correct routes

## Architecture

### Request Flow

```
Browser Request
    �
Edge Worker
    �
Fetch Origin HTML
    �
Parse for Fragment Links
    �
Fetch Fragments in Parallel
    �
Replace Links with Content
    �
Return Hydrated HTML
    �
Browser (no client-side JS needed)
```

### Why Edge Hydration?

- **Better Performance** - Fragments fetched in parallel at edge, not sequentially in browser
- **SEO Friendly** - Crawlers see fully hydrated content
- **No JavaScript Required** - Works for all users, including those with JS disabled
- **Reduced Client Work** - Browser receives ready-to-render HTML

## Advanced Usage

### Custom Fragment Wrapper

Modify the wrapper in [worker.js](worker.js:168-169) to add custom classes:

```javascript
const wrappedContent = `<div class="fragment-hydrated my-custom-class" data-fragment-source="${fragment.url}">${fragmentContent}</div>`;
```

### Selective Hydration

Add conditions to skip certain fragments:

```javascript
if (fragment.url.includes('/fragments/skip-')) {
  continue; // Don't hydrate this fragment
}
```

### Fragment Caching

Implement caching using Cloudflare KV:

```javascript
// Check cache first
const cached = await env.FRAGMENT_CACHE.get(plainUrl);
if (cached) return cached;

// Fetch and cache
const html = await response.text();
await env.FRAGMENT_CACHE.put(plainUrl, html, { expirationTtl: CONFIG.cacheTTL });
```

## Limitations

- Only processes HTML responses (content-type: text/html)
- Only processes successful responses (2xx status codes)
- Fragment links must be in the format: `<a href="/fragments/...">...</a>`
- Fragments must be accessible via `.plain.html` suffix
- Maximum fragment size depends on worker memory limits

## Security

- Worker validates URLs before fetching
- Timeout protection prevents hanging requests
- Error handling prevents information leakage
- Only processes HTML content
- No external dependencies or npm packages

## License

Apache-2.0

## Support

For issues specific to AEM Edge Delivery Services, consult:
- [AEM.live Documentation](https://www.aem.live/)
- [AEM Developer Tutorial](https://www.aem.live/developer/tutorial)

For Cloudflare Workers questions:
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
