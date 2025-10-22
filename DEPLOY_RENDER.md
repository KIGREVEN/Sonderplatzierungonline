Render.com Deployment Guide

1. Create a new Web Service on Render:
   - Connect your GitHub repository and select branch `main`.
   - Root directory: `/server` (if deploying backend only) or create separate services for `client` and `server`.

2. Managed PostgreSQL:
   - Create a new PostgreSQL instance in Render.
   - Copy the DATABASE_URL and add it to the Web Service environment variables.

3. Environment variables (add to Web Service settings):
   - DATABASE_URL (from managed Postgres)
   - NODE_ENV=production
   - JWT_SECRET (secure random string)
   - CORS_ORIGIN=* (or specific origin)

4. Build & Start commands:
   - Backend: `npm install && npm run migrate:up && npm start` (server folder)
   - Frontend (if separate service): `npm install && npm run build && npm run preview` (client folder)

5. Health check path: `/healthz`

Notes:
- The server runs migrations on startup (`npm run migrate:up`) and performs seeding if bookings table is empty.
- See `.env.example` for additional optional environment variables.

Files added/changed for Render support and new features:
- server/scripts/migrate.js (added platforms/products/locations/campaigns and altered bookings)
- server/scripts/seed.js (seeds 3 platforms)
- server/models/{Platform,Product,Location,Campaign}.js (new models)
- server/models/Booking.js (extended validations and fields)
- server/routes/{platforms,products,locations,campaigns}.js (new endpoints)
- server/index.js (mounted new routes; added /healthz)
- .env.example

After deployment, test:
- GET /healthz -> {"status":"ok"}
- GET /api/platforms -> list of 3 platforms (after seeding)

