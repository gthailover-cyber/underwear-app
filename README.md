<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Men's Underwear Live Shop 🩲

A modern live streaming e-commerce platform with real-time video, chat, and shopping features.

## 🎥 Live Streaming Features

This app supports **3 streaming methods**:

1. **LiveKit** (Recommended) - Professional WebRTC streaming with ultra-low latency
2. **YouTube Live** - Free streaming with unlimited viewers
3. **Direct Video URL** - MP4 video streaming

## 🚀 Quick Start

**Prerequisites:** Node.js 18+

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your credentials:
   - LiveKit credentials (get from [cloud.livekit.io](https://cloud.livekit.io))
   - Supabase credentials (optional)

3. **Run the app:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   ```
   http://localhost:5173
   ```

## 📚 Documentation

- **[LiveKit Setup Guide](LIVEKIT_SETUP.md)** - Complete guide for LiveKit integration
- **[Backend Server](server-example/README.md)** - Token server setup and deployment

## 🎯 Features

- ✅ Real-time live streaming (LiveKit WebRTC)
- ✅ Live chat with emoji reactions
- ✅ Live shopping with product showcase
- ✅ Live auction system
- ✅ Virtual gifts and coins
- ✅ Multi-language support (EN/TH)
- ✅ Responsive mobile design

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS (via inline styles)
- **Live Streaming**: LiveKit (WebRTC)
- **Real-time**: Supabase Realtime
- **Icons**: Lucide React

## 📖 How to Use

1. Click "GO LIVE" button
2. Choose streaming method (LiveKit recommended)
3. Enter live title
4. Click "START LIVE NOW"
5. Allow camera and microphone access
6. Start streaming!

## 🌐 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
```

### Backend Token Server
See [server-example/README.md](server-example/README.md) for deployment options.

## 📝 License

MIT

---

Made with ❤️ using LiveKit + React

