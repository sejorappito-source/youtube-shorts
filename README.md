# YouTube Shorts Generator - Complete Setup

Auto-generate and upload YouTube Shorts about money/finance tips using AI.

## Features

✅ **AI Script Generation** (OpenAI GPT-4)
✅ **Text-to-Speech** (ElevenLabs)
✅ **AI Background Images** (DALL-E)
✅ **Video Creation** (FFmpeg)
✅ **YouTube Upload** (YouTube API)
✅ **Auto-Scheduling** (Daily/Weekly/Hourly)
✅ **Analytics Tracking**

---

## Quick Start (5 Minutes)

### 1. Install Dependencies

```bash
cd ~/youtube-shorts
npm install
```

### 2. Get API Keys

#### OpenAI (GPT-4 + DALL-E)
- Go to: https://platform.openai.com/api-keys
- Create new secret key
- Copy: `sk_test_...`

#### ElevenLabs (Text-to-Speech)
- Go to: https://elevenlabs.io
- Sign up free
- Get API key from dashboard

#### YouTube API
- Go to: https://console.cloud.google.com
- Create new project
- Enable YouTube Data API v3
- Create OAuth 2.0 credentials
- Get: Client ID, Client Secret

### 3. Create .env File

```bash
cat > .env << 'EOF'
# OpenAI
OPENAI_API_KEY=sk_test_your_key_here

# ElevenLabs
ELEVENLABS_API_KEY=your_elevenlabs_key

# YouTube OAuth
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
YOUTUBE_REFRESH_TOKEN=your_refresh_token

# Server
PORT=3000
NODE_ENV=development
EOF
```

### 4. Authenticate YouTube

```bash
npm run auth
# Follow the link in console
# Paste authorization code
# Copy refresh token to .env
```

### 5. Generate Your First Video

```bash
# Generate video on demand
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "The 50/30/20 budgeting rule", "duration": 60}'

# Or generate and upload
curl -X POST http://localhost:3000/api/create-and-upload \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "How to start investing",
    "title": "💰 Investing for Beginners",
    "description": "Learn how to start investing today",
    "tags": ["investing", "money", "finance"]
  }'
```

### 6. Schedule Daily Videos

```bash
curl -X POST http://localhost:3000/api/schedule \
  -H "Content-Type: application/json" \
  -d '{"frequency": "daily", "time": "09:00"}'
```

---

## API Endpoints

### Generate Video
```bash
POST /api/generate
{
  "topic": "Money topic",
  "duration": 60
}
```

### Upload to YouTube
```bash
POST /api/upload
{
  "videoPath": "/path/to/video.mp4",
  "title": "Video Title",
  "description": "Description",
  "tags": ["tag1", "tag2"]
}
```

### Generate & Upload
```bash
POST /api/create-and-upload
{
  "topic": "Money topic",
  "title": "Video Title",
  "description": "Description",
  "tags": ["tag1", "tag2"],
  "duration": 60
}
```

### Schedule Videos
```bash
POST /api/schedule
{
  "frequency": "daily", // hourly, daily, weekly, twice-daily
  "time": "09:00"
}
```

### Health Check
```bash
GET /health
```

---

## Run Locally

```bash
# Development
npm run dev

# Generate video on demand
npm run generate

# Upload video
npm run upload

# Start scheduler
npm run schedule
```

---

## Deploy on Render

### 1. Push to GitHub
```bash
git add .
git commit -m "YouTube Shorts generator"
git push origin main
```

### 2. Create on Render
- Go to: https://dashboard.render.com
- New → Web Service
- Connect GitHub
- Name: `youtube-shorts`
- Build: `npm install`
- Start: `npm run dev`
- Environment: Add all variables from .env

### 3. Configure YouTube
- Set callback URL in Google Console:
  ```
  https://youtube-shorts.onrender.com/auth/callback
  ```

### 4. Deploy ✅
Your app is live!

---

## How It Works

### Video Generation Flow

1. **Script Generation**
   ```
   User Topic → GPT-4 → Engaging Script (max 100 words)
   ```

2. **Audio Creation**
   ```
   Script → ElevenLabs → Professional Voiceover (MP3)
   ```

3. **Background Image**
   ```
   Topic → DALL-E → 1080x1920 YouTube Shorts image
   ```

4. **Video Composition**
   ```
   Image + Audio → FFmpeg → MP4 Video (1080x1920)
   ```

5. **YouTube Upload**
   ```
   Video → YouTube API → Live Video
   ```

---

## Money Topics (Pre-loaded)

- The 50/30/20 budgeting rule
- How to start investing with $100
- Emergency fund: Your financial safety net
- Compound interest: Money working for you
- Passive income ideas for beginners
- How to negotiate your salary
- Cryptocurrency basics
- Real estate investment tips
- Stock market for beginners
- Paying off debt fast
- Retirement planning 101
- Tax optimization strategies
- Side hustles to earn money
- How to build wealth
- Financial independence secrets

---

## Make Money from YouTube Shorts

### YouTube Partner Program
- 1,000 subscribers
- 10 million Shorts views (90 days)
- YouTube Shorts Fund (invite-only)

### Revenue Streams
1. **Ad Revenue** - YouTube shows ads, you earn 55%
2. **Shorts Fund** - Direct payments ($100-$10,000)
3. **Sponsorships** - Brand deals
4. **Affiliate Marketing** - Link to finance products
5. **Digital Products** - Courses, ebooks

### Optimization Tips
- Post consistently (daily helps)
- Use trending sounds
- Strong hooks in first 3 seconds
- Clear call-to-action
- Vertical format (1080x1920)
- Hashtags: #Shorts #MakeMoney #Finance

---

## Troubleshooting

### "OpenAI API error"
- Check API key is valid
- Verify account has credits
- Check rate limits

### "FFmpeg not found"
```bash
# macOS
brew install ffmpeg

# Ubuntu
sudo apt install ffmpeg

# Windows
choco install ffmpeg
```

### "YouTube upload fails"
- Verify refresh token is valid
- Check OAuth credentials
- Ensure channel allows uploads

### "No audio in video"
- ElevenLabs API key invalid
- Check voiceover file exists
- Verify FFmpeg audio settings

---

## Next Steps

1. ✅ Get API keys
2. ✅ Create .env file
3. ✅ Run locally: `npm run dev`
4. ✅ Generate first video
5. ✅ Upload to YouTube
6. ✅ Schedule daily videos
7. ✅ Deploy on Render
8. ✅ Monitor analytics
9. ✅ Grow audience
10. ✅ Make money! 💰

---

## Monetization Timeline

| Milestone | Time | Revenue |
|-----------|------|---------|
| 100 Shorts | Week 1 | $0 |
| 1,000 subscribers | Month 1-2 | $0 |
| 10M views (90d) | Month 2-3 | $100-500 |
| 100K subscribers | Month 3-4 | $500-2,000 |
| 1M subscribers | Month 6-12 | $2,000-10,000 |

---

## Resources

- [YouTube Shorts Creator Guide](https://support.google.com/youtube/answer/10059670)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [ElevenLabs Docs](https://elevenlabs.io/docs)
- [YouTube Data API](https://developers.google.com/youtube/v3)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)

---

**Start generating Shorts and earning money today!** 💰🎬
