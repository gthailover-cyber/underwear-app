/**
 * LiveKit Token Server Example
 * 
 * This is a simple Express.js server that generates LiveKit access tokens.
 * Deploy this on your backend server (e.g., Vercel, Railway, Heroku, etc.)
 * 
 * Installation:
 * npm install express livekit-server-sdk dotenv cors
 */

import express from 'express';
import { AccessToken } from 'livekit-server-sdk';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'LiveKit Token Server' });
});

/**
 * Generate LiveKit Access Token
 * 
 * POST /api/livekit/token
 * Body: {
 *   roomName: string,
 *   participantName: string,
 *   isHost: boolean
 * }
 */
app.post('/api/livekit/token', async (req, res) => {
    try {
        const { roomName, participantName, isHost } = req.body;

        // Validation
        if (!roomName || !participantName) {
            return res.status(400).json({
                error: 'Missing required fields: roomName and participantName',
            });
        }

        // Get credentials from environment variables
        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;

        if (!apiKey || !apiSecret) {
            console.error('Missing LiveKit credentials in environment variables');
            return res.status(500).json({
                error: 'Server configuration error',
            });
        }

        // Create access token
        const at = new AccessToken(apiKey, apiSecret, {
            identity: participantName,
            // Token expires in 6 hours
            ttl: '6h',
        });

        // Grant permissions
        at.addGrant({
            room: roomName,
            roomJoin: true,
            canPublish: isHost, // Only host can publish video/audio
            canSubscribe: true, // Everyone can subscribe (watch)
            canPublishData: true, // Allow sending chat messages
        });

        // Generate JWT token
        const token = await at.toJwt();

        console.log(`[LiveKit] Token generated for ${participantName} in room ${roomName} (host: ${isHost})`);

        res.json({
            token,
            serverUrl: process.env.LIVEKIT_SERVER_URL || 'wss://your-project.livekit.cloud',
        });

    } catch (error) {
        console.error('[LiveKit] Token generation error:', error);
        res.status(500).json({
            error: 'Failed to generate token',
            message: error.message,
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 LiveKit Token Server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
    console.log(`🎫 Token endpoint: http://localhost:${PORT}/api/livekit/token`);
});

export default app;
