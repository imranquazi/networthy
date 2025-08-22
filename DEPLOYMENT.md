# 🚀 Networthy Deployment Guide

## Overview
This guide will help you deploy Networthy to production using:
- **Frontend**: Vercel (Next.js)
- **Backend**: Railway (Node.js)
- **Database**: Supabase (PostgreSQL)

## Prerequisites
- GitHub account
- Vercel account (free)
- Railway account (free tier available)
- Supabase account (free tier available)

---

## 📋 Step 1: Prepare Your Repository

### 1.1 Push to GitHub
```bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### 1.2 Fork/Clone Repository
Make sure your code is in a GitHub repository that you can access.

---

## 🔧 Step 2: Deploy Backend to Railway

### 2.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create a new project

### 2.2 Deploy Backend
1. **Connect Repository**: Select your GitHub repo
2. **Select Directory**: Choose `backend` folder
3. **Deploy**: Railway will automatically detect Node.js and deploy

### 2.3 Configure Environment Variables
In Railway dashboard, add these environment variables:

```bash
NODE_ENV=production
PORT=4000
PG_CONNECTION_STRING=your_supabase_connection_string
FRONTEND_URL=https://your-frontend-domain.vercel.app
YOUTUBE_API_KEY=your_youtube_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
SESSION_SECRET=your_random_session_secret
```

### 2.4 Get Backend URL
Railway will provide a URL like: `https://your-app-name.railway.app`

---

## 🎨 Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Import your repository

### 3.2 Deploy Frontend
1. **Import Repository**: Select your GitHub repo
2. **Framework Preset**: Next.js (auto-detected)
3. **Root Directory**: `frontend`
4. **Deploy**: Vercel will build and deploy

### 3.3 Configure Environment Variables
In Vercel dashboard, add:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-domain.railway.app
NEXT_PUBLIC_AUTH_USE_HTTPONLY_COOKIES=true
NEXT_PUBLIC_AUTH_DEBUG=false
```

### 3.4 Get Frontend URL
Vercel will provide a URL like: `https://your-app-name.vercel.app`

---

## 🗄️ Step 4: Set Up Production Database

### 4.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note your connection string

### 4.2 Update Railway Environment
Add your Supabase connection string to Railway:
```bash
PG_CONNECTION_STRING=postgresql://postgres:[password]@[host]:5432/postgres
```

---

## 🔐 Step 5: Configure OAuth Credentials

### 5.1 Google/YouTube OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create/update OAuth 2.0 credentials
3. Add authorized redirect URIs:
   - `https://your-backend-domain.railway.app/api/auth/google/callback`
4. Update Railway environment variables

### 5.2 Twitch OAuth
1. Go to [Twitch Developer Console](https://dev.twitch.tv/console)
2. Create/update application
3. Add redirect URI:
   - `https://your-backend-domain.railway.app/api/auth/twitch/callback`
4. Update Railway environment variables

### 5.3 TikTok OAuth
1. Go to [TikTok for Developers](https://developers.tiktok.com)
2. Create/update application
3. Add redirect URI:
   - `https://your-backend-domain.railway.app/api/auth/tiktok/callback`
4. Update Railway environment variables

---

## 🔄 Step 6: Update URLs

### 6.1 Update Frontend URL in Backend
In Railway, update `FRONTEND_URL` to your Vercel domain.

### 6.2 Update Backend URL in Frontend
In Vercel, update `NEXT_PUBLIC_API_URL` to your Railway domain.

---

## ✅ Step 7: Test Deployment

### 7.1 Test Backend
```bash
curl https://your-backend-domain.railway.app/api/health
```

### 7.2 Test Frontend
1. Visit your Vercel URL
2. Test registration/login
3. Test platform connections
4. Test dashboard functionality

---

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check `FRONTEND_URL` in Railway
   - Ensure URLs match exactly

2. **Database Connection**
   - Verify Supabase connection string
   - Check if database tables exist

3. **OAuth Errors**
   - Verify redirect URIs in OAuth apps
   - Check environment variables

4. **Build Errors**
   - Check Railway/Vercel logs
   - Verify package.json dependencies

### Debug Commands
```bash
# Check backend logs
railway logs

# Check frontend build
vercel logs

# Test API endpoints
curl -X GET https://your-backend-domain.railway.app/api/health
```

---

## 📊 Monitoring

### Railway Monitoring
- View logs in Railway dashboard
- Monitor resource usage
- Set up alerts

### Vercel Monitoring
- View build logs
- Monitor performance
- Set up analytics

---

## 🔄 Updates

### Deploy Updates
1. Push changes to GitHub
2. Railway/Vercel will auto-deploy
3. Monitor deployment logs

### Environment Changes
1. Update environment variables in respective platforms
2. Redeploy if necessary

---

## 🎉 Success!

Your Networthy application is now deployed to production!

- **Frontend**: https://your-app-name.vercel.app
- **Backend**: https://your-app-name.railway.app
- **Database**: Supabase (managed)

Remember to:
- Monitor logs regularly
- Set up proper domain names
- Configure SSL certificates
- Set up monitoring and alerts
