# Frontend

## Development

`npm run dev` and `npm run start` both launch Vite and open the browser automatically.

If the browser does not appear, the app is usually still available at the local Vite URL shown in the terminal, typically `http://localhost:5173`.

## Login without backend

The app can run with mock APIs powered by MSW.

- Local development: MSW is enabled by default.
- Vercel preview/production: set `VITE_ENABLE_MSW=true` in Environment Variables, then redeploy.

With `VITE_ENABLE_MSW=true`, login and dashboard data are served from `src/mocks/handlers.ts` instead of a real backend.
