# Frontend

## Development

`npm run dev` and `npm run start` both launch Vite and open the browser automatically.

If the browser does not appear, the app is usually still available at the local Vite URL shown in the terminal, typically `http://localhost:5173`.

## Login without backend

The app can run with mock APIs powered by MSW.

- Local development: MSW is enabled by default.
- Vercel preview/production: set `VITE_ENABLE_MSW=true` in Environment Variables, then redeploy.
- Production fallback: if `VITE_API_BASE_URL` is not provided, MSW is enabled automatically so login and onboarding can still be tested before backend integration.

With `VITE_ENABLE_MSW=true`, login and dashboard data are served from `src/mocks/handlers.ts` instead of a real backend.

## Login with backend (direct mode)

Use `VITE_API_BASE_URL` to bypass local mock handlers and call Spring directly.

1. Create `frontend/.env.local`.
2. Add `VITE_API_BASE_URL=http://localhost:8080`.
3. Run `npm run dev`.

In this mode, login requests are sent to `http://localhost:8080/auth/login-jwt`.

## Vercel deployment with backend

When the frontend is served over HTTPS (Vercel), do not use an absolute `http://...` API base URL in production.

- Recommended `VITE_API_BASE_URL` on Vercel: `/haccp-cloud`
- Keep rewrite rules in `vercel.json` so `/haccp-cloud/auth/*` and `/haccp-cloud/api/*` are forwarded to the backend origin

This prevents browser mixed-content blocking and keeps requests on same-origin HTTPS from the browser perspective.

### Mocking precedence

- `VITE_ENABLE_MSW=true`: always use MSW.
- `VITE_ENABLE_MSW=false`: always disable MSW.
- no explicit `VITE_ENABLE_MSW` and `VITE_API_BASE_URL` is set: disable MSW and call backend directly.
- no explicit `VITE_ENABLE_MSW` and no `VITE_API_BASE_URL`: enable MSW.
