# RoomOrganizer

RoomOrganizer is a React + Vite website where you can upload photos of your rooms and receive AI-powered organization and decluttering suggestions.

## Open Source

This project is open-source under the MIT License. See `LICENSE`.
Contributions are welcome. See `CONTRIBUTING.md`.

## Local Development

Prerequisites:
- Node.js 20+

Steps:
1. Install dependencies:
`npm install`
2. Start local dev server:
`npm run dev`

## Cloudflare Workers Deployment

This project deploys as a Cloudflare Worker with static assets from `dist` and API routes:
- `POST /api/analyze`
- `POST /api/chat`

Set your Gemini key as a Worker secret:
`npx wrangler secret put GEMINI_API_KEY`

Build and deploy:
`npm run deploy`

## GitHub Release Flow

Initialize git and push to your GitHub account:

1. `git init`
2. `git add .`
3. `git commit -m "Initial release: RoomOrganizer on Cloudflare Workers"`
4. `git branch -M main`
5. `git remote add origin git@github.com:theclassiclol/roomorganizer.git`
6. `git push -u origin main`
