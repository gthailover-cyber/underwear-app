// LiveKit Token Generator Helper
// Note: In production, tokens should be generated on your backend server
// This is a helper to generate tokens for development/testing

export interface TokenGeneratorConfig {
    apiKey: string;
    apiSecret: string;
    roomName: string;
    participantName: string;
    isHost?: boolean;
}

// For development: You can use LiveKit Cloud's sandbox token server
// Or generate tokens on your backend using LiveKit server SDK

// Update return type to include serverUrl
export const generateLiveKitToken = async (config: TokenGeneratorConfig): Promise<{ token: string, serverUrl: string }> => {
    // In production, call your backend API to generate token
    // Example: const response = await fetch('/api/livekit/token', { ... });

    // For now, we'll use a placeholder that should be replaced with actual backend call
    // Note: Pointing to port 3000 where backend server runs
    const backendUrl = import.meta.env.VITE_LIVEKIT_TOKEN_URL || 'http://localhost:3000/api/livekit/token';

    try {
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                roomName: config.roomName,
                participantName: config.participantName,
                isHost: config.isHost || false,
            }),
        });

        if (!response.ok) {
            console.warn("Backend token server not reachable, using local mock/dev behavior.");
            throw new Error('Backend not available');
        }

        const data = await response.json();

        // Ensure we get both token and serverUrl
        // The backend should return { token: "...", serverUrl: "wss://..." }
        return {
            token: data.token,
            serverUrl: data.serverUrl || import.meta.env.VITE_LIVEKIT_SERVER_URL
        };
    } catch (error) {
        console.error('[LiveKit] Token generation failed:', error);

        // If the error suggests connection refusal (backend not running)
        // Throw a specific error that LiveKitVideo can display nicely
        throw new Error('Could not connect to Token Server. Please run `npm start` in `server-example/` folder.');
    }
};

// Helper to get LiveKit server URL from environment (Fallback)
export const getLiveKitServerUrl = (): string => {
    return import.meta.env.VITE_LIVEKIT_SERVER_URL || 'wss://your-livekit-server.livekit.cloud';
};
