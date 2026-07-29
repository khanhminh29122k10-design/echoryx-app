# Deploying EchoRyx to Railway

Two services, deployed in this order (backend first — the frontend needs its URL):

1. **echoryx-backend** → Railway (Node + persistent volume for the SQLite file)
2. **echoryx frontend** (this repo) → Railway (Node server build)

Both repos need to be pushed to GitHub first — Railway deploys from a GitHub repo, not a local folder.

## 0. Push both repos to GitHub

Both projects already have a local git commit ready (`git log` shows one commit each). You just need to create the two empty repos and push:

1. Go to [github.com/new](https://github.com/new), create a repo named `echoryx-backend` (private is fine). **Don't** initialize it with a README/gitignore — it needs to stay empty.
2. In a terminal, inside `C:\Users\User\OneDrive\Desktop\echoryx-backend`:
   ```bash
   git remote add origin https://github.com/<your-username>/echoryx-backend.git
   git branch -M main
   git push -u origin main
   ```
3. Repeat for the frontend: create a repo named `echoryx-app` (or whatever you like), then inside `C:\Users\User\OneDrive\Desktop\echo-tiger-tales-main\echo-tiger-tales-main`:
   ```bash
   git remote add origin https://github.com/<your-username>/echoryx-app.git
   git branch -M main
   git push -u origin main
   ```

## 1. Deploy the backend on Railway

1. Go to [railway.com](https://railway.com), sign up/log in **with GitHub**.
2. **New Project → Deploy from GitHub repo** → pick `echoryx-backend`. Railway auto-detects Node.js and will run `npm install`, `npm run build`, then `npm start` (these scripts are already set up correctly).
3. **Add a persistent volume** (needed so the SQLite file survives restarts/redeploys): open the service → **Settings → Volumes → New Volume**. Mount path: `/app/data`.
4. **Set environment variables** (service → **Variables** tab), copy these from `.env.example` / your local `.env` — generate NEW random secrets for production, don't reuse your local dev ones:
   | Variable | Value |
   |---|---|
   | `PORT` | `4000` (Railway sets its own `PORT` too — either works, Fastify reads `PORT`) |
   | `HOST` | `0.0.0.0` |
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | `./data/echoryx.sqlite` |
   | `JWT_ACCESS_SECRET` | a long random string (e.g. `openssl rand -hex 32`) |
   | `JWT_REFRESH_SECRET` | another long random string |
   | `DEVICE_TOKEN_SECRET` | another long random string |
   | `JWT_ACCESS_TTL` | `15m` |
   | `JWT_REFRESH_TTL` | `30d` |
   | `ANTHROPIC_API_KEY` | your real Claude API key, if you have one |
   | `ANTHROPIC_MODEL` | `claude-sonnet-4-5` |
   | `CORS_ORIGIN` | leave blank for now — comes back in step 3 |
5. Deploy. Railway gives you a public URL like `https://echoryx-backend-production.up.railway.app` — under **Settings → Networking → Generate Domain** if it's not shown yet. **Copy this URL.**

## 2. Deploy the frontend on Railway

1. **New Project → Deploy from GitHub repo** → pick your frontend repo.
2. **Settings → Variables**, add:
   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | `https://<your-backend-url-from-step-1>/api/v1` |
   | `DEPLOY_TARGET` | `node` (tells the build to produce a plain Node server instead of the Cloudflare build Lovable normally uses) |
3. **Settings → Deploy**, confirm the build/start commands (Railway usually auto-detects these from `package.json`):
   - Build command: `npm run build`
   - Start command: `npm start`
4. Deploy. Copy the public URL Railway gives you (e.g. `https://echoryx-app-production.up.railway.app`).

## 3. Close the loop: allow the frontend's real origin in the backend

Go back to the **backend** service on Railway → **Variables** → set:

```
CORS_ORIGIN=https://<your-frontend-url-from-step-2>
```

Redeploy the backend (Railway does this automatically when you save a variable). Done — visit your frontend URL from anywhere, not just your home WiFi.

## Notes

- Every `git push` to `main` on either repo auto-redeploys that service on Railway.
- The free tier sleeps/limits usage after a while — fine for a demo, not for a real launch.
- If you ever add a real Postgres database instead of SQLite, swap this for Railway's built-in Postgres plugin and update `src/db/client.ts` in the backend to use `drizzle-orm/node-postgres` instead of `drizzle-orm/libsql`.
