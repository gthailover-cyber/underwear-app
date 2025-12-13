
import { io, Socket } from 'socket.io-client';

// Toggle this to true if you have a real local backend running on port 3001
const USE_REAL_SERVER = false; 
const SERVER_URL = 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;
  private mockListeners: { [key: string]: Function[] } = {};
  private mockInterval: number | null = null;
  private currentRoomId: string | null = null;

  connect() {
    if (USE_REAL_SERVER) {
      this.socket = io(SERVER_URL);
      console.log('Connecting to real socket server...');
    } else {
      console.log('Mock Socket Connected');
      // Only start generating mock events if we are in a room
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.leaveRoom();
    this.mockListeners = {};
  }

  joinRoom(roomId: string) {
    if (this.socket) {
      this.socket.emit('join_room', roomId);
    } else {
      console.log(`[Socket] Joined Room: ${roomId}`);
      this.currentRoomId = roomId;
      this.startMockEvents();
    }
  }

  leaveRoom() {
    if (this.socket && this.currentRoomId) {
      this.socket.emit('leave_room', this.currentRoomId);
    } else {
      console.log(`[Socket] Left Room: ${this.currentRoomId}`);
      this.currentRoomId = null;
      if (this.mockInterval) {
        clearInterval(this.mockInterval);
        this.mockInterval = null;
      }
    }
  }

  // Subscribe to an event (e.g., 'new_comment')
  on(event: string, callback: Function) {
    if (this.socket) {
      this.socket.on(event, (data) => callback(data));
    } else {
      if (!this.mockListeners[event]) {
        this.mockListeners[event] = [];
      }
      this.mockListeners[event].push(callback);
    }
  }

  // Unsubscribe
  off(event: string) {
    if (this.socket) {
      this.socket.off(event);
    } else {
      delete this.mockListeners[event];
    }
  }

  // Send data to server (e.g., 'send_message')
  emit(event: string, data: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    } else {
      // Mock server behavior
      
      if (event === 'send_comment') {
        // Broadcast to self immediately
        this.triggerMockEvent('new_comment', {
          id: Date.now().toString(),
          username: 'Me', // In real app, get from user profile
          message: data.message,
          isSystem: false,
          avatar: 'https://picsum.photos/200/200?random=999' // Mock avatar for self
        });
      }
      
      if (event === 'send_heart') {
        // Broadcast heart
        this.triggerMockEvent('new_heart', { count: 1 });
      }

      if (event === 'place_bid') {
        // Simulate successful bid
        console.log(`[Socket] Bid placed: ${data.amount}`);
        this.triggerMockEvent('bid_update', {
          newBid: data.amount,
          bidder: 'Me' // You represent the current user
        });
      }
    }
  }

  // --- Mock Helpers ---
  private triggerMockEvent(event: string, data: any) {
    if (this.mockListeners[event]) {
      this.mockListeners[event].forEach(cb => cb(data));
    }
  }

  private startMockEvents() {
    if (this.mockInterval) clearInterval(this.mockInterval);

    // Simulate other users chatting and sending hearts specifically for this room
    this.mockInterval = window.setInterval(() => {
      if (!this.currentRoomId) return;

      // Random Hearts
      if (Math.random() > 0.6) {
        this.triggerMockEvent('new_heart', { count: Math.floor(Math.random() * 5) + 1 });
      }

      // Random Comments
      if (Math.random() > 0.85) {
        const randomUsers = [
           { name: 'User_007', avatar: 'https://picsum.photos/200/200?random=201' },
           { name: 'BoyThai', avatar: 'https://picsum.photos/200/200?random=202' },
           { name: 'GymRat99', avatar: 'https://picsum.photos/200/200?random=203' },
           { name: 'Jeffy', avatar: 'https://picsum.photos/200/200?random=204' },
           { name: 'Davikah', avatar: 'https://picsum.photos/200/200?random=205' }
        ];
        const randomMsgs = ['Cf ดำ', 'ขอตารางไซส์หน่อย', 'เท่มากครับ', 'หัวใจรัวๆ ❤️', 'ราคาเท่าไหร่?', 'ส่งฟรีไหม?'];
        
        const user = randomUsers[Math.floor(Math.random() * randomUsers.length)];

        this.triggerMockEvent('new_comment', {
          id: Date.now().toString(),
          username: user.name,
          message: randomMsgs[Math.floor(Math.random() * randomMsgs.length)],
          isSystem: false,
          avatar: user.avatar
        });
      }
      
      // Update Viewer Count
      if (Math.random() > 0.5) {
         this.triggerMockEvent('viewer_update', { 
            count: Math.floor(Math.random() * 200) + 1000 
         });
      }
    }, 1500);
  }
}

export const socketService = new SocketService();
