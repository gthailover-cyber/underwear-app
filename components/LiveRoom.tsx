
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
import { useAlert } from '../context/AlertContext';
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
    const { showAlert } = useAlert();

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
    const [userPhone, setUserPhone] = useState<string | null>(null);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [tempAddress, setTempAddress] = useState('');
    const [tempPhone, setTempPhone] = useState('');

    // Real-time Products State (for live sold/stock updates)
    const [liveProducts, setLiveProducts] = useState<Product[]>(streamer.products || []);

    // Host Controls
    const [giftLogs, setGiftLogs] = useState<GiftLogItem[]>([]);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [videoError, setVideoError] = useState(false); // To handle video load failures
    const [isAuctionOver, setIsAuctionOver] = useState(false);
    const [hasSentWinnerOrder, setHasSentWinnerOrder] = useState(false);
    const [liveVariants, setLiveVariants] = useState<any[]>([]);



    const commentsEndRef = useRef<HTMLDivElement>(null);
    const heartIdCounter = useRef(0);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const notifiedAuctionEndRef = useRef<number | null>(null);
    const processedGiftsRef = useRef<Set<string>>(new Set());

    // Auto-scroll comments
    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [comments]);

    // Fetch Message History & User Address on Mount
    useEffect(() => {
        const fetchInitialData = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            // 1. Fetch Chat History
            const { data: history } = await supabase
                .from('messages')
                .select('*')
                .eq('room_id', streamer.id)
                .order('created_at', { ascending: true })
                .limit(50);

            if (history) {
                const formattedHistory = history.map((m: any) => {
                    let displayMessage = m.content;
                    let isGift = m.type === 'gift';

                    if (isGift) {
                        try {
                            const meta = JSON.parse(m.content);
                            const gift = GIFTS.find(g => g.id == meta.giftId);
                            displayMessage = `sent a ${gift?.name || 'gift'}!`;
                        } catch (e) {
                            displayMessage = 'sent a gift!';
                        }
                    }

                    return {
                        id: m.id,
                        username: m.username || 'User',
                        message: displayMessage,
                        isSystem: m.type === 'system',
                        isGift: isGift,
                        avatar: m.avatar || 'https://picsum.photos/200/200',
                        timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        isHost: m.sender_id === streamer.hostId
                    };
                });
                setComments(formattedHistory);
            }

            // 2. Fetch Address
            if (user) {
                const { data } = await supabase
                    .from('addresses')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('is_default', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (data) {
                    const formatted = `${data.name}\n${data.address} ${data.province} ${data.postal_code}`;
                    setUserAddress(formatted);
                    setUserPhone(data.phone || '');
                    setSelectedAddressId(data.id);
                    setTempAddress(data.address || ''); // Sync temp address initially
                    setTempPhone(data.phone || '');
                }
            }

            // 3. Fetch Product Variants for the current products
            if (streamer.products && streamer.products.length > 0) {
                const productIds = streamer.products.map(p => p.id);
                const { data: variantsData } = await supabase
                    .from('product_variants')
                    .select('*')
                    .in('product_id', productIds);

                if (variantsData) {
                    setLiveVariants(variantsData);
                }
            }
        };

        fetchInitialData();
    }, [streamer.id]);

    // Update local products if streamer.products changes (initial sync)
    useEffect(() => {
        if (streamer.products) {
            setLiveProducts(streamer.products);
        }
    }, [streamer.products]);

    // Real-time Product Updates (Stock & Sold)
    useEffect(() => {
        if (!streamer.hostId) return;

        console.log('[LiveRoom] Subscribing to real-time product updates for host:', streamer.hostId);

        const channel = supabase
            .channel(`public:products:seller:${streamer.hostId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'products',
                    filter: `seller_id=eq.${streamer.hostId}`
                },
                (payload) => {
                    const updatedProduct = payload.new as Product;
                    console.log('[LiveRoom] Product update received:', updatedProduct.id, 'Stock:', updatedProduct.stock, 'Sold:', updatedProduct.sold);

                    setLiveProducts(prev => prev.map(p =>
                        p.id === updatedProduct.id
                            ? { ...p, stock: updatedProduct.stock, sold: updatedProduct.sold }
                            : p
                    ));
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'product_variants'
                },
                async () => {
                    // Re-fetch all variants for simplicity when any variant changes for this streamer's products
                    if (streamer.products && streamer.products.length > 0) {
                        const productIds = streamer.products.map(p => p.id);
                        const { data } = await supabase
                            .from('product_variants')
                            .select('*')
                            .in('product_id', productIds);
                        if (data) setLiveVariants(data);
                    }
                }
            )
            .subscribe();


        return () => {
            supabase.removeChannel(channel);
        };
    }, [streamer.hostId]);

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
        if (!streamer.id) return;

        console.log(`[Socket] Connecting to room: ${streamer.id} as ${isHost ? 'Host' : 'Viewer'}`);

        if (currentUser) {
            socketService.updateUser(currentUser);
        }

        // Ensure we join the room properly
        socketService.joinRoom(streamer.id, streamer.hostId);

        const cleanup = socketService.onComment((comment) => {
            console.log('[LiveRoom] New comment UI update:', comment);
            setComments(prev => [...prev, comment]);
        });

        const cleanupHearts = socketService.on('new_heart', () => {
            console.log('[Socket] New heart received');
            addFloatingHeart();
        });

        const cleanupGifts = socketService.on('new_gift', (data: any) => {
            console.log('[LiveRoom] Gift event received:', data);

            // De-duplicate (Broadcast vs DB)
            // If it's from DB, we have a messageId. If it's broadcast, we use a combo.
            // We use a broader key for the broadcast to catch the subsequent DB update.
            const broadcastKey = `${data.senderId}-${data.giftId}`;
            const dbKey = data.messageId;

            // Check if we already processed this exact DB message
            if (dbKey && processedGiftsRef.current.has(dbKey)) return;

            // If it's a broadcast, check if we've seen a broadcast from this user for this gift recently (within 5s)
            // (A bit simplified, but effective for preventing double animation)
            if (!dbKey) {
                if (processedGiftsRef.current.has(broadcastKey)) return;
                processedGiftsRef.current.add(broadcastKey);
                setTimeout(() => processedGiftsRef.current.delete(broadcastKey), 5000);
            } else {
                processedGiftsRef.current.add(dbKey);
            }

            const gift = GIFTS.find(g => g.id == data.giftId);
            if (gift) {
                // Only animate if it's NOT from me (since I already animated it locally on click)
                if (data.senderId != currentUser?.id) {
                    console.log('[LiveRoom] Triggering animation for external gift');
                    triggerGiftAnimation(gift, data.sender);

                    // Add to Chat Stream
                    const giftComment: any = {
                        id: 'gift-' + Date.now() + '-' + Math.random(),
                        username: data.sender || 'User',
                        message: `a ${gift.name}!`,
                        timestamp: new Date().toLocaleTimeString(),
                        isGift: true,
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

        const cleanupBids = socketService.onBidUpdate((data: any) => {
            console.log('[LiveRoom] Bid update received:', data);
            setCurrentHighestBid(data.amount);
            setHighestBidderName(data.user);
            // If I'm the host, I might want to trigger a local sound/effect
            setMyBidAmount(data.amount + 1); // Auto-update bid amount to be ready for next bid
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
                    setMyBidAmount(prev => Math.max(prev, payload.new.current_bid + 1)); // Sync my bid amount from DB updates
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
                    setAuctionTimeLeft('0:00');
                    // Only trigger completion once per unique auction end time
                    if (notifiedAuctionEndRef.current !== streamer.auctionEndTime) {
                        setIsAuctionOver(true);
                        notifiedAuctionEndRef.current = streamer.auctionEndTime;
                    }
                } else {
                    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const s = Math.floor((diff % (1000 * 60)) / 1000);
                    setAuctionTimeLeft(`${m}:${s.toString().padStart(2, '0')}`);
                }
            };

            updateTimer();
            const timerInterval = setInterval(updateTimer, 1000);
            return () => clearInterval(timerInterval);
        } else {
            // Reset notified ref if transition out of auction mode
            notifiedAuctionEndRef.current = null;
        }
    }, [streamer.isAuction, streamer.auctionEndTime]);

    // Automatic Order Creation for Auction Winner
    useEffect(() => {
        if (isAuctionOver && !isHost && !hasSentWinnerOrder && highestBidderName && currentUser?.username === highestBidderName) {
            const winProduct = streamer.products[0];
            if (winProduct) {
                console.log('[AuctionWin] Creating automatic order for winner:', currentUser.username);
                const winnerCartItem: CartItem = {
                    ...winProduct,
                    price: currentHighestBid, // Pay the bid price
                    quantity: 1,
                    color: winProduct.colors?.[0] || 'Default',
                    size: winProduct.sizes?.[0] || 'Free Size'
                };

                // Set flag before calling to avoid duplicate calls during state transition
                setHasSentWinnerOrder(true);

                // Immediate order processing
                processOrder([winnerCartItem]).then(success => {
                    if (success) {
                        console.log('[AuctionWin] Order successfully created for winner');
                    } else {
                        console.error('[AuctionWin] Automatic order attempt finished. User may need to complete manually if funds or address were missing.');
                    }
                });
            }
        }
    }, [isAuctionOver, highestBidderName, currentUser, streamer.products, currentHighestBid, isHost, hasSentWinnerOrder]);

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
        }, 5000);
    };

    const triggerGiftAnimation = (gift: typeof GIFTS[0], sender: string) => {
        const id = Date.now();
        setGiftAnimation({ id, icon: gift.icon, name: gift.name, sender, color: gift.color || 'yellow' });
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
            showAlert({ message: t.bidTooLow, type: 'warning' });
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
        console.log('[LiveRoom] Emitting gift to socket:', gift.id);
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
        if (!userAddress) {
            setIsEditingAddress(true);
            // Pre-fill tempAddress with current userAddress if any (though it's null here)
            // or just leave as is. Since userAddress is null, we might want to guide them.
        }
        setShowCheckoutModal(true);
        setShowCart(false);
    };

    const processOrder = async (items: CartItem[]) => {
        const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        if (!userAddress || !userPhone) {
            showAlert({
                message: language === 'th' ? "กรุณาป้อนที่อยู่และเบอร์โทรศัพท์ก่อนดำเนินการต่อ" : "Please add a shipping address and phone number before proceeding.",
                type: 'warning'
            });
            setCart(items); // Pre-fill cart with the items being bought
            setIsEditingAddress(true);
            setShowCheckoutModal(true);
            return false;
        }

        if (walletBalance < total) {
            showAlert({ message: 'Insufficient coins. Please top up.', type: 'error' });
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
                        size: item.size,
                        seller_id: item.seller_id,
                        item_type: item.type || 'normal'
                    }));

                    const { error: itemsError } = await supabase
                        .from('order_items')
                        .insert(itemsToInsert);

                    if (itemsError) throw itemsError;
                }
            }

            showAlert({
                message: `Payment successful! Items will be shipped to: ${userAddress}`,
                type: 'success'
            });

            // Immediate Refresh products to see stock change
            if (streamer.hostId) {
                supabase.from('products')
                    .select('*')
                    .eq('seller_id', streamer.hostId)
                    .then(({ data }) => {
                        if (data) {
                            // Filter only products belonging to this room
                            const filtered = data.filter(p =>
                                Array.isArray(streamer.product_ids) && streamer.product_ids.length > 0
                                    ? streamer.product_ids.includes(p.id)
                                    : streamer.products.some(original => original.id === p.id)
                            );
                            setLiveProducts(filtered);
                        }
                    });
            }

            onNewOrder?.();
            return true;

        } catch (err: any) {
            console.error("Exception creating order:", err);
            showAlert({
                message: `Failed to create order: ${err.message || err}`,
                type: 'error'
            });
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

    const handleSaveAddress = async () => {
        if (!tempAddress.trim()) {
            showAlert({
                message: language === 'th' ? "กรุณาป้อนที่อยู่" : "Please enter address",
                type: 'warning'
            });
            return;
        }
        if (!tempPhone.trim()) {
            showAlert({
                message: language === 'th' ? "กรุณาป้อนเบอร์โทรศัพท์" : "Please enter phone number",
                type: 'warning'
            });
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            // 1. Set all other addresses to NOT default
            await supabase
                .from('addresses')
                .update({ is_default: false })
                .eq('user_id', user.id);

            const addressData = {
                user_id: user.id,
                name: currentUser?.username || 'User',
                phone: tempPhone.trim(),
                address: tempAddress.trim(),
                province: '',
                postal_code: '',
                is_default: true
            };

            let res;
            if (selectedAddressId) {
                res = await supabase
                    .from('addresses')
                    .update(addressData)
                    .eq('id', selectedAddressId)
                    .select()
                    .single();
            } else {
                res = await supabase
                    .from('addresses')
                    .insert(addressData)
                    .select()
                    .single();
            }

            if (res.error) throw res.error;

            if (res.data) {
                setSelectedAddressId(res.data.id);
                const formatted = `${res.data.name}\n${res.data.address} ${res.data.province} ${res.data.postal_code}`;
                setUserAddress(formatted);
                setUserPhone(tempPhone.trim());
                setIsEditingAddress(false);
                console.log('[Address] Saved successfully as default');
            }
        } catch (err: any) {
            console.error('[Address] Error saving:', err);
            showAlert({
                message: "Failed to save address: " + (err.message || err),
                type: 'error'
            });
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

        // Check variant stock
        const variant = liveVariants.find(v =>
            v.product_id === selectedProductForPurchase.id &&
            v.color === purchaseConfig.color &&
            v.size === purchaseConfig.size
        );

        const availableStock = variant ? variant.stock : selectedProductForPurchase.stock;

        if (availableStock < purchaseConfig.quantity) {
            showAlert({
                message: language === 'th' ? 'สินค้าไม่พอในสต็อก' : 'Not enough stock available.',
                type: 'warning'
            });
            return;
        }

        if (action === 'buy_now') {

            const tempItem: CartItem = {
                ...selectedProductForPurchase,
                quantity: purchaseConfig.quantity,
                color: purchaseConfig.color,
                size: purchaseConfig.size
            };

            // Close purchase sheet first to avoid UI overlap if we redirect to address/checkout
            setSelectedProductForPurchase(null);

            const success = await processOrder([tempItem]);
            if (!success && !userAddress) {
                // If failed due to no address, the modal is already open by processOrder
                console.log('Redirecting to address input...');
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
            showAlert({ message: 'Added to Cart!', type: 'success' });
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
            <style>{`
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
            `}</style>

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
                        // Direct Video (Legacy/External)
                        <div className="w-full h-full relative">
                            <video
                                ref={videoRef}
                                src={streamer.videoUrl}
                                className="w-full h-full object-cover"
                                muted={isHost} // Host mutes own preview to avoid feedback
                                playsInline
                                loop
                                autoPlay
                                onError={() => setVideoError(true)}
                            />

                            {/* Interaction Overlay */}
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
                            style={{ left: `${heart.left}%`, animationDuration: `${3 + Math.random() * 2}s` }}
                        >
                            <Heart size={20 + Math.random() * 10} className="text-pink-500 fill-pink-500 drop-shadow-lg" />
                        </div>
                    ))}
                </div>

                {/* Gift Animation Layer */}
                {giftAnimation && (
                    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none overflow-hidden">
                        <div className="absolute w-[150%] h-[150%] bg-gradient-to-r from-yellow-500/10 to-red-500/10 animate-spin-slow"
                            style={{ maskImage: 'radial-gradient(circle, black 30%, transparent 70%)', WebkitMaskImage: 'radial-gradient(circle, black 30%, transparent 70%)' }}>
                        </div>
                        <div className="relative z-10 text-[120px] drop-shadow-[0_0_25px_rgba(255,255,255,0.6)] animate-gift-entrance filter contrast-125">
                            {giftAnimation.icon}
                        </div>
                        <div className="relative z-10 mt-4 text-center animate-text-slide-up">
                            <div className="text-yellow-400 font-black font-athletic text-3xl uppercase tracking-widest drop-shadow-md stroke-black">
                                {giftAnimation.sender}
                            </div>
                            <div className="text-white font-bold text-sm bg-black/60 px-4 py-1 rounded-full backdrop-blur-md border border-white/20 mt-2 inline-flex items-center gap-2 shadow-xl">
                                Sent <span className="text-yellow-400 font-black uppercase">{giftAnimation.name}</span>
                            </div>
                        </div>
                    </div>
                )}



                <div className="absolute bottom-0 left-0 right-0 p-4 pb-safe-bottom z-30 bg-gradient-to-t from-black/90 via-black/40 to-transparent">

                    {/* Floating Auction Bid Box (Custom Position) */}
                    {streamer.isAuction && (
                        <div className="absolute bottom-32 right-4 z-[100] animate-slide-up w-32">
                            <div className="bg-black/60 backdrop-blur-2xl rounded-2xl p-3 border border-orange-500/40 shadow-2xl flex flex-col items-center gap-3 overflow-hidden">
                                {/* Compact Timer & Item */}
                                <div className="w-full flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-orange-400">
                                    <span>Bid</span>
                                    {auctionTimeLeft && (
                                        <div className="flex items-center gap-1 text-white">
                                            <Clock size={10} />
                                            <span className="font-athletic">{auctionTimeLeft}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Price Display */}
                                <div className="text-center">
                                    <div className="text-2xl font-black text-white font-athletic leading-none mb-1">
                                        ฿{(currentHighestBid || 0).toLocaleString()}
                                    </div>
                                    {highestBidderName && (
                                        <div className="text-[9px] text-gray-400 truncate w-full px-1">
                                            by <span className="text-blue-400 font-bold">{highestBidderName}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Bid Controls (Viewer Only) */}
                                {!isHost && (
                                    <div className="w-full space-y-2">
                                        <div className="flex items-center justify-between bg-black/40 rounded-lg p-1 border border-white/10">
                                            <button onClick={decreaseBid} className="w-6 h-6 rounded-md bg-gray-800 flex items-center justify-center active:scale-90 transition-all">
                                                <Minus size={12} className="text-white" />
                                            </button>
                                            <span className="text-xs font-bold text-yellow-500 font-athletic">฿{myBidAmount}</span>
                                            <button onClick={increaseBid} className="w-6 h-6 rounded-md bg-gray-800 flex items-center justify-center active:scale-90 transition-all">
                                                <Plus size={12} className="text-white" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={placeBid}
                                            disabled={isInsufficientFunds || myBidAmount <= currentHighestBid || isAuctionOver}
                                            className={`w-full py-2 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow-lg ${isAuctionOver
                                                ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                                                : isInsufficientFunds
                                                    ? 'bg-gray-700 text-gray-400'
                                                    : myBidAmount <= currentHighestBid
                                                        ? 'bg-gray-800 text-gray-500 opacity-50'
                                                        : 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:brightness-110 active:scale-95'
                                                }`}
                                        >
                                            {isAuctionOver ? 'Auction Ended' : isInsufficientFunds ? 'No Money' : 'Bid Now'}
                                        </button>
                                        {isInsufficientFunds && (
                                            <button
                                                onClick={onOpenWallet}
                                                className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow-lg active:scale-95"
                                            >
                                                {t.topUp}
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Item Preview (Small) */}
                                <div className="absolute -top-1 -left-1">
                                    <div className="bg-orange-600 rounded-full p-1 shadow-lg">
                                        <Flame size={8} className="text-white fill-white" />
                                    </div>
                                </div>
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
                                        ? 'bg-black/60 border-red-500/50 text-white rounded-bl-none self-start'
                                        : 'bg-black/40 border-white/10 text-white rounded-bl-none self-start'
                                        }`}>
                                        <span className={`font-bold mr-2 text-xs opacity-90 ${comment.isHost ? 'text-red-500' : 'text-gray-300'}`}>
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
                        <div className="flex items-center gap-3 w-full">
                            <div className="flex-1 min-w-0 bg-black/40 backdrop-blur-md border border-white/20 rounded-full flex items-center px-2 py-1 focus-within:border-white/50 focus-within:bg-black/60 transition-all">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder={t.saySomething}
                                    className="flex-1 min-w-0 bg-transparent border-none text-white text-sm px-3 focus:outline-none placeholder-gray-400 h-10"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(e)}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!newComment.trim()}
                                    className="w-8 h-8 shrink-0 flex items-center justify-center bg-white/10 rounded-full text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send size={16} />
                                </button>
                            </div>

                            {/* Action Buttons Group */}
                            <div className="flex items-center gap-2 shrink-0">
                                {!streamer.isAuction && (
                                    <button
                                        onClick={() => setShowProducts(true)}
                                        className="relative w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-white/10 active:scale-90 transition-all"
                                    >
                                        <ShoppingBag size={20} />
                                        {liveProducts.length > 0 && (
                                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-[10px] flex items-center justify-center font-bold border border-black">
                                                {liveProducts.length}
                                            </span>
                                        )}
                                    </button>
                                )}

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
                        <div className="flex items-center gap-2 w-full">
                            {/* Product Button */}
                            {!streamer.isAuction && (
                                <button
                                    onClick={() => setShowProducts(true)}
                                    className="shrink-0 relative w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-white/10 active:scale-90 transition-all"
                                >
                                    <ShoppingBag size={20} />
                                    {streamer.products.length > 0 && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-[10px] flex items-center justify-center font-bold border border-black">
                                            {streamer.products.length}
                                        </span>
                                    )}
                                </button>
                            )}

                            {/* Chat Input for Host */}
                            <div className="flex-1 min-w-0 bg-black/40 backdrop-blur-md border border-white/20 rounded-full flex items-center px-2 py-1 focus-within:border-white/50 focus-within:bg-black/60 transition-all">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Type to chat..."
                                    className="flex-1 min-w-0 bg-transparent border-none text-white text-sm px-3 focus:outline-none placeholder-gray-400 h-10"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(e)}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!newComment.trim()}
                                    className="w-8 h-8 shrink-0 flex items-center justify-center bg-white/10 rounded-full text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send size={16} />
                                </button>
                            </div>

                            {/* Mic Toggle Button */}
                            <button
                                onClick={handleToggleMic}
                                className={`shrink-0 w-10 h-10 flex items-center justify-center backdrop-blur-md rounded-full border text-white active:scale-90 transition-all shadow-lg ${isMicOn
                                    ? 'bg-gray-600/80 border-gray-500/50 hover:bg-gray-500'
                                    : 'bg-red-600/80 border-red-500/50 hover:bg-red-500 shadow-red-900/40'
                                    }`}
                            >
                                {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
                            </button>
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
                                {liveProducts.map(p => (
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
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[10px] uppercase text-gray-500 font-bold mb-1 block">Phone Number *</label>
                                                <input
                                                    type="tel"
                                                    className="w-full bg-black border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none"
                                                    value={tempPhone}
                                                    onChange={e => setTempPhone(e.target.value)}
                                                    placeholder="081-xxxxxxx"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] uppercase text-gray-500 font-bold mb-1 block">Full Address *</label>
                                                <textarea
                                                    className="w-full bg-black border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none h-24"
                                                    value={tempAddress}
                                                    onChange={e => setTempAddress(e.target.value)}
                                                    placeholder="Enter full address..."
                                                />
                                            </div>
                                            <button onClick={handleSaveAddress} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl font-bold transition-all">Save Changes</button>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {userPhone && <p className="text-sm font-bold text-white flex items-center gap-2"><MapPin size={14} className="text-blue-400" /> {userPhone}</p>}
                                            <p className="text-sm text-gray-400 whitespace-pre-line pl-5">{userAddress || "No address set. Please edit."}</p>
                                        </div>
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
                                <div className="flex flex-col">
                                    <span>Quantity</span>
                                    {selectedProductForPurchase && (
                                        <span className="text-[10px] text-gray-500">
                                            {(() => {
                                                const v = liveVariants.find(v =>
                                                    v.product_id === selectedProductForPurchase.id &&
                                                    v.color === purchaseConfig.color &&
                                                    v.size === purchaseConfig.size
                                                );
                                                const stock = v ? v.stock : selectedProductForPurchase.stock;
                                                return language === 'th' ? `คงเหลือ: ${stock}` : `In Stock: ${stock}`;
                                            })()}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 bg-black rounded-lg p-1 border border-gray-700">
                                    <button onClick={() => setPurchaseConfig(p => ({ ...p, quantity: Math.max(1, p.quantity - 1) }))} className="px-3 hover:bg-gray-800 rounded"><Minus size={14} /></button>
                                    <span className="font-bold w-4 text-center">{purchaseConfig.quantity}</span>
                                    <button
                                        onClick={() => {
                                            const v = liveVariants.find(v =>
                                                v.product_id === selectedProductForPurchase!.id &&
                                                v.color === purchaseConfig.color &&
                                                v.size === purchaseConfig.size
                                            );
                                            const stock = v ? v.stock : selectedProductForPurchase!.stock;
                                            if (purchaseConfig.quantity < stock) {
                                                setPurchaseConfig(p => ({ ...p, quantity: p.quantity + 1 }));
                                            } else {
                                                showAlert({ message: language === 'th' ? 'สินค้าในสต็อกไม่พอ' : 'Reached stock limit', type: 'warning' });
                                            }
                                        }}
                                        className="px-3 hover:bg-gray-800 rounded"
                                    >
                                        <Plus size={14} />
                                    </button>
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
                {/* Auction Winner Overlay (PROFESSIONAL WIN UI) - Placed at end for highest priority click accessibility */}
                {isAuctionOver && highestBidderName && (
                    <div className="absolute inset-0 z-[999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
                        <div className="w-full max-w-sm bg-gradient-to-b from-gray-900 via-gray-900 to-black rounded-3xl border-2 border-yellow-500/50 p-8 text-center shadow-[0_0_50px_rgba(234,179,8,0.3)] animate-scale-in overflow-hidden relative">
                            {/* Decorative Background effects */}
                            <div className="absolute -top-20 -left-20 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl animate-pulse"></div>
                            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>

                            <div className="relative z-10">
                                <div className="w-20 h-20 bg-gradient-to-tr from-yellow-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-900/40 border-4 border-black/20 animate-bounce">
                                    <Trophy size={40} className="text-black" />
                                </div>

                                <h1 className="text-3xl font-athletic text-white mb-2 tracking-widest uppercase">
                                    Win Bid !
                                </h1>

                                <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent my-6"></div>

                                <div className="space-y-4">
                                    <div>
                                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-[0.2em] mb-1">Winning Username</p>
                                        <div className="text-2xl font-black text-white bg-white/5 rounded-xl py-2 border border-white/10">
                                            {highestBidderName}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-[0.2em] mb-1">Final Auction Price</p>
                                        <div className="text-4xl font-black text-yellow-500 font-athletic tracking-tight">
                                            ฿{currentHighestBid.toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                {currentUser?.username === highestBidderName && (
                                    <div className="mt-8 bg-green-500/10 border border-green-500/30 rounded-2xl p-4 animate-pulse">
                                        <p className="text-green-400 font-bold text-xs flex items-center justify-center gap-2">
                                            <Check size={16} /> ORDER CREATED AUTOMATICALLY
                                        </p>
                                        <p className="text-gray-500 text-[9px] mt-1 italic">Check your Orders page for details</p>
                                    </div>
                                )}

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsAuctionOver(false);
                                    }}
                                    className="mt-8 w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold text-sm transition-all"
                                >
                                    {t.close}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(LiveRoom);
