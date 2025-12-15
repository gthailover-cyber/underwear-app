
import { supabase } from '../lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

class SupabaseService {
  private channel: RealtimeChannel | null = null;
  private listeners: { [key: string]: Function[] } = {};
  private currentRoomId: string | null = null;
  private userId: string = 'user-id-placeholder'; // In real app, get from auth context

  constructor() {
    // Check if user is logged in
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        this.userId = data.user.id;
      }
    });
  }

  connect() {
    console.log('Supabase Realtime Initialized');
  }

  disconnect() {
    this.leaveRoom();
  }

  joinRoom(roomId: string) {
    if (this.channel) {
      this.leaveRoom();
    }

    this.currentRoomId = roomId;
    console.log(`[Supabase] Joining Room: ${roomId}`);

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
    }
  }

  // --- Handlers ---

  private handleNewMessage(newRecord: any) {
    // Convert Supabase DB record to App ChatMessage/Comment format
    const comment = {
      id: newRecord.id,
      username: 'User', // Needs Join with Profiles in real app, using placeholder
      message: newRecord.content,
      isSystem: newRecord.type === 'system',
      avatar: 'https://picsum.photos/200/200' // Placeholder
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
  }

  off(event: string) {
    delete this.listeners[event];
  }

  async emit(event: string, data: any) {
    if (!this.currentRoomId) return;

    // 1. Send Comment / Message
    if (event === 'send_comment') {
      // Optimistic update handled by UI usually, but we insert to DB here
      const { error } = await supabase.from('messages').insert({
        room_id: this.currentRoomId,
        sender_id: this.userId, // Requires Auth
        content: data.message,
        type: 'text'
      });
      
      if (error) {
          console.error("Error sending message:", error);
          // If no auth, fallback to mock for demo purposes so app doesn't crash
          this.triggerEvent('new_comment', {
              id: Date.now().toString(),
              username: 'Me (Guest)',
              message: data.message,
              isSystem: false,
              avatar: 'https://picsum.photos/200/200'
          });
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

    // 3. Place Bid
    if (event === 'place_bid') {
        // In real app: Call RPC 'place_bid'
        this.channel?.send({
            type: 'broadcast',
            event: 'bid',
            payload: { newBid: data.amount, bidder: 'Me' }
        });
        this.triggerEvent('bid_update', { newBid: data.amount, bidder: 'Me' });
    }
  }

  private triggerEvent(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }
}

export const socketService = new SupabaseService();
