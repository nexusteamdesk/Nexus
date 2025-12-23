# 🚀 Nexus - AI-Powered Personal Memory Assistant

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20Web%20%7C%20Chrome-blue)]()
[![Status](https://img.shields.io/badge/Status-Beta%20Testing-orange)]()

> **Never forget anything important again.** Nexus intelligently organizes your digital memories, insights, and discoveries with AI-powered analysis and retrieval.

---

## 📱 What is Nexus?

Nexus is a multi-platform personal memory assistant that helps you:
- 🧠 **Capture** thoughts, articles, videos, and social media posts
- 🤖 **Enhance** content with AI analysis and insights
- 🔍 **Search** through your memories using natural language
- 💬 **Chat** with AI about your saved content
- 📊 **Track** your mood and knowledge over time
- 🔗 **Share** from any app directly to Nexus

---

## ✨ Features

### Core Capabilities
- ✅ **Universal Content Capture**: Save from Twitter/X, YouTube, Instagram, LinkedIn, Reddit, and any website
- ✅ **AI Analysis**: Automatic summary, key points extraction, sentiment analysis
- ✅ **Hybrid Processing**: AI-powered analysis with local NLP fallback (never fails!)
- ✅ **Intelligent Search**: Find memories by keyword, tag, or semantic meaning
- ✅ **AI Chat**: Ask questions about your saved content (Coming Soon)
- ✅ **Mood Tracking**: Track emotional patterns over time
- ✅ **Timeline View**: Visual chronological organization
- ✅ **Offline Support**: Works without internet, syncs when online
- ✅ **Cross-Platform**: Android app, Web interface, Chrome extension

### Technical Highlights
- 🔐 Secure authentication with Supabase
- ⚡ Fast AI processing with Google Gemini
- 🧠 **Local NLP fallback** - TF-IDF keywords, sentiment analysis, extractive summaries
- � **Smart URL extraction** - Auto-fetches content from shared links (YouTube, Twitter, etc.)
- �📡 Queue-based architecture for reliability (BullMQ + Redis)
- 🎨 Beautiful dark-mode UI (Flutter + React/Tailwind)
- 🔄 Real-time sync across devices

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Interfaces                       │
├──────────────┬──────────────┬──────────────┬────────────┤
│  Mobile App  │ Web Frontend │  Extension   │   Future   │
│  (Flutter)   │  (React +    │  (Chrome)    │   (iOS)    │
│              │   Vite)      │              │            │
└──────┬───────┴──────┬───────┴──────┬───────┴────────────┘
       │              │              │
       └──────────────┼──────────────┘
                      │
              ┌───────▼────────┐
              │  Backend API   │
              │  (Express.js)  │
              └───────┬────────┘
                      │
        ┏━━━━━━━━━━━━━┻━━━━━━━━━━━━━┓
        ┃                           ┃
   ┌────▼─────┐              ┌──────▼───────┐
   │ Supabase │              │ Redis Queue  │
   │ Database │              │ (BullMQ)     │
   │ + Auth   │              └──────┬───────┘
   └──────────┘                     │
                             ┌──────▼───────┐
                             │ Worker Pool  │
                             └──────┬───────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
             ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
             │  Gemini AI    │ │  NLP Local  │ │  Fallback   │
             │  (Primary)  │ │  (Fallback) │ │  (Basic)    │
             │  Flash 1.5    │ │  TF-IDF +   │ │  First line │
             │             │ │  Sentiment  │ │             │
             └─────────────┘ └─────────────┘ └─────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v20.19.4+
- npm or pnpm
- Supabase account
- Gemini API key
- Redis instance (Upstash/Railway)
- Expo account (for mobile builds)

### 1. Clone Repository
```bash
git clone https://github.com/zishandeshmukh/complete-nexus.git
cd complete-nexus
```

### 2. Setup Backend
```bash
cd Backend/Server
npm install

# Configure environment
cp .env.template .env
# Edit .env with your keys:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - GEMINI_API_KEY
# - REDIS_URL

# Start server
npm start

# In another terminal, start worker
npm run worker
```

### 3. Setup Mobile App
```bash
cd mobilef
npm install --legacy-peer-deps

# Update app.json with your Supabase credentials
# Start development
npm start

# For Android
npm run android

# To build APK
eas build --platform android --profile preview
```

### 4. Setup Web Frontend
```bash
cd Frontend
npm install

# Configure environment
cp .env.template .env
# Edit with backend URL and Supabase keys

# Start development
npm run dev

# Build for production
npm run build
```

---

## 📦 Project Structure

```
complete-nexus/
├── Backend/
│   ├── Database/
│   │   ├── schema.sql              # Supabase database schema
│   │   └── indexes.sql             # Performance indexes
│   └── Server/
│       ├── gemini_server.js        # Main API server
│       ├── worker.js               # Background job processor (AI + NLP)
│       ├── nlpProcessor.js         # 🆕 Local NLP fallback processor
│       ├── urlExtractor.js         # 🆕 URL content extraction for mobile shares
│       ├── geminiKeyRotation.js    # Gemini API key rotation
│       ├── monitoring.js           # Queue monitoring
│       └── package.json
├── Frontend/
│   ├── client/
│   │   ├── components/             # React components
│   │   ├── pages/                  # Page components
│   │   ├── services/               # API services
│   │   └── lib/                    # Utilities
│   └── package.json
├── nexus_flutter/                   # 🆕 Flutter mobile app
│   ├── lib/
│   │   ├── screens/                # App screens
│   │   ├── widgets/                # Reusable widgets
│   │   ├── services/               # Backend services
│   │   └── providers/              # State management
│   └── pubspec.yaml
├── Extension/
│   ├── content.js                  # Content script
│   ├── popup.js                    # Extension popup
│   ├── config.js                   # Configuration
│   └── manifest.json
├── DEPLOYMENT_GUIDE.md             # 🔥 Full deployment guide
├── TESTING_CHECKLIST.md            # 🧪 Testing guide
└── README.md                       # This file
```

---

## 🌐 Deployment

### Production Deployment Options

#### Backend: Railway / Render
```bash
# Railway (Recommended)
1. Push to GitHub
2. Connect Railway to repo
3. Add environment variables
4. Add Redis service
5. Deploy

# OR Render
1. Connect GitHub repo
2. Set build/start commands
3. Add environment variables
4. Add Redis service
5. Deploy
```

#### Frontend: Netlify / Vercel
```bash
# Build and deploy
npm run build
netlify deploy --prod

# OR connect GitHub repo to Netlify
```

#### Mobile: Expo EAS
```bash
# Build APK/IPA
eas build --platform android --profile production
eas build --platform ios --profile production

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

**📖 Full deployment guide**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

## 🧪 Testing

### For 30 User Testing
```bash
# 1. Deploy backend to Railway/Render
# 2. Build APK with production URL
# 3. Distribute to testers
# 4. Collect feedback

# Detailed testing steps in TESTING_CHECKLIST.md
```

**📋 Testing checklist**: See [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)

---

## 🛠️ Technology Stack

### Mobile App (Flutter)
- **Framework**: Flutter 3.x
- **State**: Provider + ChangeNotifier
- **Storage**: SharedPreferences + Supabase
- **Styling**: Material Design 3
- **Auth**: Supabase Auth

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js 5
- **Queue**: BullMQ + Redis
- **AI**: Google Generative AI (Gemini 1.5 Flash)
- **NLP Fallback**: natural, keyword-extractor, sentiment
- **Database**: Supabase (PostgreSQL)
- **File Upload**: Multer

### Web Frontend
- **Framework**: React 18 + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Routing**: React Router
- **State**: React Context
- **Auth**: Supabase Auth

### Chrome Extension
- **Manifest**: V3
- **Content Script**: Vanilla JS
- **Platform Detection**: Custom extractors
- **Readability**: Mozilla Readability

---

## 🔐 Environment Variables

### Backend (.env)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
GEMINI_API_KEYS=AIza_key1,AIza_key2,AIza_key3,AIza_key4,AIza_key5
REDIS_URL=rediss://your-redis-url
PORT=10000
NODE_ENV=production
USE_NLP_ONLY=false   # Set to 'true' for pure NLP mode (no AI API calls)
```

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=https://your-backend.railway.app
VITE_ENV=production
```

### Mobile (app.json)
```json
{
  "expo": {
    "extra": {
      "SUPABASE_URL": "https://your-project.supabase.co",
      "SUPABASE_ANON_KEY": "your_anon_key",
      "BACKEND_URL": "https://your-backend.railway.app"
    }
  }
}
```

---

## 📊 API Endpoints

### Health Check
```
GET /api/health
Response: { status: "healthy", timestamp: "..." }
```

### Add Memory
```
POST /api/memories/add
Body: { url, title, content, type, userId }
Response: { success: true, memoryId: "..." }
```

### Get Memories
```
GET /api/memories?userId=xxx
Response: { memories: [...] }
```

### Search
```
GET /api/memories/search?q=keyword&userId=xxx
Response: { results: [...] }
```

### AI Chat
```
POST /api/chat
Body: { message, userId, context }
Response: { response: "...", sources: [...] }
```

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Development Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation
- Keep commits atomic and meaningful

---

## 🐛 Bug Reports

Found a bug? Please open an issue with:
- Device/Platform info
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Gemini** - Powerful and fast AI inference
- **Supabase** - Backend as a Service
- **Expo** - React Native tooling
- **shadcn/ui** - Beautiful UI components
- **Railway** - Hosting infrastructure

---

## 📞 Contact & Support

- **GitHub**: [@zishandeshmukh](https://github.com/zishandeshmukh)
- **Issues**: [GitHub Issues](https://github.com/zishandeshmukh/complete-nexus/issues)
- **Email**: your-email@domain.com

---

## 🗺️ Roadmap

### Version 1.1
- [ ] iOS app
- [ ] Push notifications
- [ ] Collaborative memories
- [ ] Advanced analytics

### Version 1.2
- [ ] Voice memo support
- [ ] Image OCR
- [ ] Calendar integration
- [ ] Export to PDF

### Version 2.0
- [ ] Web clipper improvements
- [ ] AI-powered reminders
- [ ] Memory connections/graph
- [ ] Public memory sharing

---

## 📈 Current Status

- ✅ **Backend**: Production-ready
- ✅ **Mobile App**: Beta testing (30 users)
- ✅ **Web Frontend**: Beta
- ✅ **Chrome Extension**: Alpha
- 🚧 **iOS App**: Planned
- 🚧 **Play Store**: Coming soon

---

## 💡 Use Cases

- 📚 **Students**: Save lecture notes, research papers, study materials
- 💼 **Professionals**: Track industry news, articles, insights
- ✍️ **Writers**: Collect inspiration, quotes, references
- 🎓 **Researchers**: Organize sources, annotate findings
- 🧘 **Personal Growth**: Journal thoughts, track progress
- 📱 **Content Creators**: Save ideas, trends, inspiration

---

## ⚡ Performance

| Metric | Value |
|--------|-------|
| API Response | <500ms |
| AI Analysis | 2-5 seconds |
| NLP Fallback | <100ms |
| App Startup | <3 seconds |
| Search | <1 second |
| Offline Support | Full functionality |

---

## 🔒 Security & Privacy

- All data encrypted in transit (HTTPS)
- Supabase Row Level Security (RLS)
- No third-party tracking
- User data isolated per account
- Optional data export/deletion

---

## 🎯 Quick Links

- 📖 [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- 🧪 [Testing Checklist](./TESTING_CHECKLIST.md)
- 🗂️ [Database Schema](./Backend/Database/schema.sql)
- 📱 [Mobile App Status](./MOBILE_APP_STATUS.md)
- ⚙️ [Supabase Config](./SUPABASE_CONFIG.txt)

---

<div align="center">

**Built by [Zishan Deshmukh](https://github.com/zishandeshmukh)**

⭐ Star this repo if you find it helpful!

[Report Bug](https://github.com/zishandeshmukh/complete-nexus/issues) · [Request Feature](https://github.com/zishandeshmukh/complete-nexus/issues) · [Documentation](./DEPLOYMENT_GUIDE.md)

</div>
