# Deployment Guide

This guide covers deploying the fragment hydration worker to various edge computing platforms.

## Prerequisites

- Node.js 18 or later
- Account on your chosen platform (Cloudflare, AWS, etc.)
- Domain configured with your CDN/edge provider

## Platform-Specific Deployment

### 1. Cloudflare Workers (Recommended)

#### Setup

1. **Install Wrangler:**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare:**
   ```bash
   wrangler login
   ```

3. **Install dependencies:**
   ```bash
   cd tools/fragment-hydration-worker
   npm install
   ```

#### Configuration

Edit `wrangler.toml`:

```toml
name = "fragment-hydration-worker"
main = "worker.js"
compatibility_date = "2024-01-01"

# Add your domain routes
routes = [
  { pattern = "yourdomain.com/*", zone_name = "yourdomain.com" },
  { pattern = "www.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

#### Testing Locally

```bash
npm run dev
# Visit http://localhost:8787
```

#### Deploy to Production

```bash
npm run deploy
```

#### Verify Deployment

```bash
curl -I https://yourdomain.com/test-page | grep X-Fragment-Hydration
# Should see: X-Fragment-Hydration: processed
```

---

### 2. AWS Lambda@Edge

#### Setup

1. **Create Lambda function:**
   - Go to AWS Lambda Console
   - Click "Create function"
   - Choose "Author from scratch"
   - Runtime: Node.js 18.x
   - Architecture: x86_64

2. **Prepare deployment package:**
   ```bash
   cd tools/fragment-hydration-worker
   zip -r function.zip worker.js
   ```

3. **Upload code:**
   - In Lambda console, upload `function.zip`
   - Handler: `worker.handler`
   - Memory: 512 MB
   - Timeout: 5 seconds

4. **Publish version:**
   - Actions → Publish new version
   - Note the version ARN

#### CloudFront Configuration

1. **Create CloudFront distribution** (if not exists)

2. **Add Lambda@Edge trigger:**
   - Go to CloudFront → Behaviors
   - Select behavior (usually default *)
   - Lambda Function Associations:
     - Event type: **Origin Response**
     - Lambda Function ARN: [your-function-arn:version]
     - Include Body: **Yes**
   - Save changes

3. **Deploy:**
   - CloudFront will deploy to all edge locations (15-20 min)

#### Testing

```bash
curl -I https://your-distribution.cloudfront.net/test-page | grep X-Fragment-Hydration
```

---

### 4. Fastly Compute@Edge

#### Setup

1. **Install Fastly CLI:**
   ```bash
   npm install -g @fastly/cli
   ```

2. **Initialize project:**
   ```bash
   fastly compute init
   ```

3. **Adapt worker code:**

   Replace `src/index.js`:
   ```javascript
   import { handleRequest } from './worker.js';

   addEventListener('fetch', (event) => {
     event.respondWith(handleRequest(event.request));
   });
   ```

4. **Build and deploy:**
   ```bash
   fastly compute build
   fastly compute deploy
   ```

---

### 5. Akamai EdgeWorkers

#### Setup

1. **Create EdgeWorker bundle:**
   ```bash
   mkdir edgeworker-bundle
   cp tools/fragment-hydration-worker/worker.js edgeworker-bundle/main.js
   ```

2. **Create bundle.json:**
   ```json
   {
     "edgeworker-version": "1.0",
     "description": "Fragment Hydration Worker"
   }
   ```

3. **Adapt for Akamai:**

   Update `main.js`:
   ```javascript
   import { handleRequest } from './worker.js';

   export async function onClientResponse(request, response) {
     const webRequest = new Request(request.url, {
       method: request.method,
       headers: request.getHeaders(),
     });

     return handleRequest(webRequest);
   }
   ```

4. **Upload via Akamai Control Center**

---

## Configuration Reference

### Environment Variables

All platforms support these configuration options:

```bash
FRAGMENT_PATH="/fragments/"
FRAGMENT_SUFFIX=".plain.html"
MAX_CONCURRENT_FETCHES="10"
FETCH_TIMEOUT="5000"
```

#### Cloudflare (wrangler.toml)
```toml
[vars]
FRAGMENT_PATH = "/fragments/"
MAX_CONCURRENT_FETCHES = "10"
```

#### AWS Lambda
Set via Lambda environment variables in console

---

## Performance Tuning

### Memory Settings

| Platform | Recommended Memory | Notes |
|----------|-------------------|-------|
| Cloudflare Workers | 128 MB (default) | Usually sufficient |
| AWS Lambda@Edge | 512 MB | Adjust based on fragment size |
| Vercel Edge | N/A (managed) | No configuration needed |
| Fastly | 512 MB | Configurable in service |

### Timeout Settings

| Platform | Recommended Timeout |
|----------|-------------------|
| Cloudflare Workers | 10-30 seconds |
| AWS Lambda@Edge | 5 seconds (max) |
| Vercel Edge | 25 seconds (max) |
| Fastly | 30 seconds |

### Concurrency

Adjust `maxConcurrentFetches` based on typical fragment count:

- **1-2 fragments**: 10 concurrent fetches
- **3-5 fragments**: 5 concurrent fetches
- **6+ fragments**: 3 concurrent fetches

---

## Monitoring

### Cloudflare Workers

View logs in real-time:
```bash
wrangler tail
```

Or in Cloudflare dashboard:
- Workers → Your Worker → Logs
- Analytics → Performance metrics

### AWS Lambda@Edge

View logs in CloudWatch:
- Region: **us-east-1** (Lambda@Edge always logs here)
- Log group: `/aws/lambda/us-east-1.[function-name]`

### Metrics to Monitor

1. **Execution time** - Should be under 100ms typically
2. **Fragment fetch failures** - Check console logs
3. **Timeout errors** - Increase timeout if frequent
4. **Memory usage** - Increase if hitting limits

---

## Troubleshooting

### Worker not triggering

- **Cloudflare**: Check route patterns match your domain
- **AWS**: Ensure Lambda@Edge is on "Origin Response" event

### Fragments not hydrating

1. Check worker logs for fetch errors
2. Test fragment URLs directly: `curl https://your-site.com/fragments/name.plain.html`
3. Verify fragment response is valid HTML
4. Check timeout settings

### Performance issues

1. Reduce `maxConcurrentFetches`
2. Increase worker timeout
3. Enable CDN caching on `.plain.html` responses
4. Optimize slow fragments at origin

### CORS errors

If fragments are on different domain:
- Ensure CORS headers allow worker's origin
- Consider using same-origin fragments

---

## Rollback

### Cloudflare Workers
```bash
wrangler rollback
```

### AWS Lambda@Edge
- Update CloudFront behavior
- Remove Lambda Function Association
- Wait 15-20 minutes for propagation

---

## Best Practices

1. **Test thoroughly** before deploying to production
2. **Monitor logs** for first 24 hours after deployment
3. **Start with low traffic** routes if possible
4. **Set up alerts** for error rates and timeouts
5. **Cache fragments** at CDN when possible
6. **Version your deployments** for easy rollback
7. **Document custom configuration** for your team

---

## Support

- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **AWS Lambda@Edge**: https://docs.aws.amazon.com/lambda/latest/dg/lambda-edge.html
- **Fastly Compute**: https://developer.fastly.com/learning/compute/

For AEM-specific questions: https://www.aem.live/docs
