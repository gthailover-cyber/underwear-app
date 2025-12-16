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

    useEffect(() => {
        let mounted = true;
        let room: Room | null = null;

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

                room = connectedRoom;

                // --- TRACK ATTACH HELPER ---
                const tryAttach = (track: Track) => {
                    if (track.kind === Track.Kind.Video && videoRef.current) {
                        track.attach(videoRef.current);
                        // Auto-play attempt
                        videoRef.current.play().catch(e => {
                            console.log("Autoplay blocked/failed, retrying muted:", e);
                            if (videoRef.current) {
                                videoRef.current.muted = true;
                                videoRef.current.play().catch(e2 => console.error("Muted autoplay also failed:", e2));
                            }
                        });
                    }
                };

                // --- HOST LOGIC ---
                if (isHost) {
                    await liveKitService.enableCamera(true);
                    await liveKitService.enableMicrophone(true);

                    // Retry attachment check
                    setTimeout(() => {
                        if (!connectedRoom.localParticipant) return;
                        const pubs = Array.from(connectedRoom.localParticipant.videoTrackPublications.values());
                        const videoPub = pubs.find(p => p.kind === 'video');
                        if (videoPub && videoPub.track) {
                            tryAttach(videoPub.track);
                        }
                    }, 500);

                    liveKitService.on('local_track_published', ({ publication }: { publication: LocalTrackPublication }) => {
                        if (publication.kind === 'video' && publication.track) {
                            tryAttach(publication.track);
                        }
                    });
                }
                // --- VIEWER LOGIC ---
                else {
                    // Existing Tracks
                    const participants = Array.from(connectedRoom.remoteParticipants.values());
                    participants.forEach((participant) => {
                        participant.trackPublications.forEach((publication) => {
                            if (publication.track && publication.track.kind === Track.Kind.Video) {
                                tryAttach(publication.track);
                            }
                        });
                    });

                    // New Tracks
                    liveKitService.on('track_subscribed', ({ track }: { track: Track }) => {
                        if (track.kind === Track.Kind.Video) {
                            tryAttach(track);
                        }
                    });
                }

                setIsConnecting(false);
                onConnected?.();

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to connect';
                if (errorMessage.includes('Client initiated disconnect') || errorMessage.includes('cancelled')) return;

                console.error('[LiveKit] Connect Error:', err);
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

    // --- RENDER ---
    if (error) {
        return (
            <div className={`relative flex items-center justify-center bg-black ${className}`}>
                <div className="flex flex-col items-center justify-center p-6 bg-red-900/40 backdrop-blur-md rounded-2xl border border-red-500 m-4">
                    <div className="text-red-400 font-bold mb-2">Connection Failed</div>
                    <p className="text-xs text-red-200 mb-4 text-center">{error}</p>
                    <button onClick={() => window.location.reload()} className="bg-red-600 px-4 py-2 rounded text-white font-bold text-sm">Retry</button>
                </div>
            </div>
        );
    }

    if (isConnecting) {
        return (
            <div className={`flex items-center justify-center bg-gray-900 ${className}`}>
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
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
                muted={isHost} // Host mutes local video initially. Viewer tries unmuted, falls back to muted.
                className={`w-full h-full object-cover ${isHost ? 'scale-x-[-1]' : ''}`}
            />
        </div>
    );
};

export default LiveKitVideo;
