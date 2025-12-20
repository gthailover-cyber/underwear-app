
import { supabase } from '../lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

class SupabaseService {
  private channel: RealtimeChannel | null = null;
  private listeners: { [key: string]: Function[] } = {};
  private currentRoomId: string | null = null;
  private userId: string | null = null;
  private userProfile: { id: string; username: string; avatar: string } | null = null;
  private hostId: string | null = null;

  constructor() {
    this.initUser();
  }

  async initUser() {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      this.userId = data.user.id;
      // Fetch profile for username/avatar if not set manually
      if (!this.userProfile) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar')
          .eq('id', this.userId)
          .single();

        if (profile) {
          this.userProfile = {
            id: this.userId,
            username: profile.username,
            avatar: profile.avatar
          };
        }
      }
    }
  }

  // Allow manually updating user info (e.g. from App.tsx) to ensure sync
  updateUser(profile: { id: string; username: string; avatar: string }) {
    this.userId = profile.id;
    this.userProfile = profile;
    console.log('[SupabaseService] User Updated:', this.userProfile);
  }

  connect() {
    console.log('Supabase Realtime Initialized');
  }

  disconnect() {
    this.leaveRoom();
  }

  async joinRoom(roomId: string, hostId?: string) {
    if (this.channel) {
      this.leaveRoom();
    }

    this.currentRoomId = roomId;
    this.hostId = hostId || null;

    console.log(`[Supabase] Joining Room: ${roomId}, Host: ${this.hostId}`);

    // Fetch Host ID if not provided (fallback)
    if (!this.hostId) {
      const { data: room } = await supabase
        .from('rooms')
        .select('host_id')
        .eq('id', roomId)
        .single();

      if (room) {
        this.hostId = room.host_id;
      }
    }

    // Subscribe to the specific room's messages & Presence
    this.channel = supabase
      .channel(`room:${roomId}`, {
        config: {
          presence: {
            key: this.userId || `guest-${Date.now()}`,
          },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          this.handleNewMessage(payload.new);
        }
      )
      .on('broadcast', { event: 'heart' }, (payload) => {
        this.triggerEvent('new_heart', payload.payload);
      })
      .on('broadcast', { event: 'gift' }, (payload) => {
        this.triggerEvent('new_gift', payload.payload);
      })
      .on('broadcast', { event: 'bid' }, (payload) => {
        this.triggerEvent('bid_update', payload.payload);
      })
      .on('presence', { event: 'sync' }, () => {
        this.handlePresenceSync();
      })
      // .on('presence', { event: 'join' }, ({ key, newPresences }) => { console.log('join', key, newPresences); })
      // .on('presence', { event: 'leave' }, ({ key, leftPresences }) => { console.log('leave', key, leftPresences); })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track User Presence
          await this.channel?.track({
            user_id: this.userId,
            username: this.userProfile?.username || 'Guest',
            avatar: this.userProfile?.avatar,
            online_at: new Date().toISOString(),
          });
        }
      });
  }

  leaveRoom() {
    if (this.channel) {
      this.channel.untrack();
      supabase.removeChannel(this.channel);
      this.channel = null;
      this.currentRoomId = null;
      this.hostId = null;
    }
  }

  // --- Handlers ---

  private async handlePresenceSync() {
    if (!this.channel) return;

    const state = this.channel.presenceState();
    const uniqueUsers = Object.keys(state).length;

    // Trigger local update for LiveRoom UI (real count)
    this.triggerEvent('viewer_update', { count: uniqueUsers });

    // If I am the Host, I am responsible for updating the DB source of truth
    if (this.currentRoomId && this.hostId && this.userId === this.hostId) {
      this.updateDbViewerCount(this.currentRoomId, uniqueUsers);
    }
  }

  // Throttled DB Update to prevent spamming
  private lastDbUpdate = 0;
  private async updateDbViewerCount(roomId: string, count: number) {
    const now = Date.now();
    if (now - this.lastDbUpdate < 5000) return; // Max once every 5 seconds

    this.lastDbUpdate = now;

    const { error } = await supabase
      .from('rooms')
      .update({ viewer_count: count })
      .eq('id', roomId);

    if (error) console.error("Error updating viewer count:", error);
  }

  private handleNewMessage(newRecord: any) {
    console.log('[SupabaseService] Realtime message received:', newRecord);
    // We no longer skip self-messages because we want the DB to be the single source of truth
    // and we removed optimistic updates earlier.

    const comment = {
      id: newRecord.id,
      username: newRecord.username || 'User',
      message: newRecord.content,
      isSystem: newRecord.type === 'system',
      avatar: newRecord.avatar || 'https://picsum.photos/200/200',
      timestamp: new Date(newRecord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isHost: this.hostId && newRecord.sender_id === this.hostId
    };

    this.triggerEvent('new_comment', comment);
  }

  // --- Public Methods for Frontend ---

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  off(event: string) {
    delete this.listeners[event];
  }

  onComment(callback: (comment: any) => void) {
    return this.on('new_comment', callback);
  }

  onBidUpdate(callback: (data: any) => void) {
    return this.on('bid_update', callback);
  }

  sendComment(data: any) {
    // We no longer do optimistic updates here to ensure all screens are synced via DB
    // 2. Send to DB
    this.emit('send_comment', {
      message: data.message,
      username: data.username || this.userProfile?.username || 'User',
      avatar: data.avatar || this.userProfile?.avatar || ''
    });
  }

  async emit(event: string, data: any) {
    if (!this.currentRoomId) return;

    if (event === 'send_comment') {
      // Ensure we have user ID
      if (!this.userId) await this.initUser();

      if (!this.userId) {
        console.error("No User ID found, cannot send message.");
        return;
      }

      // Insert to DB (Persistent)
      const { error } = await supabase.from('messages').insert({
        room_id: this.currentRoomId,
        sender_id: this.userId,
        content: data.message,
        type: 'text',
        username: data.username || 'User', // Use explicit data or fallback
        avatar: data.avatar || ''
      });

      if (error) {
        console.error("[Socket] Error inserting message to DB:", error.message, error.details);
      } else {
        console.log("[Socket] Message successfully saved to DB");
      }
    }

    if (event === 'send_heart') {
      this.channel?.send({
        type: 'broadcast',
        event: 'heart',
        payload: { count: 1 }
      });
      this.triggerEvent('new_heart', { count: 1 });
    }

    if (event === 'send_gift') {
      const giftData = {
        giftId: data.giftId,
        sender: this.userProfile?.username || 'Guest',
        avatar: this.userProfile?.avatar,
        senderId: this.userId
      };

      this.channel?.send({
        type: 'broadcast',
        event: 'gift',
        payload: giftData
      });

      // Trigger locally for the sender (if needed, though LiveRoom handles local animation separately)
      // keeping consistent with heart/bid where we might want self-echo handling or optimistic UI
      // But LiveRoom calls triggerGiftAnimation locally already.
      // We'll leave local trigger here just in case, or rely on LiveRoom.
    }

    if (event === 'place_bid') {
      const bidData = { amount: data.amount, user: this.userProfile?.username || 'Me' };

      // 1. Broadcast to others (Realtime feedback)
      this.channel?.send({
        type: 'broadcast',
        event: 'bid',
        payload: bidData
      });
      this.triggerEvent('bid_update', bidData);

      // 2. Persist to DB (Persistence via RPC to bypass RLS)
      if (this.currentRoomId) {
        supabase.rpc('place_room_bid', {
          room_id: this.currentRoomId,
          bid_amount: data.amount,
          bidder_name: bidData.user
        }).then(({ error }) => {
          if (error) console.error("[Socket] Error calling place_room_bid RPC:", error);
          else console.log("[Socket] Bid successfully saved to DB via RPC");
        });
      }
    }
  }

  private triggerEvent(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }
}

export const socketService = new SupabaseService();
