
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Phone, Video, MoreVertical, Send, Plus, Smile } from 'lucide-react';
import { MessagePreview, ChatMessage, Language, Streamer } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabaseClient';

interface ChatDetailProps {
  user: MessagePreview;
  language: Language;
  onBack: () => void;
  onOpenStream: (streamer: Streamer) => void;
  currentUserId?: string; // Add currentUserId
}

const ChatDetail: React.FC<ChatDetailProps> = ({ user, language, onBack, onOpenStream, currentUserId }) => {
  const t = TRANSLATIONS[language];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (currentUserId && user.userId) {
      fetchMessages();
      const channel = subscribeToMessages();
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUserId, user.userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!currentUserId || !user.userId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${user.userId}),and(sender_id.eq.${user.userId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

      if (data) {
        const formattedMessages: ChatMessage[] = data.map(m => ({
          id: m.id,
          senderId: m.sender_id === currentUserId ? 'me' : m.sender_id,
          text: m.content,
          type: m.type as any,
          timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: m.is_read
        }));
        setMessages(formattedMessages);
        markAsRead();
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const markAsRead = async () => {
    if (!currentUserId || !user.userId) return;
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', user.userId)
        .eq('receiver_id', currentUserId)
        .eq('is_read', false);
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`chat:${user.userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id.eq.${user.userId},receiver_id.eq.${user.userId})`
        },
        (payload) => {
          const m = payload.new;
          // Verify if it belongs to this conversation
          const isRelated = (m.sender_id === currentUserId && m.receiver_id === user.userId) ||
            (m.sender_id === user.userId && m.receiver_id === currentUserId);

          if (isRelated) {
            const newMessage: ChatMessage = {
              id: m.id,
              senderId: m.sender_id === currentUserId ? 'me' : m.sender_id,
              text: m.content,
              type: m.type as any,
              timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              read: m.is_read
            };
            setMessages(prev => {
              // Prevent duplicate if already added by sender
              if (prev.some(existing => existing.id === m.id)) return prev;
              return [...prev, newMessage];
            });
          }
        }
      )
      .subscribe();
    return channel;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUserId || !user.userId) return;

    const tempId = Date.now().toString();
    const content = inputText;
    setInputText('');

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUserId,
          receiver_id: user.userId,
          content: content,
          type: 'text'
        })
        .select()
        .single();

      if (data) {
        const newMessage: ChatMessage = {
          id: data.id,
          senderId: 'me',
          text: data.content,
          type: 'text',
          timestamp: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: false
        };
        setMessages(prev => [...prev, newMessage]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black animate-slide-in">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900/90 backdrop-blur border-b border-gray-800 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={22} />
          </button>

          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border border-gray-600">
              <img src={user.avatar} className="w-full h-full object-cover" alt={user.username} />
            </div>
            {user.isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full"></span>
            )}
          </div>

          <div className="flex flex-col">
            <span className="text-white font-bold text-base leading-tight">{user.username}</span>
            <span className="text-[10px] text-gray-400 font-medium">
              {user.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-gray-400">
          <button className="hover:text-white transition-colors"><Phone size={20} /></button>
          <button className="hover:text-white transition-colors"><Video size={22} /></button>
          <button className="hover:text-white transition-colors"><MoreVertical size={20} /></button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-black">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === 'me';
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>

                {!isMe && (
                  <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden mr-2 mt-auto">
                    <img src={user.avatar} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className={`max-w-[75%] space-y-1`}>
                  <div className={`rounded-2xl px-4 py-3 shadow-sm relative ${isMe
                    ? 'bg-red-600 text-white rounded-br-sm'
                    : 'bg-gray-800 text-gray-100 rounded-bl-sm border border-gray-700'
                    }`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                  <div className={`text-[10px] text-gray-500 flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {msg.timestamp}
                    {isMe && msg.read && <span className="text-white font-bold">Read</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-gray-900/90 backdrop-blur border-t border-gray-800 flex items-center gap-0 sticky bottom-0 z-30 pb-safe">
        <button className="w-[10%] flex items-center justify-center text-gray-400 hover:text-white transition-colors">
          <div className="p-2 bg-gray-800 rounded-full">
            <Plus size={22} />
          </div>
        </button>

        <form onSubmit={handleSend} className="w-[80%] bg-gray-800 rounded-2xl flex items-center border border-gray-700 focus-within:border-gray-500 transition-colors mx-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t.typeMessage}
            className="flex-1 bg-transparent text-white px-4 py-3 focus:outline-none placeholder-gray-500 text-sm max-h-32"
          />
          <button type="button" className="p-2 text-gray-400 hover:text-white mr-1">
            <Smile size={20} />
          </button>
        </form>

        <button
          onClick={handleSend}
          disabled={!inputText.trim()}
          className={`w-[10%] flex items-center justify-center transition-all ${inputText.trim()
              ? 'text-red-600 scale-110'
              : 'text-gray-600'
            }`}
        >
          <div className={`p-2.5 rounded-full ${inputText.trim() ? 'bg-red-600/10' : 'bg-gray-800'}`}>
            <Send size={20} className={inputText.trim() ? "translate-x-0.5" : ""} />
          </div>
        </button>
      </div>
    </div>
  );
};

export default ChatDetail;
