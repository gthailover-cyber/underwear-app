import { Room, RoomEvent, RemoteParticipant, LocalParticipant, Track } from 'livekit-client';

export interface LiveKitConfig {
  serverUrl: string;
  token: string;
}

class LiveKitService {
  private room: Room | null = null;
  private listeners: { [key: string]: Function[] } = {};

  async connect(config: LiveKitConfig): Promise<Room> {
    try {
      this.room = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: {
            width: 1280,
            height: 720,
            frameRate: 30,
          },
        },
      });

      // Setup event listeners
      this.setupEventListeners();

      // Connect to the room
      await this.room.connect(config.serverUrl, config.token);
      
      console.log('[LiveKit] Connected to room:', this.room.name);
      return this.room;
    } catch (error) {
      console.error('[LiveKit] Failed to connect:', error);
      throw error;
    }
  }

  private setupEventListeners() {
    if (!this.room) return;

    this.room
      .on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        console.log('[LiveKit] Participant connected:', participant.identity);
        this.triggerEvent('participant_connected', { participant });
      })
      .on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        console.log('[LiveKit] Participant disconnected:', participant.identity);
        this.triggerEvent('participant_disconnected', { participant });
      })
      .on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log('[LiveKit] Track subscribed:', track.kind);
        this.triggerEvent('track_subscribed', { track, publication, participant });
      })
      .on(RoomEvent.LocalTrackPublished, (publication, participant: LocalParticipant) => {
        console.log('[LiveKit] Local track published:', publication.kind);
        this.triggerEvent('local_track_published', { publication, participant });
      })
      .on(RoomEvent.Disconnected, () => {
        console.log('[LiveKit] Disconnected from room');
        this.triggerEvent('disconnected', {});
      })
      .on(RoomEvent.DataReceived, (payload, participant) => {
        const decoder = new TextDecoder();
        const message = decoder.decode(payload);
        console.log('[LiveKit] Data received:', message);
        this.triggerEvent('data_received', { message, participant });
      });
  }

  async enableCamera(enable: boolean = true) {
    if (!this.room) return;
    
    try {
      await this.room.localParticipant.setCameraEnabled(enable);
      console.log('[LiveKit] Camera enabled:', enable);
    } catch (error) {
      console.error('[LiveKit] Failed to enable camera:', error);
      throw error;
    }
  }

  async enableMicrophone(enable: boolean = true) {
    if (!this.room) return;
    
    try {
      await this.room.localParticipant.setMicrophoneEnabled(enable);
      console.log('[LiveKit] Microphone enabled:', enable);
    } catch (error) {
      console.error('[LiveKit] Failed to enable microphone:', error);
      throw error;
    }
  }

  async sendMessage(message: string) {
    if (!this.room) return;
    
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      await this.room.localParticipant.publishData(data, { reliable: true });
      console.log('[LiveKit] Message sent:', message);
    } catch (error) {
      console.error('[LiveKit] Failed to send message:', error);
    }
  }

  getParticipantCount(): number {
    if (!this.room) return 0;
    return this.room.numParticipants;
  }

  getRoom(): Room | null {
    return this.room;
  }

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string) {
    delete this.listeners[event];
  }

  private triggerEvent(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  async disconnect() {
    if (this.room) {
      await this.room.disconnect();
      this.room = null;
      this.listeners = {};
      console.log('[LiveKit] Disconnected and cleaned up');
    }
  }
}

export const liveKitService = new LiveKitService();
