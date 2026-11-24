# Deploy SafarNama on Ubuntu with Coolify

SafarNama runs as one Docker Compose application. The service serves the React website and the API at the same HTTPS domain. The SQLite database and uploaded photos and reels live in a persistent Docker volume on Ubuntu. The Android build points to that API. Supabase handles sign-in for both clients. The media and activity storage does not require Supabase Storage or Cloudflare R2.

## 1. Prepare the domain and sign-in

- Point your website's DNS record to the Ubuntu server that will run the application. In this guide, replace `travel.example.com` with your domain. Verify the server accepts HTTPS traffic through the Coolify proxy. [Coolify DNS setup](https://coolify.io/docs/core/networking/dns)
- Open Supabase **Authentication → URL Configuration**. Set **Site URL** to your HTTPS website. Add the website URL and, if you use Android, `safarnama://auth-callback` and `safarnama-preview://auth-callback` to **Redirect URLs**. The website and APK must use the same Supabase project. [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- Copy the Supabase project URL and public publishable or legacy anon key. The same public client key is used in the frontend build and by the API to verify a sign-in. Keep any secret or service-role key out of this configuration.

## 2. Create the application in Coolify

1. Put this code on a branch your Coolify Git source can read. In Coolify, open a project and choose **+ New**. Connect the repository and select that branch for deployment.
2. Choose the **Docker Compose** build pack. Use the repository root as the base directory and `/compose.yaml` as the Compose file location. Load the Compose configuration. It defines one service named `safarnama`. [Coolify Docker Compose setup](https://coolify.io/docs/applications/builds/docker-compose)
3. In **Domains**, assign the HTTPS domain to `safarnama` with internal port **3000**. On versions that take a domain string including the port, enter `https://travel.example.com:3000` there. Visitors still use `https://travel.example.com` on the standard HTTPS port. [Coolify domain settings](https://coolify.io/docs/applications/configuration/general)
4. In **Environment Variables**, enter the following. The Compose configuration passes the public Supabase variables to both the build and runtime. [Coolify environment variables](https://coolify.io/docs/applications/configuration/environment-variables)

| Variable | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your public publishable or legacy anon key |
| `SAFARNAMA_ORIGIN` | `https://travel.example.com` with no trailing slash |
| `VITE_GOOGLE_MAPS_API_KEY` | Optional browser key restricted to your website, with Maps JavaScript API and Geocoding API |
| `MIN_FREE_MIB` | Optional. Defaults to `5120` MiB of free disk reserved for the database and host. |

5. Verify **Persistent Storage** lists the Compose-managed volume `safarnama-data` at `/app/data`. Coolify may prefix the actual Docker volume name. Keep this mount when you redeploy. Run one app instance against this volume. [Coolify persistent storage](https://coolify.io/docs/applications/configuration/persistent-storage)
6. Deploy. When the status is healthy, open `https://travel.example.com/api/health` and check that it returns `{"ok":true}`. Open the home page, sign in, publish a small photo story, and open it in a second browser. Restart the application in Coolify, then verify that the story and image still load. Sign in again with the same account to check your private passport and journey.

**Access model.** Published stories, guide pages, reviews, and attached media are readable by visitors. Sign-in is required to publish or modify data. Journeys, passport stamps, bookmarks, and follows are scoped to the signed-in account. Hosting on a privately owned VM does not itself restrict who can open the public domain.

## 3. Connect Android to the same server

- For a GitHub Actions build, set the repository **Actions variable** `VITE_API_URL` to `https://travel.example.com`. Keep the existing Supabase build settings pointed at the same project. Build a fresh APK after changing the domain.
- For a local Android build, add `VITE_API_URL=https://travel.example.com` to the root `.env` and rebuild. The web build uses its own domain automatically.
- Sign in on the APK and verify that the photo story appears. Play a reel to verify both the upload and streaming path.

## 4. Protect the 60 GB of disk space

- Check the Docker volume is on the filesystem with the reported free space. The default 5 GiB reserve blocks uploads near capacity. Docker images, logs, SQLite files, and backups also consume disk. The reserve is not a storage quota or backup.
- Uploads support JPG, PNG, WebP, and GIF up to 8 MiB per image, and MP4 or WebM up to 60 MiB per video. Photos and videos are stored in their uploaded form. Media abandoned during a failed publication is cleaned up after its grace period. Only linked media is served.
- Back up the entire `/app/data` volume, which contains the SQLite database and the uploads folder. For a manual consistent backup, stop SafarNama in Coolify, archive that volume using its actual Docker volume name, and restart the application. Save a copy off the server. For restore testing, unpack into a separate volume on a staging instance first. [Coolify volume mounts](https://coolify.io/docs/core/persistent-storage/storage-mounts/volume-mounts)

Previously created browser-only or APK-only data is still in its original app or browser storage. Enabling the server does not import it automatically. Keep local drafts and source media until you have republished anything you want to carry over.

The current feed loads the most recent 500 records per public content type. Add pagination before opening the site to a larger community.

## Local verification

Use Node.js 24. Add the Supabase URL and public key to `.env`. To work with the backend from the Vite preview, set `VITE_SERVER_STORAGE=1` and set `SAFARNAMA_ORIGIN` to the development origin, for example `http://localhost:5173`. In separate terminals run `npm start` and `npm run dev`. Vite forwards the API and media requests to port 3000. The backend writes to `.safarnama-data/` by default.

Run `npm run test:server` for the API tests and `npm run build` for the production frontend build.
