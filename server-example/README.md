# LiveKit Token Server

Backend server สำหรับ generate LiveKit access tokens

## 🚀 Quick Start

### 1. ติดตั้ง Dependencies

```bash
cd server-example
npm install
```

### 2. ตั้งค่า Environment Variables

สร้างไฟล์ `.env`:

```bash
cp .env.example .env
```

แก้ไขไฟล์ `.env` และใส่ข้อมูลจาก [LiveKit Cloud](https://cloud.livekit.io):

```env
LIVEKIT_API_KEY=your_api_key_here
LIVEKIT_API_SECRET=your_api_secret_here
LIVEKIT_SERVER_URL=wss://your-project.livekit.cloud
PORT=3000
```

### 3. รัน Server

```bash
npm start
```

หรือใช้ development mode (auto-reload):

```bash
npm run dev
```

Server จะทำงานที่ `http://localhost:3000`

## 📡 API Endpoints

### Health Check

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "service": "LiveKit Token Server"
}
```

### Generate Token

```
POST /api/livekit/token
Content-Type: application/json

{
  "roomName": "live-123456",
  "participantName": "Host",
  "isHost": true
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "serverUrl": "wss://your-project.livekit.cloud"
}
```

## 🌐 Deployment

### Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. เพิ่ม environment variables ใน Vercel dashboard

### Railway

1. Install Railway CLI:
```bash
npm i -g @railway/cli
```

2. Deploy:
```bash
railway up
```

3. เพิ่ม environment variables ใน Railway dashboard

### Heroku

1. Install Heroku CLI และ login

2. สร้าง app:
```bash
heroku create your-app-name
```

3. เพิ่ม environment variables:
```bash
heroku config:set LIVEKIT_API_KEY=your_key
heroku config:set LIVEKIT_API_SECRET=your_secret
heroku config:set LIVEKIT_SERVER_URL=wss://your-project.livekit.cloud
```

4. Deploy:
```bash
git push heroku main
```

## 🔒 Security Notes

- ⚠️ **ห้าม** commit ไฟล์ `.env` ลง git
- ⚠️ **ห้าม** เก็บ API Secret ใน frontend
- ✅ ใช้ HTTPS สำหรับ production
- ✅ เพิ่ม rate limiting ถ้าจำเป็น
- ✅ ตรวจสอบ CORS settings

## 📝 License

MIT
