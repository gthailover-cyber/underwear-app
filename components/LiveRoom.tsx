
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Heart, Share2, MessageCircle, Gift, ShoppingBag, X,
    Send, DollarSign, User, ChevronRight, Eye, MoreHorizontal,
    Flame, Sparkles, Trophy, Minus, Plus, CreditCard, ShoppingCart,
    Wallet, Settings, Mic, MicOff, Video, VideoOff, LogOut, Check, MapPin, ArrowLeft, Clock
} from 'lucide-react';
import { Streamer, Comment, Product } from '../types';
import { TRANSLATIONS } from '../constants';
import { GIFTS } from '../constants';
import { socketService } from '../services/socket';
import { supabase } from '../lib/supabaseClient';
import { liveKitService } from '../services/livekit';
import LiveKitVideo from './LiveKitVideo';
import UserBadge from './UserBadge';

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
    onFollow?: (id: string) => void;
    followingIds?: string[];
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
    currentUser,
    onFollow,
    followingIds = []
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
    const [heartCount, setHeartCount] = useState(streamer.likes || 0);
    const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
    const [viewerCount, setViewerCount] = useState(streamer.viewerCount);
    const [showGiftSelector, setShowGiftSelector] = useState(false);
    const [giftAnimation, setGiftAnimation] = useState<{ id: number, icon: React.ReactNode, name: string, sender: string, color: string } | null>(null);

    // Auction State
    const [currentHighestBid, setCurrentHighestBid] = useState(streamer.currentBid || streamer.auctionStartingPrice || 0);
    const [highestBidderName, setHighestBidderName] = useState(streamer.topBidder || '');
    const [myBidAmount, setMyBidAmount] = useState((streamer.currentBid || streamer.auctionStartingPrice || 0) + 1);
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
    // Heartbeat Logic: Update last_active_at every minute to keep room "alive"
    useEffect(() => {
        if (!isHost) return;

        const interval = setInterval(async () => {
            console.log('[Heartbeat] Updating room activity...');
            await supabase
                .from('rooms')
                .update({ last_active_at: new Date().toISOString() })
                .eq('id', streamer.id);
        }, 60000); // 1 minute

        return () => clearInterval(interval);
    }, [isHost, streamer.id]);

    useEffect(() => {
        console.log(`[Socket] Connecting to room: ${streamer.id} as ${isHost ? 'Host' : 'Viewer'}`);

        if (currentUser) {
            socketService.updateUser(currentUser);
        }

        // Ensure we join the room properly
        socketService.joinRoom(streamer.id, streamer.hostId);

        const cleanup = socketService.onComment((comment) => {
            console.log('[Socket] New comment received:', comment);
            setComments(prev => [...prev, comment]);
        });

        const cleanupHearts = socketService.on('new_heart', () => {
            console.log('[Socket] New heart received');
            addFloatingHeart();
        });

        const cleanupGifts = socketService.on('new_gift', (data: any) => {
            const gift = GIFTS.find(g => g.id === data.giftId);
            if (gift) {
                // Only animate if it's NOT from me (since I already animated it locally on click)
                if (data.senderId !== currentUser?.id) {
                    triggerGiftAnimation(gift, data.sender);

                    // Add to Chat Stream
                    const giftComment: any = {
                        id: Date.now().toString() + Math.random(),
                        username: data.sender || 'User',
                        message: `a ${gift.name}!`,
                        timestamp: new Date().toLocaleTimeString(),
                        isGift: true, // Custom flag for styling
                        isSystem: false
                    };
                    setComments(prev => [...prev, giftComment]);

                    // Log for host
                    if (isHost) {
                        const newLog: GiftLogItem = {
                            id: Date.now().toString() + Math.random(),
                            sender: data.sender,
                            avatar: data.avatar || `https://picsum.photos/50/50?random=${Math.floor(Math.random() * 1000)}`,
                            giftName: gift.name,
                            giftIcon: gift.icon,
                            price: gift.price,
                            timestamp: new Date()
                        };
                        setGiftLogs(prev => [newLog, ...prev].slice(0, 50));
                    }
                }
            }
        });

        const cleanupBids = socketService.onBidUpdate((data) => {
            setCurrentHighestBid(data.amount);
            setHighestBidderName(data.user);
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

        // Realtime listener for room updates (specifically likes)
        const roomChannel = supabase
            .channel(`room_sync_${streamer.id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'rooms',
                filter: `id=eq.${streamer.id}`
            }, (payload) => {
                if (typeof payload.new.likes === 'number') {
                    setHeartCount(prev => Math.max(prev, payload.new.likes));
                }
                if (typeof payload.new.current_bid === 'number') {
                    setCurrentHighestBid(prev => Math.max(prev, payload.new.current_bid));
                }
                if (payload.new.top_bidder_name !== undefined) {
                    setHighestBidderName(payload.new.top_bidder_name);
                }
            })
            .subscribe();

        return () => {
            cleanup();
            cleanupHearts();
            cleanupGifts();
            cleanupBids();
            cleanupViewers();
            supabase.removeChannel(roomChannel);
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
        if (Math.random() > 0.7) {
            socketService.emit('send_heart', {});
            console.log('[Comment-Like] Simulating like for room:', streamer.id);
            supabase.rpc('increment_likes', { room_id: streamer.id }).then(({ error }) => {
                if (error) console.error('[Comment-Like] Error:', error);
                else console.log('[Comment-Like] Success');
            });
        }
    };

    const handleLike = async () => {
        socketService.emit('send_heart', {});
        // Persist to DB
        console.log('[Like] Incrementing likes for room:', streamer.id);
        const { error } = await supabase.rpc('increment_likes', { room_id: streamer.id });
        if (error) {
            console.error('[Like] Error incrementing likes:', error);
        } else {
            console.log('[Like] Success incrementing likes');
        }
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
        if (walletBalance < gift.price) {
            onOpenWallet();
            return;
        }

        // Deduct balance
        onUseCoinsLocal(gift.price);
        setShowGiftSelector(false);

        // Record in Database
        if (currentUser?.id && streamer.hostId) {
            supabase
                .from('received_gifts')
                .insert({
                    sender_id: currentUser.id,
                    receiver_id: streamer.hostId,
                    gift_id: gift.id,
                    gift_name: gift.name,
                    gift_icon: gift.icon,
                    price: gift.price
                })
                .then(({ error }) => {
                    if (error) {
                        console.error('[Gift] Save Error:', error);
                    } else {
                        console.log('[Gift] Recorded successfully in database');
                    }
                });
        } else {
            console.error('[Gift] Missing sender or receiver ID', { sender: currentUser?.id, receiver: streamer.hostId });
        }

        // Trigger Animation locally
        triggerGiftAnimation(gift, 'Me');

        // Emit to server
        socketService.emit('send_gift', { giftId: gift.id });

        // Add to Chat Locally
        const giftComment: any = {
            id: Date.now().toString(),
            username: 'Me',
            message: `a ${gift.name}!`,
            timestamp: new Date().toLocaleTimeString(),
            isGift: true,
            isSystem: false // technically not system, user action
        };
        setComments(prev => [...prev, giftComment]);

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

    const [isMicOn, setIsMicOn] = useState(true);

    const handleToggleMic = async () => {
        const newState = !isMicOn;
        setIsMicOn(newState);
        try {
            await liveKitService.enableMicrophone(newState);
        } catch (err) {
            console.error("Error toggling mic:", err);
            setIsMicOn(!newState); // Revert on error
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black text-white flex justify-center h-[100dvh] w-full overflow-hidden">

            {/* --- VIDEO AREA (Centered, Mobile Width on Desktop) --- */}
            <div className="relative w-full max-w-lg h-full bg-gray-900 border-x border-gray-800 overflow-hidden flex items-center justify-center">

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
                            <div className="relative">
                                <img src={streamer.avatar || streamer.coverImage} className="w-9 h-9 rounded-full border border-white object-cover" alt="Host" />
                                <UserBadge
                                    role={streamer.role}
                                    size="xs"
                                    className="absolute -top-1 -right-1"
                                />
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-white max-w-[100px] truncate">{streamer.name}</h3>
                                <p className="text-[10px] text-gray-300 flex items-center gap-1">
                                    <User size={8} /> {(viewerCount || 0).toLocaleString()}
                                </p>
                            </div>
                            {!isHost && (
                                <button
                                    onClick={() => onFollow?.(streamer.hostId)}
                                    className={`ml-2 text-xs font-bold px-3 py-1 rounded-full transition-all shadow-lg active:scale-95 ${followingIds.includes(streamer.hostId)
                                        ? 'bg-gray-800 text-white border border-white/10'
                                        : 'bg-red-600 hover:bg-red-700 text-white shadow-red-900/40'
                                        }`}
                                >
                                    {followingIds.includes(streamer.hostId) ? t.followed : t.follow}
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

                    {/* Host Stats (For Everyone now) */}
                    <div className="mt-4 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 min-w-max">
                            <Heart size={14} className="text-pink-500 fill-pink-500" />
                            <span className="text-xs font-bold">{(heartCount || 0).toLocaleString()} Likes</span>
                        </div>
                    </div>
                </div>

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


                <div className="absolute bottom-0 left-0 right-0 p-4 pb-safe-bottom z-30 bg-gradient-to-t from-black/90 via-black/40 to-transparent">

                    {/* Integrated Auction Bar (Floating above chat) */}
                    {streamer.isAuction && (
                        <div className="mb-4 animate-slide-up">
                            <div className="bg-white/10 backdrop-blur-2xl rounded-2xl p-3 border border-orange-500/30 shadow-xl flex items-center gap-4">
                                {/* Small Product Preview */}
                                <div className="relative hidden xs:block">
                                    <img src={streamer.products[0]?.image} className="w-12 h-12 rounded-lg object-cover bg-gray-800 border border-white/10" alt="Auction Item" />
                                    <div className="absolute -top-1 -right-1 bg-orange-600 rounded-full p-1 shadow-lg">
                                        <Flame size={10} className="text-white fill-white" />
                                    </div>
                                </div>

                                {/* Bid Info Section */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest whitespace-nowrap">Highest Bid</span>
                                        {highestBidderName && (
                                            <span className="text-[10px] text-blue-400 font-bold truncate">by {highestBidderName}</span>
                                        )}
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-black text-white font-athletic">฿{(currentHighestBid || 0).toLocaleString()}</span>
                                        {auctionTimeLeft && (
                                            <div className="flex items-center gap-1 text-gray-400">
                                                <Clock size={12} />
                                                <span className="text-[11px] font-bold font-athletic uppercase">{auctionTimeLeft}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Bid Actions (Viewer Only) */}
                                {!isHost && (
                                    <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-2 mr-2">
                                            <button onClick={decreaseBid} className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center active:scale-90 transition-all">
                                                <Minus size={14} className="text-white" />
                                            </button>
                                            <span className="text-sm font-bold text-yellow-500 min-w-[50px] text-center font-athletic">฿{myBidAmount.toLocaleString()}</span>
                                            <button onClick={increaseBid} className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center active:scale-90 transition-all">
                                                <Plus size={14} className="text-white" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={placeBid}
                                            disabled={isInsufficientFunds || myBidAmount <= currentHighestBid}
                                            className={`px-4 py-2 rounded-lg font-black text-[11px] uppercase tracking-wider transition-all shadow-lg ${isInsufficientFunds
                                                ? 'bg-gray-700 text-gray-400'
                                                : myBidAmount <= currentHighestBid
                                                    ? 'bg-gray-800 text-gray-500 opacity-50'
                                                    : 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:brightness-110 active:scale-95'
                                                }`}
                                        >
                                            {isInsufficientFunds ? 'No Money' : 'Bid Now'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {/* Chat Messages Area */}
                    <div className="w-full md:w-3/4 max-h-48 md:max-h-60 overflow-y-auto mask-image-linear-gradient flex flex-col justify-end space-y-2 mb-4 pr-10 no-scrollbar">
                        {/* System Welcome Message */}
                        <div className="bg-red-500/80 self-start text-white text-xs px-3 py-1.5 rounded-xl rounded-tl-none font-medium shadow-sm backdrop-blur-sm max-w-[85%] border border-red-400/30">
                            📢 Welcome to {streamer.name}'s room! Please follow the community guidelines.
                        </div>

                        {comments.map((comment: any) => (
                            <div key={comment.id} className={`flex flex-col items-start max-w-[85%] animate-slide-up ${comment.isSystem ? 'w-full' : ''}`}>
                                {comment.isSystem ? (
                                    <div className="bg-white/20 backdrop-blur-md self-center text-white text-xs px-3 py-1 rounded-full font-medium my-1">
                                        {comment.username} {comment.message}
                                    </div>
                                ) : comment.isGift ? (
                                    <div className="bg-gradient-to-r from-yellow-600/80 to-pink-600/80 backdrop-blur-md border border-yellow-400/30 self-start text-white text-xs px-3 py-1.5 rounded-2xl rounded-bl-none font-bold my-1 shadow-lg shadow-yellow-900/20 flex items-center gap-2">
                                        <Gift size={12} className="text-yellow-200" />
                                        <span>
                                            <span className="text-yellow-200">{comment.username}</span> sent {comment.message}
                                        </span>
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
                            <div className="w-1/2 bg-black/40 backdrop-blur-md border border-white/20 rounded-full flex items-center px-2 py-1 focus-within:border-white/50 focus-within:bg-black/60 transition-all">
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
                        // Host Controls (Professional UX)
                        <div className="flex items-center w-full">
                            {/* Product Button (10%) */}
                            <div className="w-[10%] flex justify-center">
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
                            </div>

                            {/* Chat Input for Host (80%) */}
                            <div className="w-[80%] bg-black/40 backdrop-blur-md border border-white/20 rounded-full flex items-center px-2 py-1 mx-1 focus-within:border-white/50 focus-within:bg-black/60 transition-all">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Type to chat..."
                                    className="flex-1 bg-transparent border-none text-white text-sm px-3 focus:outline-none placeholder-gray-400 h-10 w-full"
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

                            {/* Mic Toggle Button (10%) */}
                            <div className="w-[10%] flex justify-center">
                                <button
                                    onClick={handleToggleMic}
                                    className={`w-10 h-10 flex items-center justify-center backdrop-blur-md rounded-full border text-white active:scale-90 transition-all shadow-lg ${isMicOn
                                        ? 'bg-gray-600/80 border-gray-500/50 hover:bg-gray-500'
                                        : 'bg-red-600/80 border-red-500/50 hover:bg-red-500 shadow-red-900/40'
                                        }`}
                                >
                                    {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- OVERLAYS --- */}

                {/* Product List */}
                {
                    showProducts && (
                        <div className="absolute inset-0 z-40 bg-black/90 flex flex-col animate-slide-up">
                            <div className="flex items-center justify-between p-4 border-b border-gray-800">
                                <h2 className="text-lg font-bold text-white">Products ({streamer.products.length})</h2>
                                <div className="flex items-center gap-4">
                                    {!isHost && (
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
                                    )}
                                    <button onClick={() => setShowProducts(false)}><X className="text-white" /></button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {streamer.products.map(p => (
                                    <div key={p.id} className="flex gap-4 bg-gray-900 p-3 rounded-xl border border-gray-800">
                                        <img src={p.image} className="w-20 h-20 rounded-lg object-cover bg-gray-800" />
                                        <div className="flex-1 text-left">
                                            <h3 className="font-bold text-white">{p.name}</h3>
                                            <p className="text-red-500 font-bold">฿{p.price.toLocaleString()}</p>
                                            {isHost ? (
                                                <div className="mt-2 flex items-center gap-3 text-xs font-bold text-gray-400">
                                                    <span className="flex items-center gap-1"><span className="text-white">{p.sold || 0}</span> Sold</span>
                                                    <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                                    <span className="flex items-center gap-1"><span className="text-white">{p.stock}</span> Left</span>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleBuyNow(p)}
                                                    className="mt-2 bg-white text-black text-xs font-bold px-4 py-2 rounded-full hover:bg-gray-200"
                                                >
                                                    Buy Now
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }

                {/* Cart Overlay */}
                {
                    showCart && (
                        <div className="absolute inset-0 z-40 bg-black/90 flex flex-col animate-slide-up">
                            <div className="flex items-center justify-between p-4 border-b border-gray-800">
                                <h2 className="text-lg font-bold text-white">My Cart ({cart.length})</h2>
                                <button onClick={() => setShowCart(false)}><X className="text-white" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-white">
                                {cart.length === 0 && <p className="text-center text-gray-400 mt-10">Your cart is empty.</p>}
                                {cart.map((item, index) => (
                                    <div key={index} className="flex gap-4 bg-gray-900 p-3 rounded-xl border border-gray-800">
                                        <img src={item.image} className="w-16 h-16 rounded-lg object-cover" />
                                        <div className="flex-1">
                                            <h3 className="font-bold text-sm">{item.name}</h3>
                                            <div className="flex justify-between items-center mt-2">
                                                <div className="flex items-center gap-2 bg-black rounded-lg px-2 py-1">
                                                    <button onClick={() => handleUpdateCartQuantity(index, -1)}><Minus size={12} /></button>
                                                    <span className="text-xs">{item.quantity}</span>
                                                    <button onClick={() => handleUpdateCartQuantity(index, 1)}><Plus size={12} /></button>
                                                </div>
                                                <p className="text-red-500 font-bold text-sm">฿{(item.price * item.quantity).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemoveCartItem(index)} className="text-gray-500"><X size={16} /></button>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 border-t border-gray-800 bg-black/50">
                                <div className="flex justify-between text-white font-bold mb-3">
                                    <span>Total</span>
                                    <span className="text-red-500">฿{cart.reduce((a, c) => a + c.price * c.quantity, 0).toLocaleString()}</span>
                                </div>
                                <button onClick={handleCheckoutCart} className="w-full bg-red-600 py-3 rounded-full font-bold text-white">Checkout</button>
                            </div>
                        </div>
                    )
                }

                {/* Checkout Modal */}
                {
                    showCheckoutModal && (
                        <div className="absolute inset-0 z-50 bg-black flex flex-col">
                            <div className="p-4 border-b border-gray-800 flex items-center gap-2 text-white">
                                <button onClick={() => setShowCheckoutModal(false)}><X /></button>
                                <h2 className="font-bold">Checkout</h2>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 text-white">
                                <div className="bg-gray-900 p-4 rounded-xl mb-4 border border-gray-800">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-gray-400 text-xs uppercase">Shipping Address</h3>
                                        <button onClick={() => setIsEditingAddress(true)} className="text-blue-400 text-xs text-blue-500">Edit</button>
                                    </div>
                                    {isEditingAddress ? (
                                        <div>
                                            <textarea
                                                className="w-full bg-black border border-gray-700 rounded p-2 text-sm text-white"
                                                value={tempAddress}
                                                onChange={e => setTempAddress(e.target.value)}
                                                placeholder="Enter full address..."
                                            />
                                            <button onClick={handleSaveAddress} className="mt-2 bg-white text-black text-xs px-3 py-1 rounded font-bold">Save</button>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-300 whitespace-pre-line">{userAddress || "No address set. Please edit."}</p>
                                    )}
                                </div>

                                <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                                    <h3 className="font-bold text-gray-400 text-xs uppercase mb-3">Order Summary</h3>
                                    {cart.map(item => (
                                        <div key={item.id} className="flex justify-between mb-2 text-sm text-gray-300">
                                            <span>{item.name} x{item.quantity}</span>
                                            <span>฿{(item.price * item.quantity).toLocaleString()}</span>
                                        </div>
                                    ))}
                                    <div className="border-t border-gray-800 mt-2 pt-2 flex justify-between font-bold text-white">
                                        <span>Total</span>
                                        <span className="text-green-500">฿{cart.reduce((a, c) => a + c.price * c.quantity, 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border-t border-gray-800 bg-black/50">
                                <button
                                    onClick={handleFinalPayment}
                                    className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-full font-bold transition-colors"
                                    disabled={cart.length === 0}
                                >
                                    Pay Now (฿{cart.reduce((a, c) => a + c.price * c.quantity, 0).toLocaleString()})
                                </button>
                            </div>
                        </div>
                    )
                }

                {/* Gift Selector */}
                {
                    showGiftSelector && (
                        <div className="absolute bottom-0 left-0 right-0 z-50 bg-gray-900 rounded-t-3xl p-4 animate-slide-up border-t border-gray-800">
                            <div className="flex justify-between items-center mb-4 text-white">
                                <h3 className="font-bold">Send a Gift</h3>
                                <button onClick={() => setShowGiftSelector(false)}><X size={20} /></button>
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                {GIFTS.map(gift => (
                                    <button key={gift.id} onClick={() => handleSendGift(gift)} className="flex flex-col items-center gap-1 p-2 hover:bg-white/10 rounded-xl transition-colors">
                                        <span className="text-2xl">{gift.icon}</span>
                                        <span className="text-xs font-medium text-white">{gift.name}</span>
                                        <span className="text-[10px] text-yellow-400 flex items-center gap-0.5">
                                            <DollarSign size={8} /> {gift.price}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <div className="mt-4 flex justify-between items-center bg-black/40 p-2 rounded-full px-4">
                                <div className="flex items-center gap-1 text-yellow-400 font-bold text-sm">
                                    <Wallet size={14} /> <span>{walletBalance.toLocaleString()}</span>
                                </div>
                                <button onClick={() => onOpenWallet()} className="text-xs bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full border border-yellow-500/30">Top Up</button>
                            </div>
                        </div>
                    )
                }

                {/* Bid Modal */}
                {
                    showBidModal && (
                        <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
                            <div className="bg-gray-900 w-full max-w-sm rounded-2xl p-6 border border-gray-800 text-white animate-scale-in">
                                <h2 className="text-xl font-bold mb-4 text-center">Place a Bid</h2>
                                <div className="text-center mb-6">
                                    <p className="text-gray-400 text-sm">Current Highest Bid</p>
                                    <p className="text-3xl font-bold text-green-500">฿{currentHighestBid.toLocaleString()}</p>
                                    {highestBidderName && (
                                        <p className="text-xs text-blue-400 mt-1">
                                            by <span className="font-bold">{highestBidderName}</span>
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-4 mb-6">
                                    <button onClick={decreaseBid} className="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"><Minus /></button>
                                    <div className="flex-1 text-center">
                                        <p className="text-xs text-gray-400">Your Bid</p>
                                        <p className="text-2xl font-bold">฿{myBidAmount.toLocaleString()}</p>
                                    </div>
                                    <button onClick={increaseBid} className="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"><Plus /></button>
                                </div>

                                <button
                                    onClick={() => { placeBid(); setShowBidModal(false); }}
                                    className="w-full bg-orange-600 hover:bg-orange-500 text-white py-3 rounded-xl font-bold transition-colors shadow-lg shadow-orange-900/40"
                                    disabled={isInsufficientFunds}
                                >
                                    {isInsufficientFunds ? 'Insufficient Funds' : 'Confirm Bid'}
                                </button>
                                <button onClick={() => setShowBidModal(false)} className="w-full mt-3 py-2 text-gray-400 text-sm hover:text-white">Cancel</button>
                            </div>
                        </div>
                    )
                }

                {/* Product Purchase Sheet (Buy Now) */}
                {selectedProductForPurchase && (
                    <div className="absolute inset-x-0 bottom-0 z-50 bg-gray-900 rounded-t-3xl p-6 shadow-2xl shadow-black border-t border-gray-800 animate-slide-up">
                        <div className="flex gap-4">
                            <img src={selectedProductForPurchase.image} className="w-24 h-24 rounded-xl object-cover bg-gray-800" />
                            <div className="text-white">
                                <h3 className="font-bold text-lg">{selectedProductForPurchase.name}</h3>
                                <p className="text-xl font-bold text-red-500">฿{selectedProductForPurchase.price.toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Configuration */}
                        <div className="mt-4 space-y-4 text-white">
                            {/* Color Selection */}
                            {selectedProductForPurchase.colors && selectedProductForPurchase.colors.length > 0 && (
                                <div>
                                    <span className="text-sm text-gray-400 mb-2 block">Color</span>
                                    <div className="flex gap-3 flex-wrap">
                                        {selectedProductForPurchase.colors.map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setPurchaseConfig(p => ({ ...p, color }))}
                                                className={`w-8 h-8 rounded-full border-2 transition-all shadow-sm ${purchaseConfig.color === color
                                                    ? 'border-white scale-110 ring-2 ring-white/30'
                                                    : 'border-transparent hover:scale-105'
                                                    }`}
                                                style={{ backgroundColor: color }}
                                                title={color}
                                            >
                                                {purchaseConfig.color === color && (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Check size={14} className="text-white drop-shadow-md filter invert grayscale contrast-200" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Size Selection */}
                            {selectedProductForPurchase.sizes && selectedProductForPurchase.sizes.length > 0 && (
                                <div>
                                    <span className="text-sm text-gray-400 mb-2 block">Size</span>
                                    <div className="flex gap-2 flex-wrap">
                                        {selectedProductForPurchase.sizes.map(size => (
                                            <button
                                                key={size}
                                                onClick={() => setPurchaseConfig(p => ({ ...p, size }))}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${purchaseConfig.size === size
                                                    ? 'bg-white text-black border-white'
                                                    : 'bg-black text-gray-400 border-gray-700 hover:border-gray-500'
                                                    }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <span>Quantity</span>
                                <div className="flex items-center gap-3 bg-black rounded-lg p-1 border border-gray-700">
                                    <button onClick={() => setPurchaseConfig(p => ({ ...p, quantity: Math.max(1, p.quantity - 1) }))} className="px-3 hover:bg-gray-800 rounded"><Minus size={14} /></button>
                                    <span className="font-bold w-4 text-center">{purchaseConfig.quantity}</span>
                                    <button onClick={() => setPurchaseConfig(p => ({ ...p, quantity: p.quantity + 1 }))} className="px-3 hover:bg-gray-800 rounded"><Plus size={14} /></button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button onClick={() => handleConfirmPurchase('add_to_cart')} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-bold transition-colors">Add to Cart</button>
                            <button onClick={() => handleConfirmPurchase('buy_now')} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold transition-colors">Buy Now</button>
                        </div>
                        <button onClick={() => setSelectedProductForPurchase(null)} className="absolute top-4 right-4 text-white hover:text-gray-300"><X /></button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveRoom;
