
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Heart, Share2, MessageCircle, Gift, ShoppingBag, X,
  Send, DollarSign, User, ChevronRight, Eye, MoreHorizontal,
  Flame, Sparkles, Trophy, Minus, Plus, CreditCard, ShoppingCart,
  Wallet, Settings, Mic, MicOff, Video, VideoOff, LogOut, Check
} from 'lucide-react';
import { Streamer, Comment, Product } from '../types';
import { TRANSLATIONS } from '../constants';
import { GIFTS } from '../constants';
import { socketService } from '../services/socket';
import LiveKitVideo from './LiveKitVideo';

interface LiveRoomProps {
  streamer: Streamer;
  isHost?: boolean;
  onClose: () => void;
  language: 'th' | 'en';
}

interface FloatingHeart {
  id: number;
  left: number;
}

interface CartItem extends Product {
  quantity: number;
  color: string;
  size: string;
}

interface GiftLogItem {
  id: string;
  sender: string;
  avatar: string;
  giftName: string;
  giftIcon: React.ReactNode;
  price: number;
  timestamp: Date;
}

const LiveRoom: React.FC<LiveRoomProps> = ({ streamer, isHost = false, onClose, language }) => {
  const t = TRANSLATIONS[language];

  // State
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showProducts, setShowProducts] = useState(false);
  const [heartCount, setHeartCount] = useState(streamer.likes);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [viewerCount, setViewerCount] = useState(streamer.viewerCount);
  const [showGiftSelector, setShowGiftSelector] = useState(false);
  const [giftAnimation, setGiftAnimation] = useState<{ id: number, icon: React.ReactNode, name: string, sender: string, color: string } | null>(null);

  // Auction State
  const [currentHighestBid, setCurrentHighestBid] = useState(streamer.currentBid || streamer.auctionStartingPrice || 0);
  const [myBidAmount, setMyBidAmount] = useState((streamer.currentBid || streamer.auctionStartingPrice || 0) + 50);
  const [auctionTimeLeft, setAuctionTimeLeft] = useState<string>('');
  const [showBidModal, setShowBidModal] = useState(false);

  // Commerce State
  const [selectedProductForPurchase, setSelectedProductForPurchase] = useState<Product | null>(null);
  const [purchaseConfig, setPurchaseConfig] = useState({ quantity: 1, color: '', size: '' });
  const [walletBalance, setWalletBalance] = useState(5000); // Mock wallet
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Host Controls
  const [giftLogs, setGiftLogs] = useState<GiftLogItem[]>([]);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [videoError, setVideoError] = useState(false); // To handle video load failures

  const commentsEndRef = useRef<HTMLDivElement>(null);
  const heartIdCounter = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Auto-scroll comments
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  // Initial Setup & Socket Listeners
  useEffect(() => {
    socketService.joinRoom(streamer.id);

    const cleanup = socketService.onComment((comment) => {
      setComments(prev => [...prev, comment]);
    });

    const cleanupBids = socketService.onBidUpdate((data) => {
      setCurrentHighestBid(data.amount);
      // Also animate or show toast
      const newComment: Comment = {
        id: Date.now().toString(),
        username: data.user,
        message: `placed a bid of ฿${(data.amount || 0).toLocaleString()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true // Add styling for system messages
      };
      setComments(prev => [...prev, newComment]);
    });

    return () => {
      cleanup();
      cleanupBids();
      socketService.leaveRoom();
    };
  }, [streamer.id]);

  // Auction Timer Logic
  useEffect(() => {
    if (streamer.isAuction && streamer.auctionEndTime) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const end = new Date(streamer.auctionEndTime!).getTime();
        const diff = end - now;

        if (diff <= 0) {
          setAuctionTimeLeft('ENDED');
        } else {
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);
          setAuctionTimeLeft(`${m}:${s.toString().padStart(2, '0')}`);
        }
      };

      updateTimer();
      const timerInterval = setInterval(updateTimer, 1000);
      return () => clearInterval(timerInterval);
    }
  }, [streamer.isAuction, streamer.auctionEndTime]);

  // Video & Camera Handling (Legacy & YouTube)
  useEffect(() => {
    // Skip if using LiveKit, the LiveKitVideo component handles it
    if (streamer.useLiveKit) return;

    // 1. Viewer Mode: Play Video URL
    if (streamer.videoUrl && !isHost) {
      if (videoRef.current) {
        videoRef.current.play().catch(e => {
          console.log('Autoplay prevented or failed:', e);
          // Don't set error immediately, let poster show
        });
      }
    }
    // 2. Host Mode: Enable Camera (Legacy getUserMedia)
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
  }, [streamer.videoUrl, streamer.useLiveKit, isHost]);

  const addFloatingHeart = () => {
    setHeartCount(prev => prev + 1);
    const id = heartIdCounter.current++;
    const left = Math.floor(Math.random() * 40) + 50; // Random position 50-90%
    setFloatingHearts(prev => [...prev, { id, left }]);
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== id));
    }, 1500);
  };

  const triggerGiftAnimation = (gift: typeof GIFTS[0], sender: string) => {
    const id = Date.now();
    setGiftAnimation({ id, icon: gift.icon, name: gift.name, sender, color: gift.color });
    setTimeout(() => setGiftAnimation(null), 3000);
  };

  // Handlers
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    socketService.sendComment({
      id: Date.now().toString(),
      username: isHost ? 'Me (Host)' : 'Me',
      message: newComment,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isHost: isHost
    });

    setNewComment('');

    // Simulate getting hearts when commenting
    if (Math.random() > 0.7) addFloatingHeart();
  };

  const handleLike = () => {
    addFloatingHeart();
    // In real app, emit socket event
  };

  // Auction Handlers
  const increaseBid = () => setMyBidAmount(prev => prev + 50);
  const decreaseBid = () => {
    if (myBidAmount - 50 > currentHighestBid) {
      setMyBidAmount(prev => prev - 50);
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
    if (walletBalance < gift.price) {
      onOpenWallet();
      return;
    }

    // Deduct balance
    setWalletBalance(prev => prev - gift.price);
    setShowGiftSelector(false);

    // Trigger Animation locally
    triggerGiftAnimation(gift, 'Me');

    // Emit to server
    socketService.emit('send_gift', { giftId: gift.id });

    // If host, add to log (logic mock)
    if (isHost) {
      processGift(gift, 'Viewer 1');
    }
  };

  // Cart Management
  const handleUpdateCartQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const newCart = [...prev];
      const item = newCart[index];
      const newQuantity = item.quantity + delta;
      if (newQuantity <= 0) {
        // Remove if quantity becomes 0? Or just min 1
        return newCart.filter((_, i) => i !== index);
      }
      item.quantity = newQuantity;
      return newCart;
    });
  };

  const handleRemoveCartItem = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleCheckoutCart = () => {
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    if (walletBalance >= total) {
      onUseCoins(total);
      alert(`Checkout successful! Paid ฿${total.toLocaleString()}`);
      setCart([]);
      setShowCart(false);
    } else {
      alert('Insufficient coins!');
      onOpenWallet();
    }
  };

  // Buy Now Logic - Step 1: Open Selection Sheet
  const handleBuyNow = (product: Product) => {
    setShowProducts(false); // Close list to "replace" with purchase modal
    setSelectedProductForPurchase(product);
    setPurchaseConfig({
      quantity: 1,
      color: product.colors?.[0] || '',
      size: product.sizes?.[0] || ''
    });
  };

  // Buy Now Logic - Step 2: Confirm Purchase (Direct or Cart)
  const handleConfirmPurchase = (action: 'buy_now' | 'add_to_cart') => {
    if (!selectedProductForPurchase) return;

    const totalCost = selectedProductForPurchase.price * purchaseConfig.quantity;

    if (action === 'buy_now') {
      if (walletBalance >= totalCost) {
        onUseCoins(totalCost); // Deduct coins
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

  // Mock functions for cart/wallet interactions
  const onAddToCart = (item: CartItem) => {
    setCart(prev => [...prev, item]);
    setHeartCount(prev => prev + 1); // easter egg
  };
  const onUseCoins = (amount: number) => {
    setWalletBalance(prev => prev - amount);
  };
  const onOpenWallet = () => setShowWalletModal(true);

  // Handle incoming or sent gifts logic (Mock processing for host view)
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
      // Logic for small interactions
    } else {
      // Full screen animation
      triggerGiftAnimation(gift, sender);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col md:flex-row h-[100dvh] w-full overflow-hidden">

      {/* --- LEFT: VIDEO AREA (Mobile: Full Screen, Desktop: 2/3) --- */}
      <div className="relative flex-1 bg-gray-900 overflow-hidden flex items-center justify-center">

        {/* Main Video Layer */}
        <div className="absolute inset-0 bg-black">
          {streamer.useLiveKit ? (
            // LiveKit WebRTC Video
            <LiveKitVideo
              roomName={streamer.id}
              isHost={isHost}
              participantName={isHost ? 'Me (Host)' : 'Guest Viewer'}
              onLeave={onClose}
            />
          ) : (isVideoEnabled || !isHost) && (streamer.videoUrl && !videoError) ? (
            // YouTube or Direct Video
            <div className="w-full h-full relative">
              {streamer.youtubeId ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${streamer.youtubeId}?autoplay=1&mute=0&controls=0&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full object-cover pointer-events-none"
                ></iframe>
              ) : (
                <video
                  ref={videoRef}
                  src={streamer.videoUrl}
                  className="w-full h-full object-cover"
                  muted={isHost} // Host mutes own preview to avoid feedback (if using video element directly)
                  playsInline
                  loop
                  autoPlay
                  onError={() => setVideoError(true)}
                />
              )}

              {/* Interaction Overlay (Invisible layer to capture double taps) */}
              <div
                className="absolute inset-0 z-10"
                onDoubleClick={handleLike}
              ></div>
            </div>
          ) : (
            // Fallback Cover Image
            <div className="w-full h-full relative">
              <img src={streamer.coverImage} className="w-full h-full object-cover blur-sm opacity-50" alt="Cover" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center animate-pulse">
                  <User size={40} className="text-gray-400" />
                </div>
                <p className="mt-4 text-gray-400 font-medium">Waiting for video...</p>
              </div>
            </div>
          )}
        </div>

        {/* Top Info Bar (Overlay) */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-safe-top z-20 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex justify-between items-start">
            {/* Host Info */}
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md rounded-full p-1 pr-4 border border-white/10">
              <img src={streamer.coverImage} className="w-9 h-9 rounded-full border border-white" alt="Host" />
              <div>
                <h3 className="text-xs font-bold text-white max-w-[100px] truncate">{streamer.name}</h3>
                <p className="text-[10px] text-gray-300 flex items-center gap-1">
                  <User size={8} /> {(viewerCount || 0).toLocaleString()}
                </p>
              </div>
              {!isHost && (
                <button className="ml-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1 rounded-full transition-colors shadow-lg shadow-red-900/40">
                  Follow
                </button>
              )}
            </div>

            {/* Right Actions */}
            <div className="flex gap-2">
              {/* Auction Timer Overlay */}
              {streamer.isAuction && (
                <div className="bg-black/60 backdrop-blur-md rounded-lg px-3 py-1 border border-orange-500/50 flex flex-col items-center">
                  <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">Time Left</span>
                  <span className="text-sm font-mono font-bold text-white tabular-nums">{auctionTimeLeft}</span>
                </div>
              )}
              {isHost ? (
                <button
                  onClick={() => {
                    if (window.confirm(language === 'th' ? "ต้องการจบไลฟ์ใช่หรือไม่?" : "Are you sure you want to end the live stream?")) {
                      onClose();
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-full transition-colors shadow-lg shadow-red-900/40 flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  {language === 'th' ? "จบไลฟ์" : "END LIVE"}
                </button>
              ) : (
                <button onClick={onClose} className="w-9 h-9 flex items-center justify-center bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/50 transition-colors">
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Host Stats (Only for Host) */}
          {isHost && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 min-w-max">
                <Heart size={14} className="text-pink-500 fill-pink-500" />
                <span className="text-xs font-bold">{(heartCount || 0).toLocaleString()} Likes</span>
              </div>
              <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 min-w-max">
                <Gift size={14} className="text-purple-400" />
                <span className="text-xs font-bold">12 Gifts</span>
              </div>
              <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 min-w-max">
                <DollarSign size={14} className="text-green-400" />
                <span className="text-xs font-bold">฿15,400 Sales</span>
              </div>
            </div>
          )}
        </div>

        {/* Auction Floating Card (If Auction is Active) */}
        {streamer.isAuction && (
          <div className="absolute top-24 left-4 right-auto z-20 animate-slide-in">
            <div className="bg-black/70 backdrop-blur-xl rounded-2xl p-3 border border-orange-500/30 shadow-2xl shadow-orange-900/20 max-w-[200px]">
              <div className="flex gap-3">
                <img src={streamer.products[0]?.image} className="w-16 h-16 rounded-xl object-cover bg-gray-800" alt="Auction Item" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Flame size={12} className="text-orange-500 fill-orange-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-orange-400 uppercase">Live Auction</span>
                  </div>
                  <h3 className="text-xs font-bold text-white truncate">{streamer.products[0]?.name}</h3>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-[10px] text-gray-400">Current</span>
                    <span className="text-sm font-bold text-white">฿{(currentHighestBid || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {!isHost && (
                <button
                  onClick={() => setShowBidModal(true)}
                  className="mt-2 w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white text-xs font-bold py-1.5 rounded-lg shadow-lg active:scale-95 transition-all"
                >
                  Place Bid
                </button>
              )}
            </div>
          </div>
        )}

        {/* Featured Product Pin (Removed as per request) */}
        {!streamer.isAuction && streamer.products.length > 0 && !showProducts && !isHost && (
          <div className="hidden absolute top-24 right-4 z-20 animate-slide-in max-w-[160px]">
            {/* Hidden by default now, or just logic removed */}
          </div>
        )}

        {/* Floating Hearts Animation Layer */}
        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
          {floatingHearts.map((heart) => (
            <div
              key={heart.id}
              className="absolute bottom-20 animate-float"
              style={{ left: `${heart.left}%`, animationDuration: `${1.5 + Math.random()}s` }}
            >
              <Heart size={Math.random() * 20 + 20} className="text-pink-500 fill-pink-500 drop-shadow-lg" />
            </div>
          ))}
        </div>

        {/* Gift Animation Layer */}
        {giftAnimation && (
          <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center animate-fade-in">
            <div className="text-center animate-bounce-custom">
              <div className="relative inline-block">
                <div className={`absolute inset-0 bg-${giftAnimation.color}-500 blur-3xl opacity-40 animate-pulse`}></div>
                <div className="relative z-10 text-8xl drop-shadow-2xl filter brightness-110 transform scale-150">
                  {giftAnimation.icon}
                </div>
              </div>
              <div className="mt-8 bg-black/60 backdrop-blur-xl px-6 py-3 rounded-full border border-white/20 shadow-xl">
                <p className="text-xl font-bold text-white">
                  <span className="text-yellow-400">{giftAnimation.sender}</span> sent a {giftAnimation.name}!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* --- BOTTOM CONTROLS --- */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-safe-bottom z-30 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
          {/* Chat Messages Area */}
          <div className="w-full md:w-3/4 max-h-48 md:max-h-60 overflow-y-auto mask-image-linear-gradient flex flex-col justify-end space-y-2 mb-4 pr-10 no-scrollbar">
            {/* System Welcome Message */}
            <div className="bg-red-500/80 self-start text-white text-xs px-3 py-1.5 rounded-xl rounded-tl-none font-medium shadow-sm backdrop-blur-sm max-w-[85%] border border-red-400/30">
              📢 Welcome to {streamer.name}'s room! Please follow the community guidelines.
            </div>

            {comments.map((comment) => (
              <div key={comment.id} className={`flex flex-col items-start max-w-[85%] animate-slide-up ${comment.isSystem ? 'w-full' : ''}`}>
                {comment.isSystem ? (
                  <div className="bg-white/20 backdrop-blur-md self-center text-white text-xs px-3 py-1 rounded-full font-medium my-1">
                    {comment.username} {comment.message}
                  </div>
                ) : (
                  <div className={`px-3 py-1.5 rounded-2xl text-sm break-words shadow-sm backdrop-blur-sm border ${comment.isHost
                    ? 'bg-red-600/80 border-red-500/50 text-white rounded-br-none self-end'
                    : 'bg-black/40 border-white/10 text-white rounded-bl-none self-start'
                    }`}>
                    <span className={`font-bold mr-2 text-xs opacity-90 ${comment.isHost ? 'text-yellow-300' : 'text-gray-300'}`}>
                      {comment.username}
                    </span>
                    {comment.message}
                  </div>
                )}
              </div>
            ))}
            <div ref={commentsEndRef} />
          </div>

          {/* Input & Action Buttons */}
          {!isHost ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-black/40 backdrop-blur-md border border-white/20 rounded-full flex items-center px-2 py-1 focus-within:border-white/50 focus-within:bg-black/60 transition-all">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={t.saySomething}
                  className="flex-1 bg-transparent border-none text-white text-sm px-3 focus:outline-none placeholder-gray-400 h-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(e)}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newComment.trim()}
                  className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>

              {/* Action Buttons Group */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowProducts(true)}
                  className="relative w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-white/10 active:scale-90 transition-all"
                >
                  <ShoppingBag size={20} />
                  {streamer.products.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-[10px] flex items-center justify-center font-bold border border-black">
                      {streamer.products.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setShowGiftSelector(true)}
                  className="w-10 h-10 flex items-center justify-center bg-pink-600/80 backdrop-blur-md rounded-full border border-pink-500/50 text-white hover:bg-pink-500 active:scale-90 transition-all shadow-lg shadow-pink-900/40"
                >
                  <Gift size={20} />
                </button>

                <button
                  onClick={handleLike}
                  className="w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-white/10 active:scale-90 transition-all"
                >
                  <Heart size={20} className={heartCount > streamer.likes ? "fill-pink-500 text-pink-500" : ""} />
                </button>
              </div>
            </div>
          ) : (
            // Host Controls (Professional UX)
            <div className="flex items-center gap-2 w-full">
              {/* Product Button */}
              <button
                onClick={() => setShowProducts(true)}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-white/10 transition-all relative"
              >
                <ShoppingBag size={20} />
                {streamer.products.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-[10px] flex items-center justify-center font-bold border border-black">
                    {streamer.products.length}
                  </span>
                )}
              </button>

              {/* Chat Input (Flex Grow) */}
              <div className="flex-1 bg-black/40 backdrop-blur-md border border-white/20 rounded-full flex items-center px-2 py-1 focus-within:border-white/50 focus-within:bg-black/60 transition-all">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={t.saySomething}
                  className="flex-1 bg-transparent border-none text-white text-sm px-3 focus:outline-none placeholder-gray-400 h-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(e)}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newComment.trim()}
                  className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>

              {/* Hardware Controls (Mic & Cam) */}
              <button
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                className={`w-10 h-10 flex items-center justify-center backdrop-blur-md rounded-full border transition-all ${!isAudioEnabled ? 'bg-red-500/80 border-red-500 text-white' : 'bg-black/40 border-white/20 text-white hover:bg-white/10'}`}
              >
                {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
              </button>

              <button className="w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-white/10 transition-all">
                <CameraSwitchIcon />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* --- RIGHT: PRODUCT SIDEBAR (Desktop Only - Hidden on Mobile unless Toggled) --- */}
      {/* Note: For simplicity in this fix, we'll use Modals for mobile interactions */}

      {/* --- MODALS & BOTTOM SHEETS --- */}

      {/* 1. Gift Selector Sheet */}
      {showGiftSelector && (
        <div className="absolute inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowGiftSelector(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-3xl border-t border-gray-800 animate-slide-up max-h-[60vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Gift className="text-pink-500" size={18} /> Send a Gift
              </h3>
              <div className="flex items-center gap-3">
                <div className="bg-gray-800 px-3 py-1 rounded-full flex items-center gap-1 border border-gray-700">
                  <Wallet size={12} className="text-yellow-500" />
                  <span className="text-xs font-bold text-yellow-500">฿{(walletBalance || 0).toLocaleString()}</span>
                </div>
                <button onClick={() => setWalletBalance(prev => prev + 1000)} className="bg-yellow-500/20 text-yellow-500 text-xs px-2 py-1 rounded hover:bg-yellow-500/30">
                  + Add
                </button>
                <button onClick={() => setShowGiftSelector(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-4 grid grid-cols-4 gap-3 overflow-y-auto pb-safe-bottom">
              {GIFTS.map((gift) => (
                <button
                  key={gift.id}
                  onClick={() => handleSendGift(gift)}
                  className="group flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-gray-800 transition-colors relative"
                >
                  <div className="text-4xl transition-transform group-hover:scale-110 group-active:scale-95">
                    {gift.icon}
                  </div>
                  <span className="text-xs font-medium text-gray-300 truncate w-full text-center">{gift.name}</span>
                  <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded-full border border-yellow-500/20">
                    {gift.price}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Product List Sheet */}
      {showProducts && (
        <div className="absolute inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowProducts(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-3xl border-t border-gray-800 animate-slide-up h-[70vh] flex flex-col">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">
                <ShoppingBag className="text-red-500" size={18} /> Featured Products
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setShowProducts(false); setShowCart(true); }}
                  className="relative bg-gray-800 p-2 rounded-full text-white hover:bg-gray-700 transition-colors border border-gray-700"
                >
                  <ShoppingCart size={20} />
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-[10px] flex items-center justify-center font-bold border border-black">
                      {cart.length}
                    </span>
                  )}
                </button>
                <button onClick={() => setShowProducts(false)} className="bg-gray-800 p-2 rounded-full text-gray-400 hover:text-white border border-gray-700">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-safe-bottom">
              {streamer.products.map(product => (
                <div key={product.id} className="bg-gray-800 rounded-xl p-3 flex gap-3 border border-gray-700">
                  <img src={product.image} className="w-20 h-20 rounded-lg object-cover bg-gray-700" alt={product.name} />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-sm line-clamp-1">{product.name}</h4>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{product.description}</p>

                    {isHost ? (
                      // Host View: Stock & Sales Stats
                      <div className="mt-3 flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-400">Sold: <span className="text-white font-bold">12</span></span>
                          <span className="text-xs text-gray-400">Stock: <span className="text-white font-bold">{product.stock}</span></span>
                        </div>
                        <span className="text-red-500 font-bold">฿{(product.price || 0).toLocaleString()}</span>
                      </div>
                    ) : (
                      // Viewer View: Price & Buy Button
                      <div className="mt-3 flex justify-between items-end">
                        <span className="text-red-500 font-bold text-lg">฿{(product.price || 0).toLocaleString()}</span>
                        <button
                          onClick={() => handleBuyNow(product)}
                          className="bg-white text-black text-xs font-bold px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors shadow-sm"
                        >
                          Buy Now
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

      {/* 2.5 My Cart Modal */}
      {showCart && (
        <div className="absolute inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-3xl border-t border-gray-800 animate-slide-up h-[70vh] flex flex-col">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">
                <ShoppingCart className="text-yellow-500" size={18} /> My Cart
              </h3>
              <button onClick={() => setShowCart(false)} className="bg-gray-800 p-2 rounded-full text-gray-400 hover:text-white border border-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 pb-20">
                  <ShoppingCart size={48} className="mb-4 opacity-50" />
                  <p>Your cart is empty</p>
                  <button onClick={() => { setShowCart(false); setShowProducts(true); }} className="mt-4 text-red-500 font-bold hover:underline">
                    Go Shopping
                  </button>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="bg-gray-800 rounded-xl p-3 flex gap-3 border border-gray-700 relative">
                    <img src={item.image} className="w-20 h-20 rounded-lg object-cover bg-gray-700" alt={item.name} />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white text-sm line-clamp-1">{item.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5 mb-2">
                        {item.color && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span> {item.color}</span>}
                        {item.size && <span>Size: {item.size}</span>}
                      </div>

                      <div className="flex justify-between items-end">
                        <span className="text-red-500 font-bold">฿{(item.price * item.quantity).toLocaleString()}</span>

                        <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-0.5 border border-gray-600">
                          <button onClick={() => handleUpdateCartQuantity(index, -1)} className="w-6 h-6 flex items-center justify-center hover:bg-gray-600 rounded text-white"><Minus size={12} /></button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => handleUpdateCartQuantity(index, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-gray-600 rounded text-white"><Plus size={12} /></button>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleRemoveCartItem(index)} className="absolute top-2 right-2 text-gray-500 hover:text-red-500">
                      <X size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-800 bg-gray-900 pb-safe-bottom">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-400">Total</span>
                  <span className="text-xl font-bold text-white">฿{cart.reduce((acc, item) => acc + (item.price * item.quantity), 0).toLocaleString()}</span>
                </div>
                <button
                  onClick={handleCheckoutCart}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-900/40 transition-all active:scale-95"
                >
                  Checkout ({cart.length} items)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Buy Now / Confirm Purchase Modal */}
      {selectedProductForPurchase && (
        <div className="absolute inset-0 z-[60] flex items-end sm:items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black/60 pointer-events-auto" onClick={() => setSelectedProductForPurchase(null)} />
          <div className="relative z-10 w-full sm:max-w-md bg-gray-900 rounded-t-2xl sm:rounded-2xl border border-gray-800 pointer-events-auto animate-slide-up p-4 space-y-4">

            {/* Product Summary */}
            <div className="flex gap-4">
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-800 border border-gray-700">
                <img src={selectedProductForPurchase.image} className="w-full h-full object-cover" alt="Product" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-white text-lg line-clamp-2">{selectedProductForPurchase.name}</h3>
                  <button onClick={() => setSelectedProductForPurchase(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                </div>
                <p className="text-red-500 text-xl font-bold mt-1">฿{(selectedProductForPurchase.price || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">Stock: {selectedProductForPurchase.stock} available</p>
              </div>
            </div>

            <div className="h-px bg-gray-800 my-2" />

            {/* Options */}
            <div className="space-y-4">
              {/* Color */}
              {selectedProductForPurchase.colors && selectedProductForPurchase.colors.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">Color</label>
                  <div className="flex flex-wrap gap-3">
                    {selectedProductForPurchase.colors.map(color => {
                      const isSelected = purchaseConfig.color === color;
                      return (
                        <button
                          key={color}
                          onClick={() => setPurchaseConfig(prev => ({ ...prev, color }))}
                          className={`w-8 h-8 rounded-full border-2 relative transition-transform ${isSelected ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                          style={{ backgroundColor: color }}
                          title={color}
                        >
                          {isSelected && <Check size={14} className={`absolute inset-0 m-auto ${['#FFFFFF', '#ffffff', '#FFFF00', '#ffff00', 'white', 'yellow'].includes(color) ? 'text-black' : 'text-white'}`} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Size */}
              {selectedProductForPurchase.sizes && selectedProductForPurchase.sizes.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">Size</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedProductForPurchase.sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setPurchaseConfig(prev => ({ ...prev, size }))}
                        className={`w-10 h-10 rounded-lg font-bold text-sm transition-all border ${purchaseConfig.size === size
                          ? 'bg-red-600 border-red-600 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Quantity</label>
                <div className="flex items-center gap-3 bg-gray-800 rounded-xl p-1 w-fit border border-gray-700">
                  <button
                    onClick={() => setPurchaseConfig(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                    className="w-8 h-8 flex items-center justify-center text-white hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center font-bold text-white">{purchaseConfig.quantity}</span>
                  <button
                    onClick={() => setPurchaseConfig(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                    className="w-8 h-8 flex items-center justify-center text-white hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 flex gap-3">
              <button
                onClick={() => handleConfirmPurchase('add_to_cart')}
                className="flex-1 bg-gray-800 border border-gray-700 text-white font-bold py-3 rounded-xl hover:bg-gray-700 transition-colors"
              >
                Add to Cart
              </button>
              <button
                onClick={() => handleConfirmPurchase('buy_now')}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-800 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-900/20 hover:from-red-500 hover:to-red-700 active:scale-95 transition-all"
              >
                Buy Now • ฿{(selectedProductForPurchase.price * purchaseConfig.quantity).toLocaleString()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Bid Modal (For Auction) */}
      {showBidModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBidModal(false)} />
          <div className="relative bg-gray-900 rounded-2xl w-full max-w-sm border border-orange-500/50 p-6 animate-slide-up shadow-2xl shadow-orange-500/10">
            <button onClick={() => setShowBidModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20} /></button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/10 mb-4 animate-pulse">
                <Flame size={32} className="text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-white">Place Your Bid</h3>
              <p className="text-sm text-gray-400 mt-1">Current Highest: <span className="text-orange-500 font-bold">฿{currentHighestBid.toLocaleString()}</span></p>
            </div>

            {/* Bid Controls */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <button
                onClick={decreaseBid}
                disabled={myBidAmount <= currentHighestBid + 50}
                className="w-12 h-12 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-white hover:bg-gray-700 disabled:opacity-30 transition-colors"
              >
                <Minus size={20} />
              </button>
              <div className="text-center min-w-[120px]">
                <span className="block text-3xl font-black text-white">฿{myBidAmount.toLocaleString()}</span>
                {isInsufficientFunds && <span className="text-[10px] text-red-500 font-bold">Insufficient Funds</span>}
              </div>
              <button
                onClick={increaseBid}
                className="w-12 h-12 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-white hover:bg-gray-700 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>

            <button
              onClick={() => { placeBid(); setShowBidModal(false); }}
              disabled={isInsufficientFunds}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-900/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
            >
              CONFIRM BID
            </button>

            <div className="mt-4 flex justify-between items-center text-xs text-gray-400 bg-gray-800/50 p-2 rounded-lg">
              <span>Your Balance: ฿{walletBalance.toLocaleString()}</span>
              <button onClick={onOpenWallet} className="text-orange-500 font-bold hover:underline">Top Up</button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Wallet Modal (Placeholder) */}
      {showWalletModal && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowWalletModal(false)} />
          <div className="relative bg-gray-900 rounded-2xl w-full max-w-sm border border-gray-700 p-6 animate-slide-up">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Wallet /> My Wallet</h3>
            <p className="text-gray-400 mb-6">Insufficient coins. Please top up to continue.</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[100, 300, 500, 1000].map(amount => (
                <button
                  key={amount}
                  onClick={() => { setWalletBalance(prev => prev + amount); setShowWalletModal(false); alert(`Top up ${amount} successful!`); }}
                  className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-yellow-500 hover:bg-yellow-500/10 transition-all flex flex-col items-center gap-1"
                >
                  <span className="text-lg font-bold text-white">฿{amount}</span>
                  <span className="text-xs text-gray-500">{(amount / 35).toFixed(0)} coins</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowWalletModal(false)} className="w-full bg-gray-800 py-3 rounded-xl text-white font-bold">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple Icon component for Camera Switch
const CameraSwitchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 21h5v-5" />
  </svg>
);

export default LiveRoom;
