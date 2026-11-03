import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '.data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const SYNC_FILE = path.join(DATA_DIR, 'sync_store.json');
const CACHE_FILE = path.join(DATA_DIR, 'cache_store.json');

// In-memory fallback / cache with disk persistence
let syncStore: Record<string, any> = {};
let cacheStore: Record<string, any> = {};

try {
  if (fs.existsSync(SYNC_FILE)) {
    syncStore = JSON.parse(fs.readFileSync(SYNC_FILE, 'utf-8'));
  }
} catch (e) {
  console.error('Error reading sync store:', e);
}

try {
  if (fs.existsSync(CACHE_FILE)) {
    cacheStore = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
  }
} catch (e) {
  console.error('Error reading cache store:', e);
}

function persistSyncStore() {
  try {
    fs.writeFileSync(SYNC_FILE, JSON.stringify(syncStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist sync store:', err);
  }
}

function persistCacheStore() {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist cache store:', err);
  }
}

const DESKTOP_USER_AGENTS: Record<string, string> = {
  chrome_win: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  chrome_mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  firefox_win: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
  edge_win: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
};

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '20mb' }));

  // CORS headers for APIs
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Cross-device sync endpoints
  app.get('/api/sync/:key', (req: Request, res: Response) => {
    const key = req.params.key.trim().toLowerCase();
    if (!key) {
      return res.status(400).json({ error: 'Sync key required' });
    }
    const data = syncStore[key] || null;
    res.json({ success: true, key, data });
  });

  app.post('/api/sync/:key', (req: Request, res: Response) => {
    const key = req.params.key.trim().toLowerCase();
    if (!key) {
      return res.status(400).json({ error: 'Sync key required' });
    }
    const { payload } = req.body;
    if (!payload) {
      return res.status(400).json({ error: 'Payload required' });
    }

    syncStore[key] = {
      ...payload,
      lastSyncedAt: new Date().toISOString(),
    };
    persistSyncStore();

    res.json({ success: true, key, lastSyncedAt: syncStore[key].lastSyncedAt });
  });

  // Cache & History endpoints
  app.get('/api/cache', (req: Request, res: Response) => {
    const userKey = (req.query.user as string) || 'default';
    const entries = cacheStore[userKey] || [];
    res.json({ success: true, entries });
  });

  app.post('/api/cache', (req: Request, res: Response) => {
    const userKey = req.body.user || 'default';
    const entry = req.body.entry;
    if (!entry || !entry.url) {
      return res.status(400).json({ error: 'Valid entry required' });
    }

    if (!cacheStore[userKey]) {
      cacheStore[userKey] = [];
    }

    // Keep unique URLs or update timestamp & visitCount
    const existingIndex = cacheStore[userKey].findIndex((item: any) => item.url === entry.url);
    if (existingIndex >= 0) {
      const prev = cacheStore[userKey][existingIndex];
      cacheStore[userKey][existingIndex] = {
        ...prev,
        ...entry,
        visitCount: (prev.visitCount || 1) + 1,
        lastVisited: Date.now(),
      };
    } else {
      cacheStore[userKey].unshift({
        ...entry,
        visitCount: 1,
        lastVisited: Date.now(),
      });
    }

    // Limit to latest 500 cached entries
    if (cacheStore[userKey].length > 500) {
      cacheStore[userKey] = cacheStore[userKey].slice(0, 500);
    }

    persistCacheStore();
    res.json({ success: true, entries: cacheStore[userKey] });
  });

  app.delete('/api/cache', (req: Request, res: Response) => {
    const userKey = (req.query.user as string) || 'default';
    cacheStore[userKey] = [];
    persistCacheStore();
    res.json({ success: true });
  });

  // Web Proxy endpoint for desktop iframe embedding
  app.get('/api/proxy', async (req: Request, res: Response) => {
    const targetUrl = req.query.url as string;
    const uaMode = (req.query.ua as string) || 'chrome_win';
    const desktopUA = DESKTOP_USER_AGENTS[uaMode] || DESKTOP_USER_AGENTS.chrome_win;

    if (!targetUrl) {
      return res.status(400).send('Missing target URL');
    }

    let parsedUrl: URL;
    try {
      let formattedUrl = targetUrl;
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = 'https://' + formattedUrl;
      }
      parsedUrl = new URL(formattedUrl);
    } catch (e) {
      return res.status(400).send('Invalid URL format');
    }

    try {
      const fetchHeaders: Record<string, string> = {
        'User-Agent': desktopUA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Ch-Ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      };

      const response = await fetch(parsedUrl.toString(), {
        headers: fetchHeaders,
        redirect: 'follow',
      });

      const contentType = response.headers.get('content-type') || '';

      // Clean headers - strip frame-busting headers
      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');
      res.removeHeader('Content-Security-Policy-Report-Only');

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', contentType);

      if (contentType.includes('text/html')) {
        let html = await response.text();
        const baseHref = response.url || parsedUrl.toString();
        const origin = new URL(baseHref).origin;

        // Strip meta CSP tags from the HTML
        html = html.replace(/<meta[^>]*http-equiv=["']?content-security-policy["']?[^>]*>/gi, '');
        html = html.replace(/<meta[^>]*http-equiv=["']?x-frame-options["']?[^>]*>/gi, '');

        // Client-side script to handle seamless desktop navigation and send title/favicon to parent
        const injectedScript = `
          <script>
            (function() {
              try {
                // Inform parent of current URL and title
                function notifyParent() {
                  try {
                    window.parent.postMessage({
                      type: 'PROXY_PAGE_LOADED',
                      url: ${JSON.stringify(baseHref)},
                      title: document.title || ${JSON.stringify(parsedUrl.hostname)},
                      favicon: (document.querySelector("link[rel*='icon']") || {}).href || (${JSON.stringify(origin)} + '/favicon.ico')
                    }, '*');
                  } catch (e) {}
                }

                if (document.readyState === 'complete') {
                  notifyParent();
                } else {
                  window.addEventListener('load', notifyParent);
                }

                // Intercept link clicks
                document.addEventListener('click', function(e) {
                  var target = e.target;
                  while (target && target.tagName !== 'A') {
                    target = target.parentElement;
                  }
                  if (target && target.href && !target.href.startsWith('javascript:')) {
                    var href = target.href;
                    // Send navigation event to parent
                    window.parent.postMessage({
                      type: 'PROXY_NAVIGATE',
                      url: href
                    }, '*');
                  }
                }, true);

                // Prevent top-frame breakout (framebuster prevention)
                window.onbeforeunload = function() {};
                if (window.top !== window.self) {
                  try {
                    window.top.location = window.self.location;
                  } catch(e) {}
                }
              } catch (err) {}
            })();
          </script>
        `;

        // Inject <base> tag and script
        const baseTag = `<base href="${baseHref}">`;
        if (/<head[^>]*>/i.test(html)) {
          html = html.replace(/<head[^>]*>/i, `$&${baseTag}${injectedScript}`);
        } else {
          html = `${baseTag}${injectedScript}` + html;
        }

        res.status(response.status).send(html);
      } else {
        // Stream / buffer non-HTML content (images, css, pdfs, etc.)
        const buffer = await response.arrayBuffer();
        res.status(response.status).send(Buffer.from(buffer));
      }
    } catch (error: any) {
      console.error('Proxy fetch error:', error);
      res.status(502).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Navigation Error</title>
          <style>
            body { background: #0f172a; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .card { background: #1e293b; padding: 32px; border-radius: 16px; border: 1px solid #334155; max-width: 520px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            h2 { color: #38bdf8; margin-top: 0; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
            .btn { background: #2563eb; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block; margin-top: 16px; }
            .btn:hover { background: #1d4ed8; }
            .url-badge { background: #0f172a; padding: 6px 12px; border-radius: 6px; font-family: monospace; color: #cbd5e1; word-break: break-all; margin: 12px 0; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>DesktopMax Page Loader</h2>
            <div class="url-badge">${targetUrl}</div>
            <p>Could not load the requested webpage through the desktop frame proxy (${error.message || 'Network Timeout'}).</p>
            <p>Some sites restrict proxying. You can open directly in a dedicated tab or try reader mode.</p>
            <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="btn">Open In Direct Tab</a>
          </div>
        </body>
        </html>
      `);
    }
  });

  // Favicon proxy helper
  app.get('/api/favicon', async (req: Request, res: Response) => {
    const domain = req.query.domain as string;
    if (!domain) {
      return res.redirect('/icon.svg');
    }
    try {
      const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
      const response = await fetch(googleFaviconUrl);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        res.setHeader('Content-Type', response.headers.get('content-type') || 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(Buffer.from(buffer));
      }
    } catch (e) {}
    res.redirect('/icon.svg');
  });

  // Vite middleware in dev or static files in production
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DesktopMax server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start DesktopMax server:', err);
  process.exit(1);
});
