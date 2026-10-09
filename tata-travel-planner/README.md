# Ta-Ta — AI + Google Maps Travel Planner

Cloudflare Pages-ready personal travel planner. The app brand, browser title, favicon, PWA name, and icons all use **Ta-Ta**.

## Features
- Gemini 3.5 Flash itinerary generation and feedback-driven revisions.
- Every itinerary iteration is saved under its trip and can be opened or deleted individually.
- Google Places Autocomplete and verification (Places API New).
- Google Maps pins and direct directions links.
- Trips stored in the browser's LocalStorage.
- Gemini key kept server-side as a Cloudflare Pages secret; you do not paste it into the app.
- Ta-Ta PWA manifest and 192×192 / 512×512 icons.

## Deploy to Cloudflare Pages

### 1. Create the Pages project
Upload/connect this project using Cloudflare Pages with the repository root as the project root. Set the build command to **none** (or leave it empty) and the build output directory to **`public`**. Keep the `functions/` directory at the project root so Cloudflare detects the Pages Function route `POST /api/itinerary`.

You can also use Wrangler after installing it: `npx wrangler pages deploy public --project-name ta-ta-travel-planner`. For reliable Functions deployment, use a Git-connected Pages project or the supported Wrangler Pages project deployment workflow with the root `functions/` directory included.

### 2. Add the Gemini key once (server-side)
In Cloudflare Dashboard → **Workers & Pages** → your Pages project → **Settings** → **Variables and Secrets**, add a secret:
- Name: `GEMINI_API_KEY`
- Value: your Gemini API key from Google AI Studio

Redeploy after adding the secret. You will not need to paste the Gemini key into Ta-Ta or store it in LocalStorage. Do not put the Gemini key in the HTML or any `VITE_` / public environment variable.

### 3. Configure Google Maps
Enable **Maps JavaScript API** and **Places API (New)** in Google Cloud. Create a browser key and restrict it by HTTP referrer to your Cloudflare Pages domain and by API to the APIs needed by this app. In Ta-Ta → Settings, enter this Google Maps browser key once; it is saved locally in this browser.

## Local testing
Static HTML can be served locally, but the AI endpoint requires Cloudflare Pages Functions. Use `npx wrangler pages dev public` from this project root after installing Wrangler and setting `GEMINI_API_KEY` in your local environment / Wrangler secrets configuration. Google Maps needs its own browser key entered in the app.

## Security
The Gemini secret is sent only by the Pages Function to Google and is never delivered to the browser. The Maps browser key is necessarily visible to the browser, so restrict it by referrer and API. This is designed for personal use; LocalStorage trips remain on the device/browser where they were created.

AI plans are suggestions. Verify opening hours, closures, tickets and transport conditions before travelling.
