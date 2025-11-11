# Quick Start Guide

Get the fragment hydration worker running in 5 minutes.

## 🚀 Fastest Path: Cloudflare Workers

### 1. Install & Setup (1 min)
```bash
npm install -g wrangler
cd tools/fragment-hydration-worker
npm install
wrangler login
```

### 2. Configure (1 min)
Edit `wrangler.toml`:
```toml
routes = [
  { pattern = "your-domain.com/*", zone_name = "your-domain.com" }
]
```

### 3. Test Locally (2 min)
```bash
npm run dev
# Visit http://localhost:8787
```

### 4. Deploy (1 min)
```bash
npm run deploy
```

Done! 🎉

---

## 📋 Pre-Deployment Checklist

- [ ] Domain is on Cloudflare (or your chosen CDN)
- [ ] Fragments are accessible at `/fragments/*.plain.html`
- [ ] Test page has fragment links: `<a href="/fragments/name">Text</a>`
- [ ] Tested locally with `npm run dev`

---

## ✅ Verify It's Working

```bash
# Check for the custom header
curl -I https://your-domain.com/page | grep X-Fragment-Hydration
# Should output: X-Fragment-Hydration: processed

# Check HTML is hydrated
curl https://your-domain.com/page | grep "fragment-hydrated"
# Should find: <div class="fragment-hydrated"...
```

---

## 🎯 What Happens

```
BEFORE (link):
<a href="/fragments/header">Header</a>

AFTER (hydrated):
<div class="fragment-hydrated">
  <header>...actual content...</header>
</div>
```

---

## ⚙️ Common Configurations

### More fragments? Reduce concurrency:
```javascript
// In worker.js
maxConcurrentFetches: 5,  // Default is 10
```

### Slow fragments? Increase timeout:
```javascript
// In worker.js
fetchTimeout: 10000,  // Default is 5000 (5s)
```

### Different fragment path?
```javascript
// In worker.js
fragmentPath: '/components/',  // Default is '/fragments/'
```

---

## 🐛 Quick Troubleshooting

### Fragments not hydrating?

1. **Check fragment URL directly:**
   ```bash
   curl https://your-domain.com/fragments/name.plain.html
   ```
   Should return HTML, not 404

2. **Check worker logs:**
   ```bash
   wrangler tail
   ```
   Look for fetch errors

3. **Test regex pattern:**
   Fragment links must match: `<a href="[path]/fragments/[name]">`

### Worker not running?

```bash
# Check deployment
wrangler deployments list

# View worker status
wrangler whoami
```

---

## 📚 Next Steps

- Read full [README.md](README.md) for detailed documentation
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for other platforms
- Review [worker.js](worker.js) to customize behavior

---

## 💡 Pro Tips

1. **Cache fragments** - Add caching headers to `.plain.html` responses
2. **Monitor performance** - Watch execution time in dashboard
3. **Start small** - Test on low-traffic pages first
4. **Version control** - Tag deployments for easy rollback

---

## 🆘 Getting Help

- Worker not deploying? Check `wrangler.toml` syntax
- Fragments timing out? Increase `fetchTimeout`
- High memory usage? Reduce `maxConcurrentFetches`
- Need examples? See `example.html`

---

## 📊 Expected Performance

| Metric | Typical Value |
|--------|--------------|
| Execution time | 50-100ms |
| Fragment fetch | 10-50ms each |
| Total overhead | +100-200ms |
| Memory usage | 20-50 MB |

With proper caching, overhead drops to <10ms.

---

## 🎓 How It Works (Simple)

1. Request comes in → Worker intercepts
2. Fetch HTML from origin
3. Find all `/fragments/` links
4. Fetch fragment content in parallel
5. Replace links with content
6. Return hydrated HTML
