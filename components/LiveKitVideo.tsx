import React, { useEffect, useRef, useState } from 'react';
import { Room, Track, RemoteTrackPublication, RemoteParticipant, LocalTrackPublication } from 'livekit-client';
import { liveKitService } from '../services/livekit';
import { generateLiveKitToken } from '../services/livekitToken';

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

                const { token, serverUrl } = await generateLiveKitToken({
                    apiKey: '',
                    apiSecret: '',
                    roomName,
                    participantName,
                    isHost,
                });

                const connectedRoom = await liveKitService.connect({
                    serverUrl,
                    token,
                });

                if (!mounted) {
                    await liveKitService.disconnect();
                    return;
                }

                setRoom(connectedRoom);

                // --- HOST LOGIC ---
                if (isHost) {
                    console.log("[LiveKit] Host Mode: Enabling Camera/Mic...");
                    await liveKitService.enableCamera(true);
                    await liveKitService.enableMicrophone(true);

                    // Retry attachment after 1s to ensure video element is ready
                    setTimeout(() => {
                        if (!connectedRoom.localParticipant) return;
                        const pubs = Array.from(connectedRoom.localParticipant.videoTrackPublications.values());
                        const videoPub = pubs.find(p => p.kind === 'video');
                        if (videoPub && videoPub.track && videoRef.current) {
                            console.log("[LiveKit] Attaching Local Video (Initial)");
                            videoPub.track.attach(videoRef.current);
                        }
                    }, 1000);

                    // Listen for future publish events
                    liveKitService.on('local_track_published', ({ publication }: { publication: LocalTrackPublication }) => {
                        if (publication.kind === 'video' && videoRef.current) {
                            console.log("[LiveKit] Attaching Local Video (Event)");
                            publication.track?.attach(videoRef.current);
                        }
                    });
                }
                // --- VIEWER LOGIC ---
                else {
                    console.log("[LiveKit] Viewer Mode: Listening for tracks...");

                    // Attach existing remote tracks
                    const participants = Array.from(connectedRoom.remoteParticipants.values());
                    participants.forEach((participant) => {
                        participant.trackPublications.forEach((publication) => {
                            if (publication.track && publication.track.kind === Track.Kind.Video && videoRef.current) {
                                publication.track.attach(videoRef.current);
                            }
                        });
                    });

                    // Listen for NEW tracks
                    liveKitService.on('track_subscribed', ({ track }: { track: Track }) => {
                        console.log("[LiveKit] Remote track subscribed:", track.kind);
                        if (track.kind === Track.Kind.Video && videoRef.current) {
                            track.attach(videoRef.current);
                        }
                    });
                }

                setIsConnecting(false);
                onConnected?.();

            } catch (err) {
                console.error('[LiveKit] Connection error:', err);
                const errorMessage = err instanceof Error ? err.message : 'Failed to connect';

                // Ignore intentional disconnects
                if (errorMessage.includes('Client initiated disconnect') || errorMessage.includes('cancelled')) {
                    return;
                }

                setError(errorMessage);
                setIsConnecting(false);
                onError?.(err instanceof Error ? err : new Error(errorMessage));
            }
        };

        connectToRoom();

        return () => {
            mounted = false;
            liveKitService.disconnect().then(() => {
                onDisconnected?.();
            });
        };
    }, [roomName, isHost, participantName]);

    // Force Retry Handler
    const handleForcePlay = () => {
        if (!videoRef.current || !room) return;

        console.log("[LiveKit] Force Video Attachment Triggered");

        if (isHost) {
            const pubs = Array.from(room.localParticipant.videoTrackPublications.values());
            pubs.forEach(p => {
                if (p.track) {
                    p.track.attach(videoRef.current!);
                    console.log("Attached Local Track manually");
                }
            });
        } else {
            const participants = Array.from(room.remoteParticipants.values());
            participants.forEach(p => {
                Array.from(p.videoTrackPublications.values()).forEach(tp => {
                    if (tp.track) {
                        tp.track.attach(videoRef.current!);
                        console.log("Attached Remote Track manually");
                    }
                });
            });
        }

        videoRef.current.play()
            .then(() => console.log("Video playing forced success"))
            .catch(e => alert("Play Error: " + e.message));

        // Unmute for viewer to hear audio
        if (!isHost) {
            videoRef.current.muted = false;
        }
    };

    // --- RENDER ---
    if (error) {
        return (
            <div className={`relative flex items-center justify-center bg-black ${className}`}>
                <div className="flex flex-col items-center justify-center p-6 bg-red-900/40 backdrop-blur-md rounded-2xl border border-red-500 m-4">
                    <div className="text-red-400 font-bold mb-2">Connection Failed</div>
                    <code className="text-[10px] text-red-300 bg-black/60 p-2 rounded block mb-4">{error}</code>
                    <button onClick={() => window.location.reload()} className="bg-red-600 px-4 py-2 rounded text-white font-bold">Retry</button>
                </div>
            </div>
        );
    }

    if (isConnecting) {
        return (
            <div className={`flex items-center justify-center bg-gray-900 ${className}`}>
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <div className="text-white text-sm">Connecting...</div>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative w-full h-full bg-black ${className}`}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isHost} // Host mutes local video
                className={`w-full h-full object-cover ${isHost ? 'scale-x-[-1]' : ''}`}
            />

            {/* DEBUG INFO */}
            <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] p-2 rounded pointer-events-none font-mono z-50">
                <p>Status: Connected</p>
                <p>Role: {isHost ? 'Host' : 'Viewer'}</p>
                <p>Part: {room?.localParticipant?.identity}</p>
                <p>Tracks: {room?.localParticipant?.videoTrackPublications.size}</p>
            </div>

            {/* FORCE PLAY BUTTON */}
            <button
                className="absolute bottom-24 right-4 z-[9999] bg-blue-600 text-white px-4 py-2 text-sm font-bold rounded-full shadow-lg active:scale-95 flex items-center gap-2 hover:bg-blue-500 transition-colors cursor-pointer"
                onClick={handleForcePlay}
            >
                <span>▶ Force Video</span>
            </button>
        </div>
    );
};

export default LiveKitVideo;
