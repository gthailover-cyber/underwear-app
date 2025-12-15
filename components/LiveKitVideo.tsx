import React, { useEffect, useRef, useState } from 'react';
import { Room, Track, RemoteTrackPublication, RemoteParticipant } from 'livekit-client';
import { liveKitService } from '../services/livekit';
import { generateLiveKitToken, getLiveKitServerUrl } from '../services/livekitToken';

interface LiveKitVideoProps {
    roomName: string;
    isHost: boolean;
    participantName: string;
    onError?: (error: Error) => void;
    onConnected?: () => void;
    onDisconnected?: () => void;
    className?: string;
}

const LiveKitVideo: React.FC<LiveKitVideoProps> = ({
    roomName,
    isHost,
    participantName,
    onError,
    onConnected,
    onDisconnected,
    className = ''
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isConnecting, setIsConnecting] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [room, setRoom] = useState<Room | null>(null);

    useEffect(() => {
        let mounted = true;

        const connectToRoom = async () => {
            try {
                setIsConnecting(true);
                setError(null);

                // Generate token AND get serverUrl from backend
                const { token, serverUrl } = await generateLiveKitToken({
                    apiKey: '', // Will be handled by backend
                    apiSecret: '', // Will be handled by backend
                    roomName,
                    participantName,
                    isHost,
                });

                // Connect to LiveKit room using the URL from Backend
                const connectedRoom = await liveKitService.connect({
                    serverUrl,
                    token,
                });

                if (!mounted) {
                    await liveKitService.disconnect();
                    return;
                }

                setRoom(connectedRoom);

                // If host, enable camera and microphone
                // If host, enable camera and microphone
                if (isHost) {
                    console.log("Creating Local Tracks...");
                    await liveKitService.enableCamera(true);
                    await liveKitService.enableMicrophone(true);

                    // Wait for track to be published or find it if already exists
                    const pubs = Array.from(connectedRoom.localParticipant.videoTrackPublications.values());
                    const videoPub = pubs.find(p => p.kind === 'video' && p.source === 'camera');

                    if (videoPub && videoPub.track && videoRef.current) {
                        console.log("Attaching existing local video track");
                        videoPub.track.attach(videoRef.current);
                    }

                    // Also Listen for future publish events (Just in case it wasn't ready above)
                    liveKitService.on('local_track_published', ({ publication }: any) => {
                        if (publication.kind === 'video' && videoRef.current) {
                            console.log("Attaching new local video track");
                            publication.track?.attach(videoRef.current);
                        }
                    });

                } else {
                    // Viewer: Listen for remote tracks
                    const participants = Array.from(connectedRoom.remoteParticipants.values());
                    participants.forEach((participant) => {
                        attachParticipantTracks(participant);
                    });

                    // Listen for new tracks
                    liveKitService.on('track_subscribed', ({ track, participant }: any) => {
                        console.log("Remote track subscribed:", track.kind);
                        if (track.kind === Track.Kind.Video && videoRef.current) {
                            track.attach(videoRef.current);
                        }
                    });
                }

                setIsConnecting(false);
                onConnected?.();

            } catch (err) {
                console.error('[LiveKit] Connection error:', err);
                const errorMessage = err instanceof Error ? err.message : 'Failed to connect to live stream';

                // If it's a client disconnect (often React Strict Mode double-invoke), ignore it or retry quietly
                if (errorMessage.includes('Client initiated disconnect') || errorMessage.includes('cancelled')) {
                    console.log('[LiveKit] Ignored intentional disconnect during mount/unmount cycle.');
                    return;
                }

                setError(errorMessage);
                setIsConnecting(false);
                onError?.(err instanceof Error ? err : new Error(errorMessage));
            }
        };

        const attachParticipantTracks = (participant: RemoteParticipant) => {
            participant.trackPublications.forEach((publication: RemoteTrackPublication) => {
                if (publication.track && publication.track.kind === Track.Kind.Video && videoRef.current) {
                    publication.track.attach(videoRef.current);
                }
            });
        };

        connectToRoom();

        // Cleanup
        return () => {
            mounted = false;
            liveKitService.disconnect().then(() => {
                onDisconnected?.();
            });
        };
    }, [roomName, isHost, participantName]);

    // --- RENDER ---

    // 1. Error / Fallback State (Mock Mode)
    if (error) {
        return (
            <div className={`relative flex items-center justify-center bg-gray-900 ${className} overflow-hidden group`}>
                {/* Mock Video Background */}
                <video
                    src="https://assets.mixkit.co/videos/preview/mixkit-man-working-out-in-a-gym-22606-large.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                />

                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl border border-red-500/30 text-center max-w-[80%]">
                        <div className="text-red-400 font-bold mb-1">Demo Mode (Offline)</div>
                        <p className="text-gray-300 text-xs mb-2">
                            LiveKit credentials missing or invalid.
                            <br />Showing demo video instead.
                        </p>
                        <div className="bg-black/40 p-2 rounded text-[10px] text-gray-500 font-mono text-left">
                            {error}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 2. Connecting State
    if (isConnecting) {
        return (
            <div className={`flex items-center justify-center bg-gray-900 ${className}`}>
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="text-white font-bold">Connecting to live stream...</div>
                    <div className="text-gray-400 text-sm mt-2">Please wait</div>
                </div>
            </div>
        );
    }

    // 3. Connected State (Real LiveKit Video)
    return (
        <div className={`relative w-full h-full bg-black ${className}`}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isHost} // Mute local video to prevent echo
                className={`w-full h-full object-cover ${isHost ? 'scale-x-[-1]' : ''}`}
            />

            {/* DEBUG INFO (Temporary) */}
            <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] p-2 rounded pointer-events-none font-mono z-50">
                <p>Status: {isConnecting ? 'Connecting...' : 'Connected'}</p>
                <p>Role: {isHost ? 'Host' : 'Viewer'}</p>
                <p>Room: {room?.name || roomName}</p>
                <p>Participant: {room?.localParticipant?.identity}</p>
                <p>Remote Participants: {room?.remoteParticipants.size}</p>
                <p>Local Video Tracks: {room?.localParticipant?.videoTrackPublications.size}</p>
            </div>
        </div>
    );
};

export default LiveKitVideo;
