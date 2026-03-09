# TODO: Keep both localhost:5000 and Render URL for backend API

## Task: Configure frontend to work with both local and production backend URLs

### Steps:

1. [x] Analyze current project structure and API configuration
2. [x] Update `src/api.js` to explicitly support both URLs
3. [x] Update `vite.config.js` for proper environment variable handling
4. [x] Update `vercel.json` to correctly set production API URL
5. [x] Create `.env` file template for local development

### Completed Changes:

1. **`src/api.js`**: 
   - Added support for both `http://localhost:5000` and `https://qms-sjuv.onrender.com`
   - Uses `VITE_PREFERRED_API` environment variable to switch between backends
   - Exports `API_URLS` object with both URLs for flexible usage

2. **`src/mode.js`**: 
   - Updated to support both backend URLs
   - Uses same `VITE_PREFERRED_API` environment variable

3. **`vite.config.js`**: 
   - Added `VITE_PREFERRED_API` environment variable support

4. **`vercel.json`**: 
   - Fixed production API URL to use `https://qms-sjuv.onrender.com`
   - Set `VITE_PREFERRED_API` to `production` for Vercel builds

5. **`.env`**: 
   - Created template for local development with `VITE_PREFERRED_API=local`

### Usage:

**Local Development (default):**
- Uses `http://localhost:5000`
- Or set `VITE_PREFERRED_API=local` in `.env.local`

**Use Render backend locally:**
- Set `VITE_PREFERRED_API=production` in `.env.local`

**Production (Vercel):**
- Automatically uses `https://qms-sjuv.onrender.com`

### Notes:
- Local development: http://localhost:5000
- Production (Render): https://qms-sjuv.onrender.com
- Frontend deploys to: Vercel

