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

export const generateLiveKitToken = async (config: TokenGeneratorConfig): Promise<string> => {
    // In production, call your backend API to generate token
    // Example: const response = await fetch('/api/livekit/token', { ... });

    // For now, we'll use a placeholder that should be replaced with actual backend call
    const backendUrl = import.meta.env.VITE_LIVEKIT_TOKEN_URL || '/api/livekit/token';

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
            throw new Error('Failed to generate token');
        }

        const data = await response.json();
        return data.token;
    } catch (error) {
        console.error('[LiveKit] Token generation failed:', error);

        // If the error suggests connection refusal (backend not running)
        // Throw a specific error that LiveKitVideo can display nicely
        throw new Error('Could not connect to Token Server. Please run `npm start` in `server-example/` folder.');
    }
};

// Helper to get LiveKit server URL from environment
export const getLiveKitServerUrl = (): string => {
    return import.meta.env.VITE_LIVEKIT_SERVER_URL || 'wss://your-livekit-server.livekit.cloud';
};
