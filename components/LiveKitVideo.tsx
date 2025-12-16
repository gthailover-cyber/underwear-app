import React, { useEffect, useRef, useState } from 'react';
import { Room, Track, LocalTrackPublication } from 'livekit-client';
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

                // --- TRACK ATTACH HELPER ---
                const tryAttach = (track: Track) => {
                    if (track.kind === Track.Kind.Video && videoRef.current) {
                        // CRITICAL: Ensure muted is set before attach on mobile
                        videoRef.current.muted = true;
                        track.attach(videoRef.current);
                        videoRef.current.play().catch(e => {
                            console.warn("Autoplay failed (will wait for user interaction):", e);
                        });
                    }
                };

                // --- HOST LOGIC ---
                if (isHost) {
                    await liveKitService.enableCamera(true, {
                        resolution: { width: 1280, height: 720 },
                        frameRate: 30,
                        // facingMode: 'user' // or 'environment' for back camera
                    });
                    await liveKitService.enableMicrophone(true);

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
                    const participants = Array.from(connectedRoom.remoteParticipants.values());
                    participants.forEach((participant) => {
                        participant.videoTrackPublications.forEach((publication) => {
                            // Prioritize Camera tracks, but accept any video track if needed
                            // We check `source === Track.Source.Camera` to be safe, but fallback to any video
                            if (publication.track && publication.track.kind === Track.Kind.Video) {
                                if (publication.source === Track.Source.Camera) {
                                    tryAttach(publication.track); // Best case
                                } else {
                                    // Screen share etc.
                                    tryAttach(publication.track);
                                }
                            }
                        });
                    });

                    // Listen for NEW tracks
                    liveKitService.on('track_subscribed', (track: Track, publication: any) => {
                        if (track.kind === Track.Kind.Video) {
                            tryAttach(track);
                        }
                    });
                }

                // --- POLLING FALLBACK (Robust Auto-Play) ---
                // Checks every 1s: If tracks exist but video isn't playing, force attach & play.
                const pollInterval = setInterval(() => {
                    if (!videoRef.current || !connectedRoom) return;
                    if (!videoRef.current.paused && videoRef.current.srcObject) return;

                    if (isHost) {
                        const pub = Array.from(connectedRoom.localParticipant.videoTrackPublications.values()).find(p => p.kind === 'video');
                        if (pub?.track) tryAttach(pub.track);
                    } else {
                        // Iterate ALL remote participants to find ANY video track
                        const participants = Array.from(connectedRoom.remoteParticipants.values());
                        for (const p of participants) {
                            // Try to find Camera track first
                            let pub = Array.from(p.videoTrackPublications.values())
                                .find(t => t.kind === 'video' && t.source === Track.Source.Camera);

                            // If no camera, take any video track
                            if (!pub) {
                                pub = Array.from(p.videoTrackPublications.values())
                                    .find(t => t.kind === 'video');
                            }

                            if (pub?.track) {
                                tryAttach(pub.track);
                                return; // Found one, good enough
                            }
                        }
                    }
                }, 1000);

                setIsConnecting(false);
                onConnected?.();

                // Cleanup polling on unmount
                return () => clearInterval(pollInterval);

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

    // Handle tap to unmute
    const handleVideoClick = () => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
            }
            videoRef.current.muted = !videoRef.current.muted;
        }
    };

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
                <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className={`relative w-full h-full bg-black ${className}`}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={true} // ALWAYS start muted
                onClick={handleVideoClick}
                itemProp="video" // Help Safari identify it
                className={`w-full h-full object-cover ${isHost ? 'scale-x-[-1]' : ''}`}
            />
        </div>
    );
};

export default LiveKitVideo;
