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

                // Generate token from backend
                const token = await generateLiveKitToken({
                    apiKey: '', // Will be handled by backend
                    apiSecret: '', // Will be handled by backend
                    roomName,
                    participantName,
                    isHost,
                });

                const serverUrl = getLiveKitServerUrl();

                // Connect to LiveKit room
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
                if (isHost) {
                    await liveKitService.enableCamera(true);
                    await liveKitService.enableMicrophone(true);

                    // Attach local video track to video element
                    const localVideoTrack = connectedRoom.localParticipant.videoTrackPublications.values().next().value?.track;
                    if (localVideoTrack && videoRef.current) {
                        localVideoTrack.attach(videoRef.current);
                    }
                } else {
                    // Viewer: Listen for remote tracks
                    connectedRoom.remoteParticipants.forEach((participant) => {
                        attachParticipantTracks(participant);
                    });

                    // Listen for new participants
                    liveKitService.on('track_subscribed', ({ track, participant }: any) => {
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

    if (error) {
        return (
            <div className={`flex items-center justify-center bg-gray-900 ${className}`}>
                <div className="text-center p-6">
                    <div className="text-red-500 text-lg font-bold mb-2">Connection Error</div>
                    <div className="text-gray-400 text-sm">{error}</div>
                    <div className="text-gray-500 text-xs mt-2">Please check your LiveKit configuration</div>
                </div>
            </div>
        );
    }

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

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isHost} // Mute local video to prevent echo
            className={`w-full h-full object-cover ${isHost ? 'scale-x-[-1]' : ''} ${className}`}
        />
    );
};

export default LiveKitVideo;
