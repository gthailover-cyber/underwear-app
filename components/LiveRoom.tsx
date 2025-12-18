import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Heart, Share2, MessageCircle, Gift, ShoppingBag, X,
  Send, DollarSign, User, ChevronRight, Eye, MoreHorizontal,
  Flame, Sparkles, Trophy, Minus, Plus, CreditCard, ShoppingCart,
  Wallet, Settings, Mic, MicOff, Video, VideoOff, LogOut, Check, MapPin, ArrowLeft
} from 'lucide-react';
import { Streamer, Comment, Product, CartItem, GiftLogItem } from '../types';
import { TRANSLATIONS } from '../constants';
import { GIFTS } from '../constants';
import { socketService } from '../services/socket';
import { liveKitService } from '../services/livekit';
import { supabase } from '../lib/supabaseClient';
import LiveKitVideo from './LiveKitVideo';

interface LiveRoomProps {
  streamer: Streamer;
  isHost?: boolean;
  onClose: () => void;
  language: 'th' | 'en';
  // Props passed from App.tsx handling global state
  walletBalance?: number;
  onUseCoins?: (amount: number) => void;
  onOpenWallet?: () => void;
  onAddToCart?: (item: CartItem) => void;
  onNewOrder?: () => void;
  currentUser?: { id: string; username: string; avatar: string; };
}

interface FloatingHeart {
  id: number;
  left: number;
}

