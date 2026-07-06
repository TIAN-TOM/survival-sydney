# Deploying a live demo (Render + MongoDB Atlas, free tier)

This deploys the API as a Render Web Service, the SPA as a Render Static Site, and the database on MongoDB Atlas. All three have a free tier.

> Free-tier note: the API sleeps after ~15 minutes idle and cold-starts in ~30–60 s on the next request. Fine for a portfolio demo; mention it in your README.

## 1. Database — MongoDB Atlas

1. Create a free account at <https://www.mongodb.com/atlas> and a free **M0** cluster.
2. **Database Access** → add a database user (username + password).
3. **Network Access** → add IP `0.0.0.0/0` (Render's IPs are dynamic on the free tier).
4. **Connect** → *Drivers* → copy the connection string. It looks like:
   `mongodb+srv://<user>:<password>@cluster0.xxxx.mongodb.net/openassess?retryWrites=true&w=majority`
   Make sure the database name (`openassess`) is in the path.

## 2. Services — Render Blueprint

1. Push this repo (with `render.yaml`) to GitHub.
2. In Render → **New** → **Blueprint** → connect the repo. Render reads `render.yaml` and proposes `openassess-api` and `openassess-web`.
3. Approve. `JWT_SECRET` is auto-generated. You'll fill the `sync: false` values next.

## 3. Wire the URLs (the one manual step)

Because the two services and CORS reference each other's URLs, set these after the first deploy assigns them:

| Service | Env var | Value |
|---|---|---|
| `openassess-api` | `MONGODB_URI` | the Atlas string from step 1 |
| `openassess-api` | `CLIENT_ORIGIN` | the web URL, e.g. `https://openassess-web.onrender.com` |
| `openassess-web` | `VITE_API_BASE_URL` | the API URL + `/api`, e.g. `https://openassess-api.onrender.com/api` |

After setting these, trigger a redeploy of both services (the frontend value is compiled in, so it **must** rebuild).

## 4. Seed demo data (once)

The API has no questions until seeded. Easiest option: open a **Shell** on the `openassess-api` service in the Render dashboard and run:

```bash
node dist/seeds/seed.js
```

Seeds ~50 questions plus demo accounts `admin / AdminPass123` and `player1 / PlayerPass123`.

## 5. Verify

- `https://openassess-api.onrender.com/api/health` → `{"success":true,"data":{"status":"ok"}}`
- Open the web URL, sign in as `player1`, take a quiz.

## Troubleshooting

- **CORS error in the browser console** → `CLIENT_ORIGIN` on the API must exactly match the web origin (no trailing slash), then redeploy the API.
- **Frontend calls `localhost:5001`** → `VITE_API_BASE_URL` wasn't set before the frontend build; set it and redeploy the web service.
- **API won't start, "JWT_SECRET is weak…"** → ensure `JWT_SECRET` exists (Render generates it); it must be ≥32 chars.
- **Login works but quiz is empty** → run the seed step (4).

## Alternative: Docker / self-host

For a single-host deploy (VPS, Fly.io, Railway), use the bundled `docker-compose.yml`:

```bash
cp .env.example .env   # set a strong JWT_SECRET
docker compose up -d --build
docker compose run --rm seed
```

See the README for details.
