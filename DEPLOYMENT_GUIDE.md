# 🚀 Complete Nexus Deployment Guide for 30 Users

## 📋 Overview

**Nexus** is a multi-platform memory & AI assistant with:
- **Mobile App** (React Native/Expo) - Primary user interface
- **Backend API** (Node.js + Express + Redis) - AI processing & queue system
- **Web Frontend** (React + Vite) - Web interface
- **Chrome Extension** - Browser integration

---

## 🏗️ Architecture

```
┌─────────────────┐
│  Mobile App     │────┐
│  (Android APK)  │    │
└─────────────────┘    │
                       │
┌─────────────────┐    │     ┌──────────────────┐     ┌─────────────┐
│  Web Frontend   │────┼────→│  Backend Server  │────→│  Supabase   │
│  (Netlify)      │    │     │  (Railway/Render)│     │  (Database) │
└─────────────────┘    │     └──────────────────┘     └─────────────┘
                       │              ↓
┌─────────────────┐    │     ┌──────────────────┐
│  Extension      │────┘     │  Redis Queue     │
│  (Chrome)       │          │  (Upstash)       │
└─────────────────┘          └──────────────────┘
```

---

## 📱 PART 1: Generate Android APK

### Prerequisites
```powershell
# Install Node.js v20.19.4 (required)
# Download from: https://nodejs.org/

# Install EAS CLI globally
npm install -g eas-cli

# Install dependencies
cd mobilef
npm install --legacy-peer-deps
```

### Step 1: Setup Expo Account
```powershell
# Login to Expo (create account if needed at https://expo.dev)
eas login
```

### Step 2: Configure Mobile App Environment

Update `mobilef/app.json` with your production backend URL:

```json
{
  "expo": {
    "extra": {
      "SUPABASE_URL": "https://zdibotjktsxkrokgipya.supabase.co",
      "SUPABASE_ANON_KEY": "your_supabase_anon_key_here"
    }
  }
}
```

Update `mobilef/utils/config.js` production URL:
```javascript
prod: {
  BACKEND_URL: 'https://your-backend-url.railway.app', // Update after deploying backend
  SUPABASE_URL: Constants.expoConfig?.extra?.SUPABASE_URL,
  SUPABASE_KEY: Constants.expoConfig?.extra?.SUPABASE_ANON_KEY,
},
```

### Step 3: Build APK

```powershell
cd mobilef

# Configure EAS Build (first time only)
eas build:configure

# Build APK for testing (preview build)
eas build --platform android --profile preview

# OR Build for production
# eas build --platform android --profile production
```

**Note**: The build happens on Expo's servers. You'll get a download link when complete (~10-15 minutes).

### Step 4: Download & Distribute APK

1. After build completes, you'll receive a download link
2. Download the APK file (e.g., `nexus-v1.0.0.apk`)
3. Share with your 30 testers via:
   - Google Drive
   - Firebase App Distribution
   - TestFlight (for iOS)
   - Direct download link

### Step 5: Install on Android Devices

**For Testers:**
1. Enable "Install from Unknown Sources" on Android
2. Download the APK
3. Install and open the app
4. Sign up/login with Supabase auth

---

## 🔧 PART 2: Deploy Backend Server

### Option A: Railway (Recommended - Free tier available)

#### Step 1: Prepare Backend
```powershell
cd Backend/Server

# Create .env file with your values
Copy-Item .env.template .env
# Edit .env with your actual keys
```

#### Step 2: Deploy to Railway

1. **Go to**: https://railway.app/
2. **Sign up** with GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Select**: `complete-nexus` repository
5. **Root Directory**: `/Backend/Server`
6. **Add Redis**: Click "New" → "Database" → "Add Redis"

#### Step 3: Configure Environment Variables

In Railway dashboard, add these environment variables:

```bash
# Supabase
SUPABASE_URL=https://zdibotjktsxkrokgipya.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

# Gemini AI
GEMINI_API_KEY=your_GEMINI_API_KEY

# Redis (Railway provides this automatically)
REDIS_URL=${{Redis.REDIS_URL}}

# Server
PORT=3001
NODE_ENV=production
```

#### Step 4: Deploy Commands

In Railway, set these build/start commands:
```bash
# Build Command: (leave empty)
# Start Command:
npm install && npm start
```

#### Step 5: Get Your Backend URL

After deployment:
- Railway will provide a URL like: `https://your-app.railway.app`
- Copy this URL for mobile app configuration

### Option B: Render.com (Free) + Upstash Redis

Render's free tier supports a Node web service (it may sleep when idle). Use Upstash for Redis (free).

1. **Go to**: https://render.com/
2. **New** → **Web Service**
3. **Connect**: Your GitHub repo
4. **Service Settings**:
  - **Root Directory**: `Backend/Server`
  - Leave build blank (Render auto-installs via Node)
  - **Start Command**: `npm start`
  - **Environment**: Node 20
5. **Create a Worker** (Background Service): New → Background Worker
  - **Root Directory**: `Backend/Server`
  - **Start Command**: `npm run worker`
