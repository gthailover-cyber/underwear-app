
import React, { useState, useEffect, useRef } from 'react';
import { Heart, X, Send, ShoppingBag, User, StopCircle, Timer, Minus, Plus, Gavel, Gift, Coins, ChevronRight, Wallet, Sparkles, History, Check, Crown } from 'lucide-react';
import { Streamer, Comment, Language, Product, CartItem } from '../types';
import { INITIAL_COMMENTS, TRANSLATIONS } from '../constants';
import { socketService } from '../services/socket';

interface LiveRoomProps {
  streamer: Streamer;
  onClose: () => void;
  language: Language;
  walletBalance: number;
  onUseCoins: (amount: number) => void;
  onOpenWallet: () => void;
  onAddToCart: (item: CartItem) => void;
}

interface GiftLogItem {
  id: string;
  sender: string;
  avatar: string;
  giftName: string;
  giftIcon: string;
  price: number;
  timestamp: Date;
}

// Mock Gift Types
const GIFTS = [
  { id: 1, name: 'Rose', price: 1, icon: '🌹', color: 'from-red-500 to-pink-500' },
  { id: 2, name: 'Heart', price: 10, icon: '💖', color: 'from-pink-500 to-purple-500' },
  { id: 3, name: 'Boxer', price: 50, icon: '🩲', color: 'from-blue-500 to-cyan-500' },
  { id: 4, name: 'Trophy', price: 100, icon: '🏆', color: 'from-yellow-400 to-orange-500' },
  { id: 5, name: 'Supercar', price: 500, icon: '🏎️', color: 'from-purple-600 to-indigo-600' },
  { id: 6, name: 'Rocket', price: 1000, icon: '🚀', color: 'from-red-600 to-orange-600' },
];

