# LiveKit Integration Guide

## 🎥 การใช้งาน LiveKit สำหรับ Live Streaming

โปรเจคนี้รองรับการ live streaming แบบ real-time ผ่าน **LiveKit** ซึ่งเป็น WebRTC platform ที่มีประสิทธิภาพสูง

## 📋 ขั้นตอนการติดตั้ง

### 1. ติดตั้ง Dependencies

```bash
npm install
```

### 2. สร้างบัญชี LiveKit Cloud (ฟรี)

1. ไปที่ [https://cloud.livekit.io](https://cloud.livekit.io)
2. สมัครบัญชีใหม่ (ฟรี)
3. สร้าง Project ใหม่
4. คัดลอก **API Key**, **API Secret**, และ **WebSocket URL**

### 3. ตั้งค่า Environment Variables

สร้างไฟล์ `.env.local` และเพิ่มข้อมูลต่อไปนี้:

```env
# LiveKit Configuration
VITE_LIVEKIT_SERVER_URL=wss://your-project.livekit.cloud
VITE_LIVEKIT_TOKEN_URL=http://localhost:3000/api/livekit/token
```

### 4. สร้าง Backend API สำหรับ Token Generation

⚠️ **สำคัญ**: ห้ามเก็บ API Secret ใน Frontend!

คุณต้องสร้าง backend endpoint สำหรับ generate LiveKit token:

#### ตัวอย่าง Node.js/Express:

```bash
npm install livekit-server-sdk
```

```javascript
// server.js
import { AccessToken } from 'livekit-server-sdk';
import express from 'express';

const app = express();
app.use(express.json());

app.post('/api/livekit/token', async (req, res) => {
  const { roomName, participantName, isHost } = req.body;

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantName,
  });

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: isHost,
    canSubscribe: true,
  });

  const token = await at.toJwt();
  res.json({ token });
});

app.listen(3000, () => {
  console.log('Token server running on port 3000');
});
```

### 5. วิธีใช้งาน

1. **เริ่ม Live Stream**:
   - คลิกปุ่ม "GO LIVE"
   - เลือก "LiveKit" (Recommended)
   - ใส่ชื่อ Live
   - คลิก "START LIVE NOW"

2. **ระบบจะ**:
   - ขออนุญาตเข้าถึงกล้องและไมโครโฟน
   - เชื่อมต่อกับ LiveKit server
   - เริ่มถ่ายทอดสดแบบ real-time

## 🎯 คุณสมบัติ

- ✅ **Ultra-low latency**: ความหน่วงต่ำมาก (~200ms)
- ✅ **HD Quality**: คุณภาพ HD พร้อม adaptive bitrate
- ✅ **WebRTC**: ทำงานได้ทุก browser ที่รองรับ WebRTC
- ✅ **Scalable**: รองรับผู้ชมได้หลายพันคน
- ✅ **Free Tier**: ใช้งานฟรีได้ถึง 50GB/เดือน

## 🔄 ทางเลือกอื่น

หากไม่ต้องการใช้ LiveKit สามารถเลือกใช้:

1. **YouTube Live**: ฟรี, ไม่จำกัดผู้ชม (แต่มี latency สูงกว่า)
2. **Direct Video URL**: ใช้ไฟล์วิดีโอจาก server

## 🐛 แก้ปัญหา

### ไม่สามารถเชื่อมต่อได้

1. ตรวจสอบว่า `.env.local` มีค่าที่ถูกต้อง
2. ตรวจสอบว่า backend token server ทำงานอยู่
3. ตรวจสอบ browser console สำหรับ error messages

### กล้องไม่ทำงาน

1. ตรวจสอบว่า browser มีสิทธิ์เข้าถึงกล้อง
2. ลอง refresh หน้าเว็บ
3. ตรวจสอบว่าไม่มีแอปอื่นใช้กล้องอยู่

## 📚 เอกสารเพิ่มเติม

- [LiveKit Documentation](https://docs.livekit.io)
- [LiveKit React Components](https://docs.livekit.io/reference/components/react/)
- [LiveKit Server SDK](https://docs.livekit.io/reference/server/server-apis/)

## 💡 Tips

- ใช้ LiveKit สำหรับ live streaming แบบ professional
- ใช้ YouTube สำหรับ live streaming แบบง่าย ๆ ที่ไม่ต้องการ low latency
- สำหรับ production ควรใช้ LiveKit Cloud หรือ self-host LiveKit server

---

Made with ❤️ using LiveKit