6. **Redis**: Create at https://upstash.com (free). Copy the Redis URL and set `REDIS_URL` in both services.
7. **Environment Variables** (both services):
  ```
  SUPABASE_URL=https://zdibotjktsxkrokgipya.supabase.co
  SUPABASE_ANON_KEY=your_supabase_anon_key
  GEMINI_API_KEY=your_GEMINI_API_KEY
  REDIS_URL=redis://default:PASSWORD@HOST.upstash.io:6379
  PORT=3001
  NODE_ENV=production
  ```
8. **Deploy** and copy the Render Web Service URL for the mobile app

Tip: You can also select "Use Docker" and Render will build using the provided `Backend/Server/Dockerfile`.

### Option C: Fly.io (Free) + Upstash Redis

Fly provides always-on micro-VMs with a generous free tier.

1. Install Fly CLI and login:
  ```bash
  winget install flyctl  # Windows
  fly auth signup
  ```
2. Deploy API:
  ```bash
  cd Backend/Server
  fly launch --no-deploy --name nexus-api-<yourname> --copy-config
  # When asked, select Dockerfile, set internal port: 3001
  fly secrets set \
    SUPABASE_URL=https://zdibotjktsxkrokgipya.supabase.co \
    SUPABASE_ANON_KEY=your_supabase_anon_key \
    GEMINI_API_KEY=AIza_your_key \
    REDIS_URL=redis://default:PASS@HOST.upstash.io:6379 \
    NODE_ENV=production
  fly deploy
  ```
3. Deploy Worker (separate app):
  ```bash
  fly launch --no-deploy --name nexus-worker-<yourname> --copy-config
  # Edit fly.toml to set the command:
  # [processes]
  #   app = "npm run worker"
  fly secrets set (same vars as above)
  fly deploy -i .  # uses Dockerfile.worker if you specify: fly deploy -c fly.worker.toml
  ```
4. Use Upstash for Redis and set `REDIS_URL` in both apps.

### Option D: Koyeb (Free) + Upstash Redis

1. Go to https://www.koyeb.com/ → Create Service → Deploy from GitHub
2. Repo root: `Backend/Server`
3. Runtime: Docker (uses provided `Dockerfile`)
4. Env Vars: same as above (including `PORT=3001`)
5. Create a second service for the Worker using `Dockerfile.worker` and command `npm run worker`
6. Provide Upstash `REDIS_URL` to both services
7. Deploy and use the Koyeb URL in the mobile app

---

## 🌐 PART 3: Deploy Web Frontend (Optional)

### Deploy to Netlify

#### Step 1: Prepare Frontend
```powershell
cd Frontend

# Create .env file
Copy-Item .env.template .env
# Edit with your production backend URL
```

Update `Frontend/.env`:
```env
VITE_SUPABASE_URL=https://zdibotjktsxkrokgipya.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=https://your-backend.railway.app
VITE_ENV=production
```

#### Step 2: Deploy

```powershell
# Install Netlify CLI
npm install -g netlify-cli

# Build
cd Frontend
npm install
npm run build

# Deploy
netlify deploy --prod
```

OR use Netlify's GitHub integration:
1. Go to https://netlify.com/
2. "New site from Git"
3. Select `complete-nexus` repo
4. **Build command**: `npm run build`
5. **Publish directory**: `dist`
6. **Base directory**: `Frontend`
7. Add environment variables in Netlify dashboard

---

## 📦 PART 4: Setup Infrastructure Services

### 1. Supabase (Database & Auth)

**Already configured!** But verify:
1. Go to: https://supabase.com/dashboard
2. Your project: `zdibotjktsxkrokgipya`
3. **Verify Tables** exist:
   - `memories`
   - `profiles`
   - `mood_logs`
   - `chat_sessions`

Run the schema if needed:
```sql
-- Located in: Backend/Database/schema.sql
-- Execute in Supabase SQL Editor
```

### 2. Redis Queue (Required for Backend)

#### Option A: Upstash (Recommended - Free tier)

1. **Go to**: https://upstash.com/
2. **Create Redis Database**
3. **Copy Redis URL**: `redis://default:password@host.upstash.io:6379`
4. **Update** in Railway/Render environment variables

#### Option B: Managed Redis from your host
- Some hosts offer paid Redis. For free/testing, prefer Upstash.

### 3. Gemini API Key (AI Processing)

1. **Go to**: https://console.Gemini.com/
2. **Create Account**
3. **API Keys** → **Create New Key**
4. **Copy** and add to backend environment variables

---

## 🔄 PART 5: Update Mobile App with Backend URL

After deploying backend, update mobile app:

### Method 1: Rebuild APK
```powershell
cd mobilef

# Update config.js with production URL
# Then rebuild
eas build --platform android --profile preview
```

### Method 2: Use Environment Variables (Advanced)

Update `app.json`:
```json
{
  "expo": {
    "extra": {
      "BACKEND_URL": "https://your-backend.railway.app",
      "SUPABASE_URL": "https://zdibotjktsxkrokgipya.supabase.co",
      "SUPABASE_ANON_KEY": "your_key"
    }
  }
}
```

