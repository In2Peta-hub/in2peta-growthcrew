# GrowthCrew Deployment Guide (Vercel + Render)

This guide walks you through deploying **GrowthCrew** to production:
- **Frontend (React / Vite)** $\to$ Deployed on **Vercel**
- **Backend (FastAPI)** $\to$ Deployed on **Render**
- **Social Media (Facebook / Instagram)** $\to$ Automated live publishing via Meta Graph API

---

## 1. Deploy Backend on Render

1. Go to **[Render.com](https://render.com)** and sign in with GitHub.
2. Click **New +** $\to$ **Web Service**.
3. Connect your GitHub repository: `https://github.com/In2Peta-hub/in2peta-growthcrew.git` (or your fork).
4. Configure the Web Service settings:
   - **Name**: `growthcrew-backend`
   - **Root Directory**: `fastapi-backend` (or `admin-approval-portal/fastapi-backend` depending on repo root)
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free or Starter
5. Under **Environment Variables**, add:
   | Key | Value / Source |
   |---|---|
   | `GEMINI_API_KEY` | Your Google Gemini API Key |
   | `GEMINI_MODEL` | `gemini-3.5-flash-lite` |
   | `S3_BUCKET` | `in2peta-postiz-media` |
   | `AWS_REGION` | `ap-southeast-2` |
   | `AWS_ACCESS_KEY_ID` | Your AWS Access Key |
   | `AWS_SECRET_ACCESS_KEY` | Your AWS Secret Key |
   | `FB_PAGE_ID` | `61594485176950` (Your Facebook Page ID) |
   | `FB_PAGE_ACCESS_TOKEN` | Your Meta Page Access Token (see Section 3 below) |
   | `MOTHERDUCK_TOKEN` | MotherDuck access token ([app.motherduck.com](https://app.motherduck.com) → Settings → Access Tokens) — enables the ~10.6M-lead database in GrowthCrew search. Optional: without it, searches run live-only. |
   | `MOTHERDUCK_DATABASE` | `business_leads` (default — only set if you renamed the database) |
   | `CORECLAW_API_KEY` | Lead search (live Google Maps search) |
   | `AGENTMAIL_API_KEY` | Outreach sending inboxes |
   | `AGENTMAIL_WEBHOOK_SECRET` | Verifies inbound-reply webhooks |
   | `CENTRAL_INBOX` | Where inbound replies are forwarded (e.g. `in2peta@gmail.com`) |
   | `IN2PETA_API_KEY` / `IN2PETA_API_URL` / `IN2PETA_MODEL` | AI drafting (defaults to the In2Peta DeepSeek-Flash gateway) |

6. Click **Deploy Web Service**.
7. Once deployed, copy your Render backend URL (e.g., `https://growthcrew-backend.onrender.com`).

---

## 2. Deploy Frontend on Vercel

1. Go to **[Vercel.com](https://vercel.com)** and sign in with GitHub.
2. Click **Add New...** $\to$ **Project**.
3. Import the repository.
4. In the Project Configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click "Edit" and select `client` (or `admin-approval-portal/client`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   - **Key**: `VITE_API_URL`
   - **Value**: Your Render Backend URL from Step 1 (e.g. `https://growthcrew-backend.onrender.com`)
6. Click **Deploy**.

Vercel will build and assign you a live HTTPS URL (e.g., `https://growthcrew.vercel.app`).

---

## 3. Meta Graph API (Direct Publishing to Facebook)

### Why Direct Meta Graph API is recommended on Render:
When deployed to cloud services like Render, relying on a local 6-container Docker stack (Postiz + Temporal + Postgres + Redis) causes timeouts and network stalls. 

FastAPI now includes a direct **Meta Graph API publisher** that connects straight to Meta:
- **Zero Docker/Temporal crashes**
- **Instant publishing in < 2 seconds**
- **Direct confirmation with Facebook post link**

### How to get your Permanent Page Access Token:
1. Open the **[Meta Graph API Explorer](https://developers.facebook.com/tools/explorer/)**.
2. Select your App (**Postiz / Growthcrew**).
3. Under **User or Page**, select **Page Access Token** for **Mytestpage**.
4. In permissions, ensure these are granted:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `pages_show_list`
5. Generate the Token.
6. Set this token as `FB_PAGE_ACCESS_TOKEN` in your Render Environment Variables.
7. Any post published from the portal will now publish live directly to **Mytestpage** on Facebook!
