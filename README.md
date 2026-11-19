# NovaCart

React + Vite + Tailwind client, Express + MongoDB server.

## Run (two PowerShell windows)

```powershell
# 1) server
cd server
npm install
copy .env.example .env     # skip if you already have .env; fill JWT secrets + MONGODB_URI
npm run seed               # demo products (only if catalog is empty)
npm run create-admin -- --email you@example.com --name "Your Name"   # hidden password prompt
npm run dev                # http://localhost:5000

# 2) client
cd client
npm install
npm run dev                # http://localhost:5173  (proxies /api to :5000)
```

- Shop: http://localhost:5173  |  Admin: http://localhost:5173/admin/login
- Leave `MONGODB_URI` empty in development to use a temporary in-memory MongoDB (products auto-seeded, data resets on restart; use a real URI for admin work).
- Tests: `cd server && npm test` (in-memory MongoDB, or set `MONGODB_URI_TEST`).

## GitHub Auto-Sync

To automatically commit and push any changes you make to GitHub:
```powershell
npm run auto-sync
```
Or for a one-time push of all current changes:
```powershell
npm run sync
```

## Production notes
- Server: `NODE_ENV=production`, `CLIENT_ORIGINS=https://your-site`, strong JWT secrets, `MONGODB_URI`.
- Client: set `VITE_API_URL=https://your-api/api` at build time. `public/_redirects` handles SPA routing on Netlify.
- Cookies are `SameSite=Lax` by default: serve client and API on the same site (e.g. shop.example.com + api.example.com). For fully cross-site hosting set `COOKIE_SAMESITE=none` on the server.