const LiveRoom: React.FC<LiveRoomProps> = ({ streamer, onClose, language, walletBalance, onUseCoins, onOpenWallet, onAddToCart }) => {
  const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS);
  const [inputMessage, setInputMessage] = useState('');
  const [heartCount, setHeartCount] = useState(0);
  const [viewerCount, setViewerCount] = useState(streamer.viewerCount);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; left: number }[]>([]);
  const [showProducts, setShowProducts] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  const [videoError, setVideoError] = useState(false);
  
  // Product Variant Selection State
  const [selectedProductForPurchase, setSelectedProductForPurchase] = useState<Product | null>(null);
  const [purchaseConfig, setPurchaseConfig] = useState<{ color: string; size: string; quantity: number }>({ color: '', size: '', quantity: 1 });

  // Gift Animation & Log State
  const [giftAnimation, setGiftAnimation] = useState<{ id: number; icon: string; name: string; sender: string; color: string } | null>(null);
  const [floatingPopups, setFloatingPopups] = useState<{ id: number; text: string; icon: string; }[]>([]);
  const [giftLogs, setGiftLogs] = useState<GiftLogItem[]>([]);

  // Auction State
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [currentHighestBid, setCurrentHighestBid] = useState<number>(streamer.currentBid || streamer.auctionStartingPrice || 0);
  const [topBidder, setTopBidder] = useState<string>(streamer.topBidder || '-');
  const [myBidAmount, setMyBidAmount] = useState<number>(0);
  const [bidSuccess, setBidSuccess] = useState(false);
  
  // Auction Animation State
  const [floatingBids, setFloatingBids] = useState<{ id: number; amount: number }[]>([]);
  const prevBidRef = useRef<number>(streamer.currentBid || streamer.auctionStartingPrice || 0);

  const commentsEndRef = useRef<HTMLDivElement>(null);
  const heartIdCounter = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check if current user is the host
  const isHost = streamer.id.startsWith('live-host');

  const t = TRANSLATIONS[language];

  // Helper to generate a consistent avatar for a bidder
  const getBidderAvatar = (username: string) => {
    if (username === '-' || !username) return '';
    return `https://picsum.photos/seed/${username}/200`;
  };

  const topBidderAvatar = getBidderAvatar(topBidder);

  // Initialize myBidAmount when currentHighestBid changes
  useEffect(() => {
    setMyBidAmount(currentHighestBid + 1); // Default step +1
  }, [currentHighestBid]);

  // Auto scroll comments
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  // Auction Timer
  useEffect(() => {
    if (streamer.isAuction && streamer.auctionEndTime) {
      const updateTimer = () => {
        const now = Date.now();
        const diff = streamer.auctionEndTime! - now;
        
        if (diff <= 0) {
          setTimeLeft('00:00:00');
          return;
        }

        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        
        setTimeLeft(
          `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        );
      };

      updateTimer();
      const timerInterval = setInterval(updateTimer, 1000);
      return () => clearInterval(timerInterval);
    }
  }, [streamer.isAuction, streamer.auctionEndTime]);

  // Video & Camera Handling
  useEffect(() => {
    // 1. Viewer Mode: Play Video URL
    if (streamer.videoUrl && !isHost) {
       if (videoRef.current) {
          videoRef.current.play().catch(e => {
            console.log('Autoplay prevented or failed:', e);
            // Don't set error immediately, let poster show
          });
       }
    } 
    // 2. Host Mode: Enable Camera
    else if (isHost) {
       const startCamera = async () => {
          try {
             const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 1280 } }, 
                audio: true 
             });
             streamRef.current = stream;
             if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
             }
          } catch (err) {
             console.error("Error accessing camera:", err);
             setVideoError(true); // Fallback to cover image if camera fails
          }
       };
       startCamera();
    }
    
    // Cleanup Camera on Unmount
    return () => {
       if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
       }
    };
  }, [streamer.videoUrl, isHost]);

  // Handle incoming or sent gifts logic
  const processGift = (gift: typeof GIFTS[0], sender: string) => {
      // 1. Add to Log (for Host View mainly)
      const newLog: GiftLogItem = {
        id: Date.now().toString() + Math.random(),
        sender,
        avatar: `https://picsum.photos/50/50?random=${Math.floor(Math.random() * 1000)}`,
        giftName: gift.name,
        giftIcon: gift.icon,
        price: gift.price,
        timestamp: new Date()
      };
      setGiftLogs(prev => [newLog, ...prev].slice(0, 50)); // Keep last 50 items

      // 2. Special case for Rose: Floating text instead of full screen
      if (gift.name === 'Rose') {
          const id = Date.now() + Math.random();
          setFloatingPopups(prev => [...prev, { id, text: 'x 1', icon: gift.icon }]);
          setTimeout(() => setFloatingPopups(prev => prev.filter(p => p.id !== id)), 2000);
      } else {
          // Default: Full Screen Animation
          triggerGiftAnimation(gift, sender);
      }
  };

  // --- SOCKET.IO INTEGRATION ---
  useEffect(() => {
    // 1. Connect & Join Room
    socketService.connect();
    socketService.joinRoom(streamer.id);

    // 2. Listen for New Comments
    socketService.on('new_comment', (data: Comment) => {
      setComments(prev => [...prev, data]);
    });

    // 3. Listen for Hearts
    socketService.on('new_heart', (data: { count: number }) => {
      for (let i = 0; i < data.count; i++) {
         setTimeout(() => addFloatingHeart(), i * 100);
      }
    });

    // 4. Listen for Viewer Count Updates
    socketService.on('viewer_update', (data: { count: number }) => {
       setViewerCount(data.count);
    });

    // 5. Listen for Bid Updates
    socketService.on('bid_update', (data: { newBid: number, bidder: string }) => {
       const diff = data.newBid - prevBidRef.current;
       if (diff > 0) {
          const id = Date.now();
          setFloatingBids(prev => [...prev, { id, amount: data.newBid }]);
          setTimeout(() => {
             setFloatingBids(prev => prev.filter(item => item.id !== id));
          }, 1500);
       }
       prevBidRef.current = data.newBid;

       setCurrentHighestBid(data.newBid);
       setTopBidder(data.bidder);
       if (data.bidder === 'Me') {
          setBidSuccess(true);
          setTimeout(() => setBidSuccess(false), 2000);
       }
    });

    // Mock Activity Interval (Gifts & Bids)
    const mockActivityInterval = setInterval(() => {
      // 1. Random Gifts
      if (Math.random() > 0.85) {
         const randomGift = GIFTS[Math.floor(Math.random() * GIFTS.length)];
         const randomUser = ['Alex', 'Mike', 'Sarah', 'TopFan', 'User99'][Math.floor(Math.random() * 5)];
         processGift(randomGift, randomUser);
      }

      // 2. Random Bids (Only in Auction Mode)
      if (streamer.isAuction && Math.random() > 0.8) {
         const increment = [50, 100, 200][Math.floor(Math.random() * 3)];
         setCurrentHighestBid(prev => {
             const newVal = prev + increment;
             const id = Date.now();
             setFloatingBids(current => [...current, { id, amount: newVal }]);
             setTimeout(() => setFloatingBids(current => current.filter(item => item.id !== id)), 1500);
             prevBidRef.current = newVal;
             setTopBidder(['User88', 'RichGuy', 'BidMaster'][Math.floor(Math.random() * 3)]);
             return newVal;
         });
      }
    }, 5000);

    return () => {
      clearInterval(mockActivityInterval);
      socketService.leaveRoom();
      socketService.disconnect();
    };
  }, [streamer.id, streamer.isAuction]);

  const addFloatingHeart = () => {
    setHeartCount(prev => prev + 1);
    const id = heartIdCounter.current++;
    const left = Math.floor(Math.random() * 40) + 50; 
    setFloatingHearts(prev => [...prev, { id, left }]);
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== id));
    }, 1500);
  };

  const triggerGiftAnimation = (gift: typeof GIFTS[0], sender: string) => {
    const id = Date.now();
    setGiftAnimation({ id, icon: gift.icon, name: gift.name, sender, color: gift.color });
    setTimeout(() => {
      setGiftAnimation(null);
    }, 3000);
  };

  const handleSendHeart = () => {
    if (isHost) return;
    addFloatingHeart(); 
    socketService.emit('send_heart', {});
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    socketService.emit('send_comment', { message: inputMessage });
    setInputMessage('');
  };

  const handleEndLiveClick = () => {
    setShowConfirmEnd(true);
  };

  const handleConfirmEnd = () => {
    setShowConfirmEnd(false);
    setIsEnding(true);
    // Stop camera
    if (streamRef.current) {
       streamRef.current.getTracks().forEach(track => track.stop());
    }
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  // Auction Handlers
  const increaseBid = () => setMyBidAmount(prev => prev + 1);
  const decreaseBid = () => {
      if (myBidAmount - 1 > currentHighestBid) {
          setMyBidAmount(prev => prev - 1);
      }
  };
  const placeBid = () => {
      if (walletBalance < myBidAmount) {
         onOpenWallet();
         return;
      }
      if (myBidAmount > currentHighestBid) {
          socketService.emit('place_bid', { amount: myBidAmount });
      } else {
          alert(t.bidTooLow);
      }
  };

  // Gift Handler
  const handleSendGift = (gift: typeof GIFTS[0]) => {
    if (walletBalance >= gift.price) {
      onUseCoins(gift.price);
      
      const giftMsg: Comment = {
        id: Date.now().toString(),
        username: 'Me',
        message: `Sent a ${gift.name} ${gift.icon}`,
        isSystem: false,
        avatar: streamer.coverImage
      };
      
      setComments(prev => [...prev, giftMsg]);
      socketService.emit('send_comment', { message: `Sent a ${gift.name} ${gift.icon}` });
      
      processGift(gift, 'Me');
      setShowGifts(false);
    }
  };

  // Buy Now Logic - Step 1: Open Selection Sheet
  const handleBuyClick = (product: Product) => {
     setSelectedProductForPurchase(product);
     setPurchaseConfig({
       color: product.colors && product.colors.length > 0 ? product.colors[0] : '',
       size: product.sizes && product.sizes.length > 0 ? product.sizes[0] : '',
       quantity: 1
     });
     // Close product list
     setShowProducts(false);
  };

  // Buy Now Logic - Step 2: Confirm Purchase (Direct or Cart)
  const handleConfirmPurchase = (action: 'buy_now' | 'add_to_cart') => {
      if (!selectedProductForPurchase) return;

      const totalCost = selectedProductForPurchase.price * purchaseConfig.quantity;

      if (action === 'buy_now') {
          if (walletBalance >= totalCost) {
             onUseCoins(totalCost);
             alert(`Successfully purchased ${purchaseConfig.quantity}x ${selectedProductForPurchase.name}!`);
             setSelectedProductForPurchase(null); // Close sheet
          } else {
             alert('Insufficient coins!');
             onOpenWallet();
          }
      } else {
          // Add to Cart
          const cartItem: CartItem = {
             ...selectedProductForPurchase,
             quantity: purchaseConfig.quantity,
             color: purchaseConfig.color,
             size: purchaseConfig.size
          };
          onAddToCart(cartItem);
          alert('Added to Cart!');
          setSelectedProductForPurchase(null);
      }
  };

  const isInsufficientFunds = myBidAmount > walletBalance;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <style>{`
        @keyframes floatBid {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          20% { transform: translateY(15px) scale(1.2); opacity: 1; }
          100% { transform: translateY(-50px) scale(1); opacity: 0; }
        }
        .animate-float-bid {
          animation: floatBid 2s ease-out forwards;
        }
        @keyframes giftEntrance {
          0% { transform: scale(0) rotate(-45deg); opacity: 0; }
          50% { transform: scale(1.5) rotate(10deg); opacity: 1; }
          70% { transform: scale(1.2) rotate(-5deg); opacity: 1; }
          100% { transform: scale(3) rotate(0deg); opacity: 0; }
        }
        .animate-gift-entrance {
          animation: giftEntrance 3s ease-in-out forwards;
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
           animation: spinSlow 10s linear infinite;
        }
        @keyframes textSlideUp {
           0% { transform: translateY(20px); opacity: 0; }
           20% { transform: translateY(0); opacity: 1; }
           80% { transform: translateY(0); opacity: 1; }
           100% { transform: translateY(-20px); opacity: 0; }
        }
        .animate-text-slide-up {
           animation: textSlideUp 3s ease-in-out forwards;
        }
        @keyframes slideInLeft {
           from { transform: translateX(-100%); opacity: 0; }
           to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-left {
           animation: slideInLeft 0.4s ease-out forwards;
        }
      `}</style>

      {/* Mobile container */}
      <div className={`relative w-full h-full max-w-md bg-gray-900 overflow-hidden flex flex-col transition-opacity duration-500 ${isEnding ? 'opacity-0' : 'opacity-100'}`}>
        
        {/* Video Layer */}
        <div className="absolute inset-0 bg-black">
          {(isHost || (streamer.videoUrl && !videoError)) ? (
            <div className="w-full h-full relative overflow-hidden">
               <video
                 ref={videoRef}
                 src={!isHost ? streamer.videoUrl : undefined}
                 className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full object-cover ${isHost ? 'scale-x-[-1]' : ''}`}
                 autoPlay
                 muted
                 loop
                 playsInline
                 webkit-playsinline="true"
                 poster={streamer.coverImage}
                 onError={() => {
                   if (!isHost) {
                     console.log("Video load failed, showing fallback image");
                     setVideoError(true);
                   }
                 }}
               />
               <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80 pointer-events-none"></div>
            </div>
          ) : streamer.youtubeId ? (
             <div className="w-full h-full relative overflow-hidden pointer-events-none">
                <iframe 
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300%] h-full md:w-[177vh] md:h-[100vw] object-cover pointer-events-none"
                  src={`https://www.youtube.com/embed/${streamer.youtubeId}?autoplay=1&controls=0&mute=1&loop=1&playlist=${streamer.youtubeId}&modestbranding=1&playsinline=1&rel=0&iv_load_policy=3&disablekb=1&origin=${window.location.origin}`}
                  title="Live Stream"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
                <div className="absolute inset-0 bg-transparent"></div>
             </div>
          ) : (
             <img 
               src={streamer.coverImage} 
               alt="Live Stream" 
               className="w-full h-full object-cover opacity-80"
             />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80 pointer-events-none"></div>
        </div>

        {/* --- Header Area --- */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-6 z-20 flex items-start justify-between">
          
          <div className="flex flex-col gap-2 relative">
              {/* Host Info */}
              <div className="flex items-center bg-black/30 backdrop-blur-md rounded-full p-1 pr-3 border border-white/10 w-fit">
                <div className="w-8 h-8 rounded-full border-2 border-yellow-500 overflow-hidden mr-2">
                  <img src={streamer.coverImage} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white leading-none">{streamer.name}</span>
                  <span className="text-[10px] text-gray-300">{viewerCount.toLocaleString()} {t.watching}</span>
                </div>
                {!isHost && (
                  <button className="ml-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {t.follow}
                  </button>
                )}
              </div>

              {/* Heart Count Display */}
              <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md rounded-full px-3 py-1 border border-white/10 w-fit animate-fade-in">
                 <Heart size={14} className="text-red-500 fill-red-500" />
                 <span className="text-xs font-bold text-white">{heartCount.toLocaleString()}</span>
              </div>

              {/* Auction Header Info (Timer & Price) - ONLY FOR VIEWERS NOW */}
              {streamer.isAuction && !isHost && (
                  <div className="flex flex-col gap-2 mt-1">
                      {/* Timer */}
                      <div className="flex items-center gap-2 bg-gradient-to-r from-red-900/80 to-black/60 backdrop-blur-md rounded-lg px-3 py-1.5 border border-red-500/30 w-fit animate-fade-in">
                          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30">
                              <Timer size={18} className="text-white animate-pulse" />
                          </div>
                          <div className="flex flex-col">
                              <span className="text-[9px] text-gray-300 uppercase tracking-wider leading-none mb-0.5">Time Left</span>
                              <span className="text-lg font-black font-athletic text-white leading-none tracking-wide">{timeLeft}</span>
                          </div>
                      </div>

                      {/* Current Bid Display in Header (Useful for Host who has no bottom box) */}
                      <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-600/80 to-black/60 backdrop-blur-md rounded-lg px-3 py-1.5 border border-yellow-500/30 w-fit animate-fade-in">
                          <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-600/30">
                              <Gavel size={16} className="text-black" />
                          </div>
                          <div className="flex flex-col">
                              <span className="text-[9px] text-yellow-200 uppercase tracking-wider leading-none mb-0.5">Highest</span>
                              <span className="text-lg font-black font-athletic text-white leading-none tracking-wide">฿{currentHighestBid.toLocaleString()}</span>
                          </div>
                      </div>
                  </div>
              )}
          </div>

          {/* Close / End Button */}
          <div className="flex items-center space-x-2">
             <div className="flex -space-x-2 overflow-hidden">
                {[1,2,3].map(i => (
                  <div key={i} className="inline-block h-6 w-6 rounded-full ring-2 ring-black bg-gray-500">
                    <img src={`https://picsum.photos/50/50?random=${i+20}`} className="w-full h-full rounded-full"/>
                  </div>
                ))}
             </div>
             
             {isHost ? (
               <button 
                  onClick={handleEndLiveClick}
                  className="px-3 py-1.5 bg-red-600/90 backdrop-blur rounded-full flex items-center justify-center text-white font-bold text-xs gap-1 shadow-lg border border-red-500 hover:bg-red-500 transition-colors"
               >
                 <StopCircle size={14} /> END
               </button>
             ) : (
               <button 
                  onClick={onClose}
                  className="w-8 h-8 bg-black/20 backdrop-blur rounded-full flex items-center justify-center text-white"
               >
                 <X size={18} />
               </button>
             )}
          </div>
        </div>

        {/* --- Right Side Floating Effects (Bids & Roses) --- */}
        <div className="absolute top-24 right-4 z-40 pointer-events-none w-32 flex flex-col items-end">
            <div className="relative w-full h-full">
                 {/* Bids */}
                 {floatingBids.map((bid) => (
                    <div 
                       key={bid.id} 
                       className="absolute top-0 right-0 flex flex-col items-end animate-float-bid origin-right"
                    >
                       <span className="text-[10px] text-yellow-200 uppercase font-bold tracking-wider bg-black/60 px-2 py-0.5 rounded mb-1 backdrop-blur-sm border border-yellow-500/30">
                         New Bid
                       </span>
                       <span className="text-5xl font-black font-athletic text-yellow-400 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] stroke-black" 
                             style={{ textShadow: '0 0 20px rgba(250, 204, 21, 0.8)', WebkitTextStroke: '1px black' }}>
                         ฿{bid.amount.toLocaleString()}
                       </span>
                    </div>
                 ))}

                 {/* Roses/Popups */}
                 {floatingPopups.map((popup) => (
                    <div 
                       key={popup.id} 
                       className="absolute top-24 right-0 flex items-center gap-2 animate-float-bid origin-right"
                    >
                       <span className="text-4xl filter drop-shadow-xl animate-bounce">{popup.icon}</span>
                       <span className="text-2xl font-black text-white font-athletic italic drop-shadow-md">
                         {popup.text}
                       </span>
                    </div>
                 ))}
            </div>
        </div>

        {/* --- NEW: Host Auction Stats (Bottom Right - Enhanced with Avatar) --- */}
        {isHost && streamer.isAuction && (
           <div className="absolute bottom-24 right-4 z-30 flex flex-col items-end gap-2 pointer-events-none">
              
              {/* Timer */}
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-xl p-2 pr-3 border border-red-500/50 shadow-lg">
                  <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center animate-pulse shadow-lg shadow-red-900/50">
                      <Timer size={16} className="text-white" />
                  </div>
                  <div className="flex flex-col items-end">
                      <span className="text-[9px] text-gray-300 uppercase font-bold leading-none mb-0.5">Time Left</span>
                      <span className="text-lg font-black font-athletic text-white leading-none tracking-wide">{timeLeft}</span>
                  </div>
              </div>

              {/* Highest Bid & User Profile */}
              <div className="flex flex-col bg-black/70 backdrop-blur-xl rounded-2xl border border-yellow-500/50 shadow-2xl overflow-hidden min-w-[160px]">
                  {/* Header/Price */}
                  <div className="bg-gradient-to-r from-yellow-600/20 to-transparent p-3 flex justify-between items-center border-b border-white/5">
                      <div className="flex flex-col">
                         <span className="text-[9px] text-yellow-200 uppercase font-bold tracking-wider mb-0.5">Current Highest</span>
                         <span className="text-2xl font-black font-athletic text-yellow-400 leading-none tracking-wide text-shadow">฿{currentHighestBid.toLocaleString()}</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-600/50 animate-bounce-slow">
                          <Crown size={16} className="text-black fill-black" />
                      </div>
                  </div>
                  
                  {/* User Profile */}
                  <div className="p-2 flex items-center gap-2 bg-black/40">
                      {topBidder !== '-' ? (
                        <>
                          <div className="relative">
                            <img src={topBidderAvatar} className="w-8 h-8 rounded-full border-2 border-yellow-500 object-cover" alt={topBidder} />
                            <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-black text-[8px] font-bold px-1 rounded-full border border-black">TOP</div>
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[10px] text-gray-400 leading-none mb-0.5">Bidder</span>
                             <span className="text-xs font-bold text-white leading-none truncate max-w-[80px]">{topBidder}</span>
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-gray-500 font-medium italic w-full text-center py-1">Waiting for bids...</span>
                      )}
                  </div>
              </div>
           </div>
        )}

        {/* --- Host View: Gift Sender Log --- */}
        {isHost && (
          <div className="absolute top-28 left-4 w-60 z-30 flex flex-col gap-2 pointer-events-none">
             {giftLogs.length > 0 && (
               <div className="flex items-center gap-1.5 text-yellow-500 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full w-fit mb-1 border border-yellow-500/20 animate-fade-in">
                 <Gift size={12} />
                 <span className="text-[10px] font-bold uppercase tracking-wider">Recent Gifts</span>
               </div>
             )}
             
             <div className="flex flex-col gap-2 max-h-[35vh] overflow-hidden" style={{ maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)' }}>
                {giftLogs.map((log, index) => (
                   <div 
                     key={log.id} 
                     className={`flex items-center gap-2 bg-gradient-to-r from-gray-900/90 to-gray-800/80 backdrop-blur-md p-1.5 pr-3 rounded-full border border-white/10 shadow-lg transform transition-all duration-500 animate-slide-in-left ${index === 0 ? 'border-yellow-500/50 shadow-yellow-500/20' : ''}`}
                   >
                      <div className="relative">
                         <img src={log.avatar} className="w-8 h-8 rounded-full border border-gray-600 object-cover" />
                         <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-black text-[8px] font-bold px-1 rounded-full flex items-center">
                            {log.giftIcon}
                         </div>
                      </div>
                      <div className="flex flex-col min-w-0">
                         <span className="text-xs font-bold text-white truncate max-w-[100px]">{log.sender}</span>
                         <span className="text-[9px] text-gray-400 leading-none">Sent <span className="text-yellow-400 font-medium">{log.giftName}</span></span>
                      </div>
                      <div className="ml-auto flex flex-col items-end">
                          <div className="flex items-center gap-0.5 text-yellow-400 font-bold text-[10px]">
                             <Coins size={8} className="fill-yellow-400" />
                             {log.price}
                          </div>
                          <span className="text-[8px] text-gray-500">{log.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}

        {/* --- Full Screen Gift Animation Overlay --- */}
        {giftAnimation && (
           <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none overflow-hidden">
              <div className={`absolute w-[200%] h-[200%] bg-gradient-to-r ${giftAnimation.color} opacity-20 animate-spin-slow`} 
                   style={{ maskImage: 'radial-gradient(circle, black 30%, transparent 70%)', WebkitMaskImage: 'radial-gradient(circle, black 30%, transparent 70%)' }}>
              </div>
              <div className="relative z-10 text-[180px] drop-shadow-[0_0_25px_rgba(255,255,255,0.6)] animate-gift-entrance filter contrast-125">
                 {giftAnimation.icon}
              </div>
              <div className="relative z-10 mt-8 text-center animate-text-slide-up">
                 <div className="text-yellow-400 font-black font-athletic text-3xl uppercase tracking-widest drop-shadow-md stroke-black">
                    {giftAnimation.sender}
                 </div>
                 <div className="text-white font-bold text-lg bg-black/40 px-4 py-1 rounded-full backdrop-blur-md border border-white/20 mt-2 inline-flex items-center gap-2">
                    Sent <span className={`bg-gradient-to-r ${giftAnimation.color} bg-clip-text text-transparent font-black uppercase`}>{giftAnimation.name}</span>
                 </div>
              </div>
              <div className="absolute inset-0 pointer-events-none">
                 {[...Array(6)].map((_, i) => (
                    <div key={i} className="absolute left-1/2 top-1/2 w-2 h-2 bg-white rounded-full animate-ping" 
                         style={{ 
                            animationDuration: '1s', 
                            animationDelay: `${i * 0.1}s`,
                            transform: `rotate(${i * 60}deg) translate(100px)` 
                         }}>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {/* --- Floating Hearts --- */}
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

        {/* --- Bottom Interactive Layer --- */}
        <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col justify-end pb-4 px-4 pt-20">
          
          {/* Comments - Height adjusted */}
          <div className="h-72 overflow-y-auto no-scrollbar flex flex-col justify-end space-y-2 mb-4" style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%)' }}>
            {comments.slice(-5).map((c) => (
              <div key={c.id} className={`flex items-start gap-2 max-w-[85%] ${c.isSystem ? 'w-full max-w-none justify-center' : ''}`}>
                 
                 {!c.isSystem && (
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 flex-shrink-0 mt-1 shadow-sm">
                       {c.avatar ? (
                          <img src={c.avatar} className="w-full h-full object-cover" alt={c.username} />
                       ) : (
                          <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                             <User size={14} className="text-gray-400" />
                          </div>
                       )}
                    </div>
                 )}

                 <div className={`${c.isSystem ? 'bg-black/20 text-center w-fit mx-auto px-4 py-1' : 'bg-black/40 backdrop-blur-sm px-3 py-2 border border-white/5'} rounded-2xl`}>
                    {!c.isSystem && (
                      <span className={`text-[10px] font-bold block mb-0.5 ${c.username === 'Me' ? 'text-yellow-400' : 'text-gray-400'}`}>
                        {c.username}
                      </span>
                    )}
                    <span className={`text-sm text-white ${c.isSystem ? 'text-xs font-medium text-gray-300' : ''}`}>
                       {c.message}
                    </span>
                 </div>
              </div>
            ))}
            <div ref={commentsEndRef} />
          </div>

          {/* --- Auction Control Panel (Visible if Auction & NOT Host) --- */}
          {streamer.isAuction && !isHost && (
             <div className="mb-4 bg-gradient-to-br from-yellow-900/40 to-black/40 backdrop-blur-md rounded-2xl border border-yellow-500/30 p-3 shadow-xl">
                
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                             <Gavel size={16} className="text-black" />
                        </div>
                        <div className="flex flex-col">
                             <span className="text-[10px] text-yellow-200 uppercase tracking-wider">{t.currentBid}</span>
                             <span className="text-xl font-black font-athletic text-white leading-none">฿{currentHighestBid.toLocaleString()}</span>
                        </div>
                    </div>
                    
                    {/* Viewer Control Panel: Top Bidder Display */}
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-gray-400 block mb-1">{t.topBidder}</span>
                        {topBidder !== '-' ? (
                            <div className="flex items-center gap-2 bg-black/40 rounded-full pl-1 pr-3 py-0.5 border border-white/10">
                                <img src={topBidderAvatar} className="w-5 h-5 rounded-full border border-yellow-500 object-cover" />
                                <span className="text-xs font-bold text-yellow-400 truncate max-w-[80px]">{topBidder}</span>
                            </div>
                        ) : (
                            <span className="text-xs font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">-</span>
                        )}
                    </div>
                </div>

                <div className="flex justify-between items-center bg-black/40 rounded-lg px-3 py-1.5 mb-2 border border-white/5">
                   <span className="text-[10px] text-gray-400 flex items-center gap-1.5 font-medium">
                      <Wallet size={12} /> {t.myWallet}
                   </span>
                   <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold font-athletic ${isInsufficientFunds ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                         ฿{walletBalance.toLocaleString()}
                      </span>
                   </div>
                </div>

                <div className="flex items-center gap-3">
                   <div className={`flex-1 rounded-xl flex items-center justify-between p-1 border transition-colors ${isInsufficientFunds ? 'bg-red-900/20 border-red-500/50' : 'bg-black/50 border-white/10'}`}>
                       <button 
                         onClick={decreaseBid}
                         className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white active:scale-95 transition-all"
                       >
                         <Minus size={18} />
                       </button>
                       <div className="flex flex-col items-center">
                          <span className="text-[9px] text-gray-500 uppercase">{t.yourBid}</span>
                          <span className={`text-lg font-bold ${isInsufficientFunds ? 'text-red-500' : 'text-white'}`}>฿{myBidAmount.toLocaleString()}</span>
                       </div>
                       <button 
                         onClick={increaseBid}
                         className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white active:scale-95 transition-all"
                       >
                         <Plus size={18} />
                       </button>
                   </div>

                   <button 
                     onClick={isInsufficientFunds ? onOpenWallet : placeBid}
                     className={`h-12 px-4 rounded-xl font-bold text-sm shadow-lg transition-all flex flex-col items-center justify-center min-w-[100px] ${
                        bidSuccess 
                          ? 'bg-green-600 text-white'
                          : isInsufficientFunds
                            ? 'bg-red-900 border border-red-500 text-white hover:bg-red-800' // Top Up Style
                            : 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400 active:scale-95 shadow-red-900/40' // Normal Bid Style
                     }`}
                   >
                     {bidSuccess ? (
                         <span>{t.bidSuccess}</span>
                     ) : isInsufficientFunds ? (
                         <div className="flex flex-col items-center">
                            <span className="leading-none text-[10px] opacity-80 mb-0.5">Insufficient</span>
                            <span className="leading-none flex items-center gap-1 uppercase">{t.topUp} <ChevronRight size={10} /></span>
                         </div>
                     ) : (
                         <span className="leading-none">{t.placeBid}</span>
                     )}
                   </button>
                </div>
             </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-3">
            
            {!streamer.isAuction && (
              <button 
                onClick={() => setShowProducts(true)}
                className="relative flex-shrink-0 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-black shadow-lg shadow-yellow-400/20 active:scale-95"
              >
                <ShoppingBag size={20} />
                <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {streamer.itemCount}
                </div>
              </button>
            )}

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

            {/* Gift Button - New Position */}
            {!isHost && (
              <button 
                onClick={() => setShowGifts(true)}
                className="flex-shrink-0 w-10 h-10 bg-gradient-to-tr from-yellow-600 to-yellow-400 rounded-full flex items-center justify-center text-black shadow-lg shadow-yellow-500/30 active:scale-95 border-2 border-yellow-200/50"
              >
                <Gift size={20} />
              </button>
            )}

            <button 
              onClick={handleSendHeart}
              disabled={isHost}
              className={`flex-shrink-0 w-10 h-10 bg-white/10 backdrop-blur border border-white/20 rounded-full flex items-center justify-center transition-transform ${isHost ? 'text-gray-500 opacity-50 cursor-not-allowed' : 'text-red-500 active:scale-90'}`}
            >
              <Heart fill={!isHost && heartCount > 0 ? "#ef4444" : "none"} size={24} />
            </button>
          </div>
        </div>

        {/* --- Gift Sheet --- */}
        {showGifts && (
           <div className="absolute inset-0 z-40 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
              <div 
                className="bg-gray-900/95 backdrop-blur-xl rounded-t-3xl border-t border-gray-700 flex flex-col shadow-2xl pb-4"
                onClick={(e) => e.stopPropagation()}
              >
                 <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                       <h3 className="text-white font-bold text-lg flex items-center gap-2">
                          <Gift size={18} className="text-yellow-400"/> Gifts
                       </h3>
                       <div className="bg-black/40 px-3 py-1 rounded-full border border-yellow-500/30 flex items-center gap-1.5">
                          <Coins size={12} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-yellow-400 text-xs font-bold">{walletBalance}</span>
                          <button 
                            onClick={onOpenWallet}
                            className="bg-yellow-500 text-black rounded-full w-4 h-4 flex items-center justify-center ml-1 hover:bg-yellow-400"
                          >
                             <Plus size={10} strokeWidth={4} />
                          </button>
                       </div>
                    </div>
                    <button onClick={() => setShowGifts(false)} className="text-gray-400 p-2">
                       <X size={20} />
                    </button>
                 </div>
                 <div className="grid grid-cols-3 gap-3 p-4">
                    {GIFTS.map(gift => (
                       <button
                         key={gift.id}
                         onClick={() => handleSendGift(gift)}
                         className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all active:scale-95 group ${
                            walletBalance >= gift.price 
                            ? 'bg-gray-800 border-gray-700 hover:border-yellow-500 hover:bg-gray-750' 
                            : 'bg-gray-800/50 border-gray-800 opacity-60 cursor-not-allowed'
                         }`}
                       >
                          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{gift.icon}</div>
                          <span className="text-xs font-bold text-white mb-1">{gift.name}</span>
                          <span className="text-[10px] text-yellow-400 font-medium bg-black/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                             <Coins size={8} className="fill-yellow-400" /> {gift.price}
                          </span>
                       </button>
                    ))}
                 </div>
                 {walletBalance < 10 && (
                    <div className="mx-4 mt-2 p-3 bg-red-900/20 border border-red-900/50 rounded-xl flex items-center justify-between">
                       <span className="text-xs text-red-200">Insufficient coins?</span>
                       <button 
                          onClick={onOpenWallet}
                          className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                       >
                          Recharge <ChevronRight size={12} />
                       </button>
                    </div>
                 )}
              </div>
           </div>
        )}

        {/* --- Product Sheet --- */}
        {showProducts && !streamer.isAuction && (
          <div className="absolute inset-0 z-30 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
             <div 
               className="bg-gray-900 rounded-t-3xl border-t border-gray-700 h-[70%] flex flex-col shadow-2xl"
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

                <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar pb-10">
                  {streamer.products.map((p) => (
                    <div key={p.id} className="flex bg-gray-800 rounded-lg p-2 gap-3 border border-gray-700">
                      <img src={p.image} className="w-20 h-20 object-cover rounded-md bg-gray-700" />
                      <div className="flex-1 flex flex-col justify-between py-0.5">
                        <div>
                          <h4 className="text-white text-sm font-medium line-clamp-2">{p.name}</h4>
                          {!isHost && <span className="text-xs text-gray-400">{t.stock}: {p.stock}</span>}
                        </div>
                        
                        {isHost ? (
                          <div className="flex justify-between items-end mt-2">
                            <div className="flex flex-col">
                               <span className="text-xs text-gray-500 uppercase">{t.sold}</span>
                               <span className="text-xl font-bold text-red-500 font-athletic">{p.sold || 0}</span>
                            </div>
                            <div className="flex flex-col items-end">
                               <span className="text-xs text-gray-500 uppercase">{t.remaining}</span>
                               <span className="text-xl font-bold text-white font-athletic">{p.stock}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-yellow-400 font-bold">฿{p.price}</span>
                            <button 
                                onClick={() => handleBuyClick(p)}
                                className="bg-red-600 text-white text-xs px-3 py-1.5 rounded font-bold hover:bg-red-700 active:scale-95 transition-all"
                            >
                              {t.buyNow}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}

        {/* --- Product Variant Selection Sheet --- */}
        {selectedProductForPurchase && (
          <div className="absolute inset-0 z-40 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
             <div className="bg-gray-900 rounded-t-3xl border-t border-gray-700 flex flex-col shadow-2xl animate-slide-up max-h-[85%]">
                 
                 {/* Header */}
                 <div className="p-4 border-b border-gray-800 flex gap-4">
                     <img src={selectedProductForPurchase.image} className="w-24 h-24 rounded-lg object-cover bg-gray-800" />
                     <div className="flex-1">
                        <div className="flex justify-between items-start">
                           <span className="text-xl font-bold text-yellow-400">฿{selectedProductForPurchase.price.toLocaleString()}</span>
                           <button onClick={() => setSelectedProductForPurchase(null)} className="text-gray-400"><X size={20}/></button>
                        </div>
                        <span className="text-xs text-gray-500 block mb-1">Stock: {selectedProductForPurchase.stock}</span>
                        <h4 className="text-sm font-medium text-white line-clamp-2">{selectedProductForPurchase.name}</h4>
                     </div>
                 </div>

                 {/* Options Scrollable */}
                 <div className="p-6 space-y-6 overflow-y-auto no-scrollbar">
                     
                     {/* Colors */}
                     {selectedProductForPurchase.colors && selectedProductForPurchase.colors.length > 0 && (
                       <div>
                         <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Color</label>
                         <div className="flex flex-wrap gap-3">
                           {selectedProductForPurchase.colors.map(color => (
                             <button
                               key={color}
                               onClick={() => setPurchaseConfig(prev => ({ ...prev, color }))}
                               className={`w-10 h-10 rounded-full border-2 relative transition-transform ${
                                 purchaseConfig.color === color ? 'border-red-600 scale-110' : 'border-gray-700 hover:border-gray-500'
                               }`}
                               style={{ backgroundColor: color }}
                             >
                               {purchaseConfig.color === color && <Check size={16} className={`absolute inset-0 m-auto ${['#FFFFFF', '#FFFF00'].includes(color) ? 'text-black' : 'text-white'}`} />}
                             </button>
                           ))}
                         </div>
                       </div>
                     )}

                     {/* Sizes */}
                     {selectedProductForPurchase.sizes && selectedProductForPurchase.sizes.length > 0 && (
                       <div>
                         <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Size</label>
                         <div className="flex flex-wrap gap-2">
                           {selectedProductForPurchase.sizes.map(size => (
                             <button
                               key={size}
                               onClick={() => setPurchaseConfig(prev => ({ ...prev, size }))}
                               className={`px-4 py-2 rounded-lg font-bold text-sm transition-all border ${
                                 purchaseConfig.size === size 
                                   ? 'bg-red-600 border-red-600 text-white' 
                                   : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
                               }`}
                             >
                               {size}
                             </button>
                           ))}
                         </div>
                       </div>
                     )}

                     {/* Quantity */}
                     <div>
                       <div className="flex justify-between items-center mb-2">
                          <label className="text-xs font-bold text-gray-400 uppercase">Quantity</label>
                          <span className="text-xs text-gray-500">{selectedProductForPurchase.stock} available</span>
                       </div>
                       <div className="flex items-center gap-4 bg-gray-800 rounded-xl p-2 w-fit border border-gray-700">
                          <button 
                            onClick={() => setPurchaseConfig(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                            className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded-lg hover:bg-gray-600 text-white"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center font-bold text-white text-lg">{purchaseConfig.quantity}</span>
                          <button 
                            onClick={() => setPurchaseConfig(prev => ({ ...prev, quantity: Math.min(selectedProductForPurchase.stock, prev.quantity + 1) }))}
                            className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded-lg hover:bg-gray-600 text-white"
                          >
                            <Plus size={16} />
                          </button>
                       </div>
                     </div>
                 </div>

                 {/* Action Buttons */}
                 <div className="p-4 border-t border-gray-800 flex gap-3 bg-gray-900 pb-8">
                     <button 
                       onClick={() => handleConfirmPurchase('add_to_cart')}
                       className="flex-1 py-3 rounded-xl bg-gray-800 text-white font-bold border border-gray-600 hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                     >
                       <ShoppingBag size={18} /> Add to Cart
                     </button>
                     <button 
                       onClick={() => handleConfirmPurchase('buy_now')}
                       className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-900/40 transition-colors"
                     >
                       Buy Now
                     </button>
                 </div>
             </div>
          </div>
        )}

        {/* --- End Confirmation Modal --- */}
        {showConfirmEnd && (
            <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in px-6">
                <div className="bg-gray-900 p-6 rounded-2xl border border-gray-700 w-full max-w-sm text-center shadow-2xl">
                    <h3 className="text-xl font-bold text-white mb-2">{t.endLiveTitle}</h3>
                    <p className="text-gray-400 mb-6 text-sm">{t.endLiveDesc}</p>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowConfirmEnd(false)}
                            className="flex-1 py-3 rounded-xl bg-gray-800 text-white font-bold hover:bg-gray-700 transition-colors"
                        >
                            {t.cancel}
                        </button>
                        <button 
                            onClick={handleConfirmEnd}
                            className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-900/40 transition-colors"
                        >
                            {t.confirmEnd}
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default LiveRoom;
