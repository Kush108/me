# Job Ops Dashboard — me.flowgrid.ca

Private password-protected job search dashboard. Fetches jobs via JSearch (RapidAPI), scores listings with OpenAI (`gpt-4o-mini`), and tailors resume summaries and cover letters per posting.

## Setup

1. Copy environment variables:

```bash
cp .env.example .env.local
```

2. Edit `.env.local`:

```
OPENAI_API_KEY=sk-...
RAPIDAPI_KEY=your_rapidapi_key
DASHBOARD_PASSWORD=your-strong-password
NEXT_PUBLIC_APP_URL=https://me.flowgrid.ca
```

Add the same variables in your Vercel/hosting dashboard (never commit `.env.local`).

3. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

### Vercel

- Import repo, set the three env vars, deploy.
- Point `me.flowgrid.ca` DNS to Vercel.

### Self-hosted (Nginx)

```bash
npm run build
npm start  # default port 3000 — use PORT=3001 if needed
```

```nginx
server {
    server_name me.flowgrid.ca;
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Security

- Profile data lives in `lib/profile.ts` — server-side only, never sent to the client except via tailored API responses.
- `robots: noindex` on all pages.
- Do not commit `.env.local`.

## Future

- Daily email digest (Vercel cron)
- PDF resume export
- SerpAPI fallback if RSS feeds break
- Per-job notes field
