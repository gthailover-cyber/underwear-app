
import React, { useState } from 'react';
import { ArrowLeft, Search, CheckCheck, BadgeCheck } from 'lucide-react';
import { Language, MessagePreview } from '../types';
import { TRANSLATIONS, MOCK_MESSAGES } from '../constants';

interface MessagesProps {
  language: Language;
  onBack: () => void;
  onOpenChat: (user: MessagePreview) => void;
}

const Messages: React.FC<MessagesProps> = ({ language, onBack, onOpenChat }) => {
  const t = TRANSLATIONS[language];
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMessages = MOCK_MESSAGES.filter(msg => 
    msg.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    msg.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pb-24 animate-fade-in h-screen bg-black flex flex-col">
      
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-4 sticky top-0 bg-black/90 backdrop-blur z-30 border-b border-gray-800">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors border border-gray-700"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h2 className="text-xl font-athletic tracking-wide text-white">
          {t.messages}
        </h2>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-2">
        <div className="relative">
          <input 
            type="text" 
            placeholder={t.searchMessages}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-gray-700 focus:ring-1 focus:ring-gray-700 transition-all text-sm"
          />
          <Search size={16} className="absolute left-3.5 top-3.5 text-gray-500" />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {filteredMessages.length > 0 ? (
          <div className="divide-y divide-gray-800/50">
            {filteredMessages.map((msg) => (
              <div 
                key={msg.id} 
                onClick={() => onOpenChat(msg)}
                className="flex items-center gap-4 px-4 py-4 hover:bg-gray-900/40 cursor-pointer transition-colors active:bg-gray-900/80 group"
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-gray-700 to-gray-800 group-hover:from-red-900 group-hover:to-red-600 transition-colors">
                    <img src={msg.avatar} className="w-full h-full rounded-full object-cover border-2 border-black" alt={msg.username} />
                  </div>
                  {msg.isOnline && (
                    <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-500 border-2 border-black rounded-full"></span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-white flex items-center gap-1 truncate text-base">
                      {msg.username}
                      {msg.isVerified && <BadgeCheck size={14} className="text-blue-500 fill-blue-500/10" />}
                    </h3>
                    <span className={`text-[10px] font-medium ${msg.unread > 0 ? 'text-red-500' : 'text-gray-500'}`}>
                      {msg.time}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`truncate text-sm pr-4 ${msg.unread > 0 ? 'text-gray-200 font-medium' : 'text-gray-500'}`}>
                      {msg.lastMessage}
                    </p>
                    {msg.unread > 0 ? (
                      <div className="min-w-[18px] h-[18px] bg-red-600 rounded-full flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">{msg.unread}</span>
                      </div>
                    ) : (
                      <CheckCheck size={14} className="text-gray-600" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500">
             <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mb-4">
                <Search size={24} className="opacity-50" />
             </div>
             <p>{t.noMessages}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
