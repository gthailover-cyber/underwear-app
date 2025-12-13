import React, { useState, useEffect, useRef } from 'react';
import { Heart, X, Send, ShoppingBag, User, Plus } from 'lucide-react';
import { Streamer, Comment, Product, Language } from '../types';
import { INITIAL_COMMENTS, TRANSLATIONS } from '../constants';

interface LiveRoomProps {
  streamer: Streamer;
  onClose: () => void;
  language: Language;
}

const LiveRoom: React.FC<LiveRoomProps> = ({ streamer, onClose, language }) => {
  const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS);
  const [inputMessage, setInputMessage] = useState('');
  const [heartCount, setHeartCount] = useState(0);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; left: number }[]>([]);
  const [showProducts, setShowProducts] = useState(false);
  
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const heartIdCounter = useRef(0);

  const t = TRANSLATIONS[language];

  // Auto scroll comments
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  // Simulate incoming comments/hearts
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        addFloatingHeart();
      }
      if (Math.random() > 0.85) {
        const randomMsg = ['Nice!', 'ราคา?', 'CF', 'สนใจครับ', 'Show back please'][Math.floor(Math.random() * 5)];
        setComments(prev => [...prev, { 
          id: Date.now().toString(), 
          username: `User${Math.floor(Math.random() * 1000)}`, 
          message: randomMsg 
        }]);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const addFloatingHeart = () => {
    setHeartCount(prev => prev + 1);
    const id = heartIdCounter.current++;
    // Random position between 50% and 90% (right side mainly)
    const left = Math.floor(Math.random() * 40) + 50; 
    setFloatingHearts(prev => [...prev, { id, left }]);
    
    // Remove after animation
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== id));
    }, 1500);
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    
    setComments(prev => [...prev, {
      id: Date.now().toString(),
      username: 'Me',
      message: inputMessage
    }]);
    setInputMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      {/* Mobile container - limits width on desktop */}
      <div className="relative w-full h-full max-w-md bg-gray-900 overflow-hidden flex flex-col">
        
        {/* Mock Video Layer */}
        <div className="absolute inset-0">
          <img 
            src={streamer.coverImage} 
            alt="Live Stream" 
            className="w-full h-full object-cover opacity-80"
          />
          {/* Main Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80"></div>
        </div>

        {/* --- Header Area --- */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-6 z-20 flex items-start justify-between">
          
          {/* Host Info */}
          <div className="flex items-center bg-black/30 backdrop-blur-md rounded-full p-1 pr-3 border border-white/10">
            <div className="w-8 h-8 rounded-full border-2 border-yellow-500 overflow-hidden mr-2">
              <img src={streamer.coverImage} className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white leading-none">{streamer.name}</span>
              <span className="text-[10px] text-gray-300">{streamer.viewerCount.toLocaleString()} {t.watching}</span>
            </div>
            <button className="ml-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
              {t.follow}
            </button>
          </div>

          {/* Close & Audience */}
          <div className="flex items-center space-x-2">
             <div className="flex -space-x-2 overflow-hidden">
                {[1,2,3].map(i => (
                  <div key={i} className="inline-block h-6 w-6 rounded-full ring-2 ring-black bg-gray-500">
                    <img src={`https://picsum.photos/50/50?random=${i+20}`} className="w-full h-full rounded-full"/>
                  </div>
                ))}
             </div>
             <button 
                onClick={onClose}
                className="w-8 h-8 bg-black/20 backdrop-blur rounded-full flex items-center justify-center text-white"
             >
               <X size={18} />
             </button>
          </div>
        </div>

        {/* --- Right Floating Hearts Area --- */}
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {floatingHearts.map(h => (
            <div 
              key={h.id}
              className="absolute bottom-24 text-red-500 animate-float"
              style={{ left: `${h.left}%` }}
            >
              <Heart fill="#ef4444" size={24} />
            </div>
          ))}
        </div>

        {/* --- Main Interactive Layer (Bottom) --- */}
        <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col justify-end pb-4 px-4 bg-gradient-to-t from-black via-black/60 to-transparent pt-20">
          
          {/* Comments Area */}
          <div className="h-48 overflow-y-auto no-scrollbar mask-image-linear-gradient flex flex-col justify-end space-y-2 mb-4">
            {comments.map((c) => (
              <div key={c.id} className="self-start bg-black/40 backdrop-blur-sm rounded-xl px-3 py-1.5 max-w-[80%] border border-white/5">
                <span className={`text-xs font-bold mr-2 ${c.username === 'Me' ? 'text-yellow-400' : 'text-gray-300'}`}>
                  {c.username}
                </span>
                <span className="text-sm text-white">{c.message}</span>
              </div>
            ))}
            <div ref={commentsEndRef} />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            
            {/* Products Button */}
            <button 
              onClick={() => setShowProducts(true)}
              className="relative flex-shrink-0 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-black shadow-lg shadow-yellow-400/20"
            >
              <ShoppingBag size={20} />
              <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {streamer.itemCount}
              </div>
            </button>

            {/* Comment Input */}
            <form onSubmit={handleSendComment} className="flex-1 relative">
              <input 
                type="text" 
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={t.saySomething} 
                className="w-full bg-white/10 backdrop-blur border border-white/20 rounded-full py-2.5 pl-4 pr-10 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
              />
              <button 
                type="submit"
                className="absolute right-1 top-1 w-8 h-8 flex items-center justify-center text-white/80 hover:text-white"
              >
                <Send size={16} />
              </button>
            </form>

            {/* Heart Button */}
            <button 
              onClick={addFloatingHeart}
              className="flex-shrink-0 w-10 h-10 bg-white/10 backdrop-blur border border-white/20 rounded-full flex items-center justify-center text-red-500 active:scale-90 transition-transform"
            >
              <Heart fill={heartCount > 0 ? "#ef4444" : "none"} size={24} />
            </button>
          </div>
        </div>

        {/* --- Product Modal / Sheet --- */}
        {showProducts && (
          <div className="absolute inset-0 z-30 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
             <div 
               className="bg-gray-900 rounded-t-3xl border-t border-gray-700 h-[60%] flex flex-col shadow-2xl"
               onClick={(e) => e.stopPropagation()}
             >
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                  <h3 className="text-white font-bold text-lg flex items-center">
                    <ShoppingBag size={18} className="mr-2 text-yellow-400"/> 
                    {t.shopItems}
                  </h3>
                  <button onClick={() => setShowProducts(false)} className="text-gray-400 p-2">
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                  {streamer.products.map((p) => (
                    <div key={p.id} className="flex bg-gray-800 rounded-lg p-2 gap-3 border border-gray-700">
                      <img src={p.image} className="w-20 h-20 object-cover rounded-md bg-gray-700" />
                      <div className="flex-1 flex flex-col justify-between py-0.5">
                        <div>
                          <h4 className="text-white text-sm font-medium line-clamp-2">{p.name}</h4>
                          <span className="text-xs text-gray-400">{t.stock}: {p.stock}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-yellow-400 font-bold">฿{p.price}</span>
                          <button className="bg-red-600 text-white text-xs px-3 py-1.5 rounded font-bold hover:bg-red-700 active:scale-95 transition-all">
                            {t.buyNow}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveRoom;