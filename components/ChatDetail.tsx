
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Phone, Video, MoreVertical, Send, Plus, Smile } from 'lucide-react';
import { MessagePreview, ChatMessage, Language, Streamer } from '../types';
import { TRANSLATIONS } from '../constants';

interface ChatDetailProps {
  user: MessagePreview;
  language: Language;
  onBack: () => void;
  onOpenStream: (streamer: Streamer) => void;
}

const ChatDetail: React.FC<ChatDetailProps> = ({ user, language, onBack, onOpenStream }) => {
  const t = TRANSLATIONS[language];
  // Start with empty messages or fetch from DB
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'me',
      text: inputText,
      type: 'text',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    setMessages([...messages, newMessage]);
    setInputText('');
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
                    <div className={`rounded-2xl px-4 py-3 shadow-sm relative ${
                    isMe 
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
      <div className="p-3 bg-gray-900/90 backdrop-blur border-t border-gray-800 flex items-end gap-2 sticky bottom-0 z-30 pb-safe">
        <button className="p-2.5 text-gray-400 hover:text-white bg-gray-800 rounded-full transition-colors flex-shrink-0">
          <Plus size={22} />
        </button>
        
        <form onSubmit={handleSend} className="flex-1 bg-gray-800 rounded-2xl flex items-center border border-gray-700 focus-within:border-gray-500 transition-colors">
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
           className={`p-3 rounded-full flex-shrink-0 transition-all ${
             inputText.trim() 
               ? 'bg-red-600 text-white shadow-lg shadow-red-900/50 hover:bg-red-500 transform active:scale-95' 
               : 'bg-gray-800 text-gray-600'
           }`}
        >
          <Send size={20} className={inputText.trim() ? "translate-x-0.5" : ""} />
        </button>
      </div>
    </div>
  );
};

export default ChatDetail;