---

## 🧪 PART 6: Testing with 30 Users

### Pre-Launch Checklist

- [ ] Backend deployed and accessible
- [ ] Redis queue working (check Railway logs)
- [ ] Supabase tables created
- [ ] Mobile APK built and downloaded
- [ ] Environment variables set correctly
- [ ] Test account created in Supabase

### Testing Steps

1. **Install APK** on test devices (or your own device first)
2. **Create Account** via Supabase auth
3. **Test Core Features**:
   - [ ] Sign up / Login
   - [ ] Add memory (text)
   - [ ] Add memory from shared URL
   - [ ] Search memories
   - [ ] AI Chat
   - [ ] View timeline
   - [ ] Edit/Delete memory

### Distribution to Testers

#### Method 1: Google Drive
```powershell
# Upload APK to Google Drive
# Share link with testers
# Provide installation instructions
```

#### Method 2: Firebase App Distribution
1. Go to: https://firebase.google.com/
2. Add Android app
3. Use Firebase CLI to upload APK
```powershell
firebase appdistribution:distribute nexus.apk --app YOUR_APP_ID --groups testers
```

### Provide Testers With:

**Installation Guide for Testers:**
```
1. Download Nexus APK from [link]
2. On your Android device:
   - Settings → Security → Enable "Install from Unknown Sources"
3. Open downloaded APK file
4. Click "Install"
5. Open Nexus app
6. Sign up with email/password
7. Start adding memories!

Support: your-email@domain.com
```

---

## 📊 PART 7: Monitor & Maintain

### Check Backend Health

```powershell
# Test API endpoint
curl https://your-backend.railway.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-16T10:30:00.000Z",
  "redis": "connected"
}
```

### Monitor Railway Logs

1. Railway Dashboard → Your Service
2. **Logs** tab
3. Watch for errors/issues

### Monitor Redis Queue

Check `Backend/Server/monitoring.js`:
```powershell
# If running monitoring server
npm run monitor
# Then visit: http://localhost:3002
```

### User Feedback Collection

Create a feedback form:
- Google Forms
- Typeform
- Built into app (future enhancement)

---

## 🐛 Common Issues & Solutions

### Issue 1: APK Installation Blocked
**Solution**: Enable "Install from Unknown Sources" in Android settings

### Issue 2: App Can't Connect to Backend
**Solution**: 
- Verify backend URL in `config.js`
- Check Railway deployment status
- Test backend health endpoint

### Issue 3: Redis Connection Errors
**Solution**:
- Verify Redis URL in environment variables
- Check Upstash/Railway Redis status
- Restart backend service

### Issue 4: Supabase Auth Errors
**Solution**:
- Verify Supabase URL and anon key
- Check Supabase dashboard for auth settings
- Enable Email auth provider in Supabase

### Issue 5: APK Build Fails
**Solution**:
```powershell
# Clear Expo cache
cd mobilef
expo start -c

# Clear node modules
Remove-Item -Recurse -Force node_modules
npm install --legacy-peer-deps

# Try build again
eas build --platform android --profile preview --clear-cache
```

---

## 💰 Cost Estimate (Free Tier)

| Service | Free Tier | Cost After |
|---------|-----------|------------|
| **Railway** | $5 credit/month | $5-20/month |
| **Supabase** | 500MB DB, 50k users | $25/month |
| **Upstash Redis** | 10k commands/day | $0.20/100k |
| **Netlify** | 100GB bandwidth | $19/month |
| **Expo EAS** | 30 builds/month | $29/month |
| **Gemini API** | Free beta | TBD |

**Total for 30 users**: **FREE** (within limits)

---

## 🚀 Quick Start Commands

### Deploy Everything
```powershell
# 1. Deploy Backend (Railway)
# - Follow Railway section above

# 2. Build Mobile APK
cd mobilef
npm install --legacy-peer-deps
eas login
eas build --platform android --profile preview

# 3. Deploy Frontend (optional)
cd ../Frontend
npm install
npm run build
netlify deploy --prod

# 4. Distribute APK to testers
# - Download from Expo dashboard
# - Share via Google Drive/Firebase
```

---

## 📞 Support & Contact

- **GitHub Issues**: https://github.com/zishandeshmukh/complete-nexus/issues
- **Email**: your-email@domain.com
- **Documentation**: This file

---

## 🎯 Next Steps After Testing

1. **Collect Feedback** from 30 users
2. **Fix Bugs** based on feedback
3. **Improve Features**
4. **Scale Infrastructure** (if needed)
5. **Publish to Google Play Store** (for wider distribution)
6. **Add Analytics** (Firebase Analytics, Mixpanel)
7. **Implement Push Notifications** (Expo Push)

---

## 📝 Notes

- Backend uses **queue system** (BullMQ + Redis) for reliable AI processing
- Mobile app supports **offline mode** with async sync
- Rate limited to **20 memories/minute per user** (configurable in backend)
- All components use **same Supabase instance** for auth/data

---

**Last Updated**: December 16, 2025
**Version**: 1.0.0
**Status**: Ready for Testing ✅
# deployment guide file