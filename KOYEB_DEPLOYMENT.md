# Koyeb Docker deployment

The FastAPI backend is built from `fastapi-backend/Dockerfile`. A GitHub Actions workflow publishes an image for every commit pushed to `main`.

## Docker Hub image

The workflow publishes both a moving `latest` tag and an immutable commit tag:

```text
docker.io/in2petahub/in2peta-growthcrew-backend:latest
docker.io/in2petahub/in2peta-growthcrew-backend:<commit-sha>
```

Use the `latest` image URL in Koyeb when you want the service to follow each successful release. Docker Hub must have a public repository named `in2peta-growthcrew-backend` under the account or organization that owns it.

## GitHub Actions setup

In the GitHub repository, add these repository Actions secrets:

| Name | Value |
|---|---|
| `DOCKERHUB_USERNAME` | `in2petahub` |
| `DOCKERHUB_TOKEN` | Docker Hub access token with Read and Write permissions |

To have the workflow redeploy the Koyeb service after publishing, also add:

| Name | Value |
|---|---|
| `KOYEB_API_TOKEN` | Koyeb API access token |

Add the Koyeb service ID as a repository Actions variable named `KOYEB_SERVICE_ID`. The service must already be configured to use the image's `latest` tag. If this variable is absent, the workflow only builds and publishes the image.

## Koyeb environment variables

Set these in the Koyeb service. Values marked `secret` should be entered as secrets in Koyeb. Use the current values from the existing Render service where applicable.

| Variable | Value or note |
|---|---|
| `GEMINI_API_KEY` | Secret |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` |
| `S3_BUCKET` | `in2peta-postiz-media` |
| `AWS_REGION` | `ap-southeast-2` |
| `AWS_ACCESS_KEY_ID` | Secret |
| `AWS_SECRET_ACCESS_KEY` | Secret |
| `FB_PAGE_ID` | `61594485176950` |
| `FB_PAGE_ACCESS_TOKEN` | Secret |
| `IG_BUSINESS_ACCOUNT_ID` | Your production Instagram business account ID |
| `META_APP_ID` | Your production Meta app ID |
| `META_APP_SECRET` | Secret. Required for Meta OAuth |
| `BACKEND_PUBLIC_URL` | Your Koyeb backend HTTPS URL. Used for Meta OAuth callbacks |
| `POSTIZ_API_URL` | A reachable Postiz API URL, if using Postiz. `127.0.0.1` only works when Postiz runs in the same container |
| `POSTIZ_API_KEY` | Secret |
| `MOTHERDUCK_TOKEN` | Secret |
| `MOTHERDUCK_DATABASE` | `business_leads` |
| `CORECLAW_API_KEY` | Secret |
| `AGENTMAIL_API_KEY` | Secret |
| `AGENTMAIL_WEBHOOK_SECRET` | Secret |
| `CENTRAL_INBOX` | `in2peta@gmail.com` |
| `PHYSICAL_ADDRESS` | Secret or private configuration value |
| `UNSUBSCRIBE_URL` | Set to the production unsubscribe URL |
| `IN2PETA_API_URL` | `https://code.in2peta.com/v1` |
| `IN2PETA_MODEL` | `deepseek-v4-flash` |
| `IN2PETA_API_KEY` | Secret |
| `LITELLM_BASE_URL` | `https://code.in2peta.com/v1` |
| `LITELLM_MASTER_KEY` | Secret |
| `LITELLM_MODEL` | `kimi-k3` |
| `API_KEY_ENCRYPTION_KEY` | Secret |
| `FINDER_FROM_INBOX` | Secret or configured inbox address |
| `FINDER_DIGEST_SECRET` | Secret |
| `FRONTEND_URL` | Production frontend URL |
| `FINDER_SCHEDULER` | `1` |

Also set the Koyeb exposed HTTP port to `8000`. The Docker image reads the `PORT` environment variable if Koyeb supplies a different port.

Configure the HTTP health check to request `/` on the exposed port. After deployment, set the frontend's `VITE_API_URL` to the Koyeb backend URL and redeploy the frontend. Set the Meta app's allowed OAuth redirect URI to `<KOYEB_BACKEND_URL>/api/auth/meta/callback`.

The image reads credentials from the environment. Set `FB_PAGE_ACCESS_TOKEN`, `META_APP_SECRET`, and your AI provider credentials explicitly. The backend no longer falls back to embedded credentials.

## Preserve application data

The backend stores accounts, leads, settings, and queues as JSON files. A new container has an empty data directory. Mount persistent storage at `/app/data`, ensure UID `10001` can write to it, and copy the current Render data there before switching traffic. Alternatively, set `GROWTHCREW_DATA_DIR` to another writable persistent directory. Run one instance while using the file store.
