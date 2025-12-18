
import { supabase } from '../lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

class SupabaseService {
  private channel: RealtimeChannel | null = null;
  private listeners: { [key: string]: Function[] } = {};
  private currentRoomId: string | null = null;
  private userId: string | null = null;
  private userProfile: { username: string; avatar: string } | null = null;
  private hostId: string | null = null;

  constructor() {
    this.initUser();
  }

  async initUser() {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      this.userId = data.user.id;
      // Fetch profile for username/avatar
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar')
        .eq('id', this.userId)
        .single();

      if (profile) {
        this.userProfile = profile;
      }
    }
  }

  connect() {
    console.log('Supabase Realtime Initialized');
  }

  disconnect() {
    this.leaveRoom();
  }

  async joinRoom(roomId: string) {
    if (this.channel) {
      this.leaveRoom();
    }

    this.currentRoomId = roomId;
    console.log(`[Supabase] Joining Room: ${roomId}`);

    // Fetch Host ID to determine isHost for comments
    const { data: room } = await supabase
      .from('rooms')
      .select('host_id')
      .eq('id', roomId)
      .single();

    if (room) {
      this.hostId = room.host_id;
    }

    // Subscribe to the specific room's messages
    this.channel = supabase
      .channel(`room:${roomId}`)
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
      .on('broadcast', { event: 'bid' }, (payload) => {
        this.triggerEvent('bid_update', payload.payload);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Track presence (viewers) - Simplified for this demo
          this.triggerEvent('viewer_update', { count: Math.floor(Math.random() * 500) + 100 });
        }
      });
  }

  leaveRoom() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
      this.currentRoomId = null;
      this.hostId = null;
    }
  }

  // --- Handlers ---

  private handleNewMessage(newRecord: any) {
    // Convert Supabase DB record to App ChatMessage/Comment format
    const comment = {
      id: newRecord.id,
      username: newRecord.username || 'User',
      message: newRecord.content,
      isSystem: newRecord.type === 'system',
      avatar: newRecord.avatar || 'https://picsum.photos/200/200',
      timestamp: new Date(newRecord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isHost: this.hostId && newRecord.sender_id === this.hostId
    };

    // Trigger 'new_comment' event for the frontend
    this.triggerEvent('new_comment', comment);
  }

  // --- Public Methods for Frontend ---

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  off(event: string) {
    delete this.listeners[event];
  }

  // --- Helper Methods to match LiveRoom.tsx usage ---

  onComment(callback: (comment: any) => void) {
    // Return cleanup function
    return this.on('new_comment', callback);
  }

  onBidUpdate(callback: (data: any) => void) {
    return this.on('bid_update', callback);
  }

  sendComment(data: any) {
    // Send to Supabase (which will trigger real-time event back to us)
    this.emit('send_comment', { message: data.message });
  }

  async emit(event: string, data: any) {
    if (!this.currentRoomId) return;

    // 1. Send Comment / Message
    if (event === 'send_comment') {
      if (!this.userId) return;

      // Insert to DB (Persistent)
      const { error } = await supabase.from('messages').insert({
        room_id: this.currentRoomId,
        sender_id: this.userId,
        content: data.message,
        type: 'text',
        username: this.userProfile?.username || 'User',
        avatar: this.userProfile?.avatar || ''
      });

      if (error) {
        console.error("Error sending message:", error);
      }
    }

    // 2. Send Heart (Ephemeral/Broadcast - No DB save needed for animation)
    if (event === 'send_heart') {
      this.channel?.send({
        type: 'broadcast',
        event: 'heart',
        payload: { count: 1 }
      });
      // Trigger local immediately
      this.triggerEvent('new_heart', { count: 1 });
    }

    // 3. Send Gift
    if (event === 'send_gift') {
      // Logic to deduct balance and record transaction would go here
      console.log("Gift sent:", data.giftId);
    }

    // 4. Place Bid
    if (event === 'place_bid') {
      const bidData = { amount: data.amount, user: this.userProfile?.username || 'Me' };

      this.channel?.send({
        type: 'broadcast',
        event: 'bid',
        payload: bidData
      });
      this.triggerEvent('bid_update', bidData);
    }
  }

  private triggerEvent(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }
}

export const socketService = new SupabaseService();