const LiveRoom: React.FC<LiveRoomProps> = ({
  streamer,
  isHost = false,
  onClose,
  language,
  walletBalance: propWalletBalance = 0, // Default to 0 if not passed
  onUseCoins,
  onOpenWallet: propOnOpenWallet,
  onAddToCart: propOnAddToCart,
  onNewOrder,
  currentUser
}) => {
  const t = TRANSLATIONS[language];

  // Initialize local wallet balance from prop if available, else usage internal mock (which was 5000)
  // For consistency with App.tsx which holds the truth, we should prefer prop.
  // But given existing code uses 'walletBalance' state initialized to 5000, 
  // let's sync it.
  const [walletBalance, setWalletBalance] = useState(propWalletBalance || 5000);

  // Update internal balance when prop changes (if real-time updates come from App)
  useEffect(() => {
    if (propWalletBalance !== undefined) {
      setWalletBalance(propWalletBalance);
    }
  }, [propWalletBalance]);

  // Wrapper for actions that might use parent handlers
  const onOpenWallet = () => {
    if (propOnOpenWallet) propOnOpenWallet();
    else setShowWalletModal(true);
  };

  const onUseCoinsLocal = (amount: number) => {
    if (onUseCoins) {
      onUseCoins(amount);
      // prop update will sync via useEffect, but for instant UI:
      setWalletBalance(prev => prev - amount);
    } else {
      setWalletBalance(prev => prev - amount);
    }
  };

  const onAddToCartLocal = (item: CartItem) => {
    if (propOnAddToCart) propOnAddToCart(item);
    // Also keep local cart or just rely on parent? 
    // The current LiveRoom has its own local 'cart' state.
    // Let's keep using local cart state for the UI inside LiveRoom for now as refactoring entire logic might break things.
    // The user just asked for "Add to Cart" notification essentially. 
    // Wait, the previous request added a full Cart Modal inside LiveRoom. 
    // So LiveRoom HAS a local cart.
    setCart(prev => [...prev, item]);
    setHeartCount(prev => prev + 1);
  };

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
  // walletBalance removed (duplicate)
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Checkout State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState('');

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

  // Fetch User Address on Mount
  useEffect(() => {
    const fetchAddress = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          const formatted = `${data.name} ${data.phone}\n${data.address} ${data.province} ${data.postal_code}`;
          setUserAddress(formatted);
        }
      }
    };
    fetchAddress();
  }, []);

  // Initial Setup & Socket Listeners
  useEffect(() => {
    if (currentUser) {
      socketService.updateUser(currentUser);
    }
    socketService.joinRoom(streamer.id, streamer.hostId);

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

    const cleanupViewers = socketService.on('viewer_update', (data: any) => {
      setViewerCount(data.count);
    });

    return () => {
      cleanup();
      cleanupBids();
      cleanupViewers();
      socketService.leaveRoom();
    };
  }, [streamer.id, currentUser]);

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
      username: currentUser?.username || 'User',
      avatar: currentUser?.avatar || '',
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
    onUseCoinsLocal(gift.price);
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
    setShowCheckoutModal(true);
    setShowCart(false);
  };

  const toggleMicrophone = async () => {
    const newState = !isAudioEnabled;
    await liveKitService.enableMicrophone(newState);
    setIsAudioEnabled(newState);
  };

  const processOrder = async (items: CartItem[]) => {
    const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    if (!userAddress) {
      alert("Please add a shipping address in your profile or use Checkout to enter one.");
      return false;
    }

    if (walletBalance < total) {
      alert('Insufficient coins. Please top up.');
      onOpenWallet();
      return false;
    }

    // Deduct coins
    onUseCoinsLocal(total);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // 1. Insert Order
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            buyer_id: user.id,
            total_amount: total,
            status: 'shipping', // Paid immediately
            shipping_address: userAddress,
          })
          .select()
          .single();

        if (orderError) throw orderError;

        if (orderData) {
          // 2. Insert Order Items
          const itemsToInsert = items.map(item => ({
            order_id: orderData.id,
            product_id: item.id,
            product_name: item.name,
            product_image: item.image,
            quantity: item.quantity,
            price: item.price,
            color: item.color,
            size: item.size
          }));

          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }
      }

      alert(`Payment successful! Items will be shipped to: ${userAddress}`);
      onNewOrder?.();
      return true;

    } catch (err: any) {
      console.error("Exception creating order:", err);
      alert(`Failed to create order: ${err.message || err}`);
      return false;
    }
  };

  const handleFinalPayment = async () => {
    const success = await processOrder(cart);
    if (success) {
      setCart([]);
      setShowCheckoutModal(false);
    }
  };

  const handleSaveAddress = () => {
    if (tempAddress.trim()) {
      setUserAddress(tempAddress);
      setIsEditingAddress(false);
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
  const handleConfirmPurchase = async (action: 'buy_now' | 'add_to_cart') => {
    if (!selectedProductForPurchase) return;

    if (action === 'buy_now') {
      const tempItem: CartItem = {
        ...selectedProductForPurchase,
        quantity: purchaseConfig.quantity,
        color: purchaseConfig.color,
        size: purchaseConfig.size
      };

      const success = await processOrder([tempItem]);
      if (success) {
        setSelectedProductForPurchase(null); // Close sheet
      }
    } else {
      // Add to Cart
      const cartItem: CartItem = {
        ...selectedProductForPurchase,
        quantity: purchaseConfig.quantity,
        color: purchaseConfig.color,
        size: purchaseConfig.size
      };
      onAddToCartLocal(cartItem);
      alert('Added to Cart!');
      setSelectedProductForPurchase(null);
    }
  };

  const isInsufficientFunds = myBidAmount > walletBalance;

  // Mock functions removed (using onUseCoinsLocal / onAddToCartLocal)

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
              <img src={streamer.avatar || streamer.coverImage} className="w-9 h-9 rounded-full border border-white object-cover" alt="Host" />
              <div>
                <h3 className="text-xs font-bold text-white max-w-[100px] truncate">{streamer.name}</h3>
                <p className="text-[10px] text-gray-300 flex items-center gap-1">
                  <User size={8} /> {(viewerCount || 0).toLocaleString()}
                </p>
              </div>
              <button className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold ml-2">
                FOLLOW
              </button>
            </div>

            {/* Top Right Controls */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2 overflow-hidden max-w-[100px]">
                {[1, 2, 3].map((i) => (
                  <img
                    key={i}
                    src={`https://picsum.photos/30/30?random=${i + 10}`}
                    className="w-8 h-8 rounded-full border border-white"
                    alt="Viewer"
                  />
                ))}
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-white/20">
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Gift Animation Overlay */}
        {giftAnimation && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-bounce-in">
            <div className="text-center">
              <div className="text-6xl mb-2 filter drop-shadow-lg animate-pulse">{giftAnimation.icon}</div>
              <div className={`text-2xl font-bold font-athletic text-${giftAnimation.color}-400 drop-shadow-md`}>
                {giftAnimation.sender} sent {giftAnimation.name}!
              </div>
            </div>
          </div>
        )}

        {/* Floating Hearts */}
        {floatingHearts.map(heart => (
          <div
            key={heart.id}
            className="absolute bottom-20 z-20 animate-float-up pointer-events-none"
            style={{ left: `${heart.left}%` }}
          >
            <Heart
              size={Math.random() * 20 + 20}
              className={`fill-${['red', 'pink', 'purple', 'blue'][Math.floor(Math.random() * 4)]}-500 text-transparent opacity-80`}
            />
          </div>
        ))}
      </div>

      {/* --- RIGHT: INTERACTION AREA (Mobile: Bottom Overlay, Desktop: Side Panel) --- */}
      <div className="absolute bottom-0 left-0 right-0 md:relative md:w-[350px] md:bg-black/90 md:border-l md:border-gray-800 flex flex-col z-30 h-[40%] md:h-full bg-gradient-to-t from-black via-black/80 to-transparent md:bg-none">

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 no-scrollbar mask-image-linear-gradient">
          {/* Welcome Message */}
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-2 mb-4">
            <p className="text-yellow-200 text-xs">
              Welcome to the stream! Please be respectful and have fun.
              WARNING: Do not share personal information.
            </p>
          </div>

          {/* Comments */}
          {comments.map((comment) => (
            <div key={comment.id} className={`flex items-start gap-2 animate-fade-in ${comment.isSystem ? 'opacity-75 italic' : ''}`}>
              {!comment.isSystem && (
                <img
                  src={comment.avatar || `https://ui-avatars.com/api/?name=${comment.username}&background=random`}
                  className="w-6 h-6 rounded-full mt-0.5 border border-white/20"
                  alt={comment.username}
                />
              )}
              <div className={`${comment.isSystem ? 'bg-white/10 w-full text-center' : 'bg-black/40'} rounded-2xl px-3 py-1.5 backdrop-blur-sm`}>
                <p className="text-[10px] text-gray-400 font-bold mb-0.5">
                  {comment.username}
                  {comment.isHost && <span className="ml-1 bg-red-600 text-white text-[8px] px-1 rounded">HOST</span>}
                </p>
                <p className={`text-sm ${comment.isSystem ? 'text-yellow-300' : 'text-white'}`}>{comment.message}</p>
              </div>
            </div>
          ))}
          <div ref={commentsEndRef} />
        </div>

        {/* Bottom Controls */}
        <div className="p-4 pb-safe-bottom space-y-3 bg-gradient-to-t from-black to-transparent md:bg-black">

          {/* Action Bar */}
          <div className="flex items-center gap-3">
            {!isHost ? (
              // Viewer Controls
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

                {/* Chat Input */}
                <div className="flex-1 bg-black/40 backdrop-blur-md border border-white/20 rounded-full flex items-center px-2 py-1 focus-within:border-white/50 focus-within:bg-black/60 transition-all">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Say something..."
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

                {/* Gift & Like Buttons */}
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
            ) : (
              // Host Controls (Professional UX)
              <div className="flex items-center gap-2 w-full">
                {/* Sales Stats (Replaces Product Button) */}
                <div className="flex-shrink-0 bg-black/40 backdrop-blur-md rounded-full border border-white/20 text-white px-4 py-2 flex items-center gap-2">
                  <DollarSign size={16} className="text-green-400" />
                  <span className="text-xs font-bold">฿15,400</span>
                </div>

                {/* Chat Input for Host */}
                <div className="flex-1 bg-black/40 backdrop-blur-md border border-white/20 rounded-full flex items-center px-2 py-1 focus-within:border-white/50 focus-within:bg-black/60 transition-all">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Type to chat..."
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

                {/* Microphone Toggle (Replaces Gift Button) */}
                <button
                  onClick={toggleMicrophone}
                  className={`w-10 h-10 flex items-center justify-center backdrop-blur-md rounded-full border transition-all shadow-lg ${isAudioEnabled
                    ? 'bg-white/20 border-white/30 text-white hover:bg-white/30'
                    : 'bg-red-600 border-red-500 text-white hover:bg-red-500'
                    }`}
                >
                  {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* --- OVERLAYS --- */}

        {/* Product List */}
        {showProducts && (
          <div className="absolute inset-0 z-40 bg-black/90 flex flex-col animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">Products ({streamer.products.length})</h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => { setShowProducts(false); setShowCart(true); }}
                  className="relative p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <ShoppingCart size={24} className="text-white" />
                  {cart.length > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-600 rounded-full text-[10px] flex items-center justify-center font-bold border border-black">
                      {cart.length}
                    </span>
                  )}
                </button>
                <button onClick={() => setShowProducts(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <X size={24} className="text-white" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {streamer.products.map((product) => (
                <div key={product.id} className="flex gap-3 bg-gray-800/50 p-3 rounded-xl border border-white/5">
                  <img src={product.image} className="w-20 h-20 rounded-lg object-cover bg-gray-700" alt={product.name} />
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-white line-clamp-2">{product.name}</h3>
                    <p className="text-lg font-bold text-yellow-400 mt-1">฿{product.price.toLocaleString()}</p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleBuyNow(product)}
                        className="flex-1 bg-red-600 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-red-700"
                      >
                        BUY NOW
                      </button>
                      <button
                        onClick={() => {
                          // Open selection sheet for cart too
                          setShowProducts(false);
                          setSelectedProductForPurchase(product);
                          setPurchaseConfig({
                            quantity: 1,
                            color: product.colors?.[0] || '',
                            size: product.sizes?.[0] || ''
                          });
                          // We need to know if it's "add to cart" or "buy now" in the sheet
                          // Let's assume the sheet handles both or we pass a mode.
                          // For simplicity, let's just use the same sheet and add "Add to Cart" button there?
                          // Or just add directly if no options?
                          // The user wants options. So we use the same sheet.
                        }}
                        className="px-3 bg-white/10 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-white/20"
                      >
                        <ShoppingCart size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Product Purchase Sheet (Color/Size Selection) */}
        {selectedProductForPurchase && (
          <div className="absolute inset-0 z-50 bg-black/95 flex flex-col animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">Select Options</h2>
              <button onClick={() => setSelectedProductForPurchase(null)} className="p-2 hover:bg-white/10 rounded-full">
                <X size={24} className="text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex gap-4 mb-6">
                <img src={selectedProductForPurchase.image} className="w-24 h-24 rounded-lg object-cover bg-gray-800" alt="Product" />
                <div>
                  <h3 className="text-base font-bold text-white line-clamp-2">{selectedProductForPurchase.name}</h3>
                  <p className="text-xl font-bold text-yellow-400 mt-1">฿{selectedProductForPurchase.price.toLocaleString()}</p>
                </div>
              </div>

              {/* Color Selection */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Color</h4>
                <div className="flex flex-wrap gap-3">
                  {selectedProductForPurchase.colors?.map((color) => (
                    <button
                      key={color}
                      onClick={() => setPurchaseConfig({ ...purchaseConfig, color })}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${purchaseConfig.color === color
                        ? 'ring-2 ring-white scale-110'
                        : 'hover:scale-105'
                        }`}
                      style={{ backgroundColor: color.toLowerCase() }}
                      title={color}
                    >
                      {purchaseConfig.color === color && <Check size={16} className="text-white drop-shadow-md" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Size</h4>
                <div className="flex flex-wrap gap-3">
                  {selectedProductForPurchase.sizes?.map((size) => (
                    <button
                      key={size}
                      onClick={() => setPurchaseConfig({ ...purchaseConfig, size })}
                      className={`min-w-[48px] h-10 px-3 rounded-lg text-sm font-bold border transition-all ${purchaseConfig.size === size
                        ? 'bg-white text-black border-white'
                        : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500'
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Quantity</h4>
                <div className="flex items-center gap-4 bg-gray-800 rounded-lg w-max p-1">
                  <button
                    onClick={() => setPurchaseConfig({ ...purchaseConfig, quantity: Math.max(1, purchaseConfig.quantity - 1) })}
                    className="w-8 h-8 flex items-center justify-center text-white hover:bg-gray-700 rounded"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="text-white font-bold w-8 text-center">{purchaseConfig.quantity}</span>
                  <button
                    onClick={() => setPurchaseConfig({ ...purchaseConfig, quantity: purchaseConfig.quantity + 1 })}
                    className="w-8 h-8 flex items-center justify-center text-white hover:bg-gray-700 rounded"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-800 space-y-3 bg-black">
              <button
                onClick={() => handleConfirmPurchase('buy_now')}
                className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 active:scale-95 transition-all"
              >
                Buy Now
              </button>
              <button
                onClick={() => handleConfirmPurchase('add_to_cart')}
                className="w-full bg-gray-800 text-white font-bold py-3 rounded-xl hover:bg-gray-700 active:scale-95 transition-all"
              >
                Add to Cart
              </button>
            </div>
          </div>
        )}

        {/* Cart Modal */}
        {showCart && (
          <div className="absolute inset-0 z-50 bg-black/95 flex flex-col animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">Your Cart ({cart.length})</h2>
              <button onClick={() => setShowCart(false)} className="p-2 hover:bg-white/10 rounded-full">
                <X size={24} className="text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <ShoppingCart size={48} className="mb-4 opacity-50" />
                  <p>Your cart is empty</p>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div key={index} className="flex gap-3 bg-gray-800/50 p-3 rounded-xl border border-white/5">
                    <img src={item.image} className="w-20 h-20 rounded-lg object-cover bg-gray-700" alt={item.name} />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-bold text-white line-clamp-1">{item.name}</h3>
                        <button onClick={() => handleRemoveCartItem(index)} className="text-gray-500 hover:text-red-500">
                          <X size={16} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {item.color} / {item.size}
                      </p>
                      <div className="flex justify-between items-end mt-2">
                        <p className="text-lg font-bold text-yellow-400">฿{(item.price * item.quantity).toLocaleString()}</p>
                        <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-0.5">
                          <button
                            onClick={() => handleUpdateCartQuantity(index, -1)}
                            className="w-6 h-6 flex items-center justify-center text-white hover:bg-gray-600 rounded"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-xs font-bold w-4 text-center text-white">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateCartQuantity(index, 1)}
                            className="w-6 h-6 flex items-center justify-center text-white hover:bg-gray-600 rounded"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-800 bg-black">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-400">Total</span>
                  <span className="text-xl font-bold text-white">
                    ฿{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={handleCheckoutCart}
                  className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  Checkout <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Checkout Modal */}
        {showCheckoutModal && (
          <div className="absolute inset-0 z-[60] bg-black flex flex-col animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <button onClick={() => setShowCheckoutModal(false)} className="p-1 hover:bg-white/10 rounded-full">
                  <ArrowLeft size={24} className="text-white" />
                </button>
                <h2 className="text-lg font-bold text-white">Checkout</h2>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Address Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <MapPin size={14} /> Shipping Address
                  </h3>
                  <button
                    onClick={() => {
                      setTempAddress(userAddress || '');
                      setIsEditingAddress(true);
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 font-bold"
                  >
                    {userAddress ? 'CHANGE' : 'ADD'}
                  </button>
                </div>

                {isEditingAddress ? (
                  <div className="bg-gray-800 p-3 rounded-xl space-y-3">
                    <textarea
                      value={tempAddress}
                      onChange={(e) => setTempAddress(e.target.value)}
                      placeholder="Enter full name, phone, and address..."
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-blue-500 focus:outline-none min-h-[100px]"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setIsEditingAddress(false)}
                        className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-white"
                      >
                        CANCEL
                      </button>
                      <button
                        onClick={handleSaveAddress}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700"
                      >
                        SAVE ADDRESS
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-800/50 border border-white/10 p-4 rounded-xl">
                    {userAddress ? (
                      <p className="text-sm text-gray-200 whitespace-pre-line">{userAddress}</p>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No address set. Please add one.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <ShoppingBag size={14} /> Order Summary
                </h3>
                <div className="bg-gray-800/50 border border-white/10 rounded-xl overflow-hidden">
                  {cart.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-400">
                          {item.quantity}x
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white line-clamp-1">{item.name}</p>
                          <p className="text-[10px] text-gray-400">{item.color}, {item.size}</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-white">฿{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                  <div className="p-3 bg-white/5 flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-300">Total Amount</span>
                    <span className="text-lg font-bold text-yellow-400">
                      ฿{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <CreditCard size={14} /> Payment Method
                </h3>
                <div className="bg-gray-800/50 border border-white/10 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <Wallet className="text-yellow-500" size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Wallet Balance</p>
                      <p className="text-xs text-gray-400">Available: ฿{walletBalance.toLocaleString()}</p>
                    </div>
                  </div>
                  {walletBalance < cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) && (
                    <button onClick={onOpenWallet} className="text-xs bg-yellow-600 text-white px-2 py-1 rounded font-bold">
                      TOP UP
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-800 bg-black safe-bottom">
              <button
                onClick={handleFinalPayment}
                disabled={!userAddress || walletBalance < cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
                className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check size={18} /> Confirm Payment
              </button>
            </div>
          </div>
        )}

        {/* Gift Selector */}
        {showGiftSelector && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/95 border-t border-gray-800 p-4 z-40 animate-slide-up pb-safe-bottom">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold">Send Gift</h3>
              <button onClick={() => setShowGiftSelector(false)}>
                <X className="text-gray-400" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {GIFTS.map((gift) => (
                <button
                  key={gift.id}
                  onClick={() => handleSendGift(gift)}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <span className="text-2xl filter drop-shadow-lg">{gift.icon}</span>
                  <span className="text-xs text-gray-300 font-medium">{gift.name}</span>
                  <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full">
                    <DollarSign size={8} className="text-yellow-400" />
                    <span className="text-[10px] text-yellow-400 font-bold">{gift.price}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-between items-center border-t border-white/10 pt-3">
              <div className="flex items-center gap-2">
                <Wallet size={16} className="text-yellow-500" />
                <span className="text-sm font-bold text-yellow-500">{walletBalance.toLocaleString()}</span>
              </div>
              <button
                onClick={onOpenWallet}
                className="text-xs bg-yellow-600 text-white px-3 py-1.5 rounded-full font-bold hover:bg-yellow-700"
              >
                Top Up
              </button>
            </div>
          </div>
        )}

        {/* Wallet Modal (If needed locally) */}
        {showWalletModal && (
          <div className="absolute inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm text-center">
              <Wallet size={48} className="text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Top Up Wallet</h2>
              <p className="text-gray-400 text-sm mb-6">Add coins to send gifts and make purchases.</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[100, 300, 500, 1000].map(amount => (
                  <button
                    key={amount}
                    onClick={() => {
                      // Mock top up
                      setWalletBalance(prev => prev + amount);
                      setShowWalletModal(false);
                      alert(`Top up successful! +${amount} coins`);
                    }}
                    className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-3 text-white font-bold transition-colors"
                  >
                    +{amount} Coins
                    <div className="text-xs text-gray-500 font-normal mt-1">฿{amount}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowWalletModal(false)}
                className="text-gray-400 hover:text-white text-sm font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default LiveRoom;
