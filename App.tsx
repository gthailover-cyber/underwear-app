
import React, { useState, useEffect } from 'react';
import { MessageCircle, Bell, Menu, Plus, Home, Compass, ShoppingCart, User, Users, MapPin, CreditCard, Wallet, LogOut, ChevronRight, X, Globe, Coins, ArrowLeft, Package, ShoppingBag, Box, LayoutDashboard, Shield, List, UserCog, Video, MessageSquare, BicepsFlexed, Crown, Star, Clock, LockKeyhole, Banknote, Calendar } from 'lucide-react';
import { supabase } from './lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import AuthPage from './components/AuthPage';
import StreamCard from './components/StreamCard';
import LiveRoom from './components/LiveRoom';
import WalletModal from './components/WalletModal';
import LiveSelectionModal from './components/LiveSelectionModal';
import LiveProductSelectionModal from './components/LiveProductSelectionModal';
import LiveAuctionSetupModal from './components/LiveAuctionSetupModal';
import UpgradeOrganizerModal from './components/UpgradeOrganizerModal';
import CreateRoomModal from './components/CreateRoomModal';
import GroupChatRoom from './components/GroupChatRoom';
import OrganizerTools from './components/OrganizerTools';
import CountdownOverlay from './components/CountdownOverlay';
import Discover from './components/Discover';
import Cart from './components/Cart';
import Profile from './components/Profile';
import People from './components/People';
import UserProfileDetail from './components/UserProfileDetail';
import EditProfile from './components/EditProfile';
import EditGallery from './components/EditGallery';
import Messages from './components/Messages';
import ChatDetail from './components/ChatDetail';
import MyProducts from './components/MyProducts';
import MyRate from './components/MyRate';
import MyAddress from './components/MyAddress';
import MyPayment from './components/MyPayment';
import MyOrders from './components/MyOrders';
import ModelApplicationModal from './components/ModelApplicationModal';
import StartLiveModal from './components/StartLiveModal';
import UpdatePasswordModal from './components/UpdatePasswordModal';
import { TRANSLATIONS, MOCK_USER_PROFILE, DEFAULT_IMAGES } from './constants';
import { Streamer, Language, CartItem, UserProfile, MessagePreview, Product, Person, ChatRoom } from './types';

const App: React.FC = () => {
  // Auth State
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [isUpdatePasswordOpen, setIsUpdatePasswordOpen] = useState(false);

  // Data State
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [people, setPeople] = useState<Person[]>([]);

  // UI State
  const [currentStreamer, setCurrentStreamer] = useState<Streamer | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [language, setLanguage] = useState<Language>('th');
  const [activeTab, setActiveTab] = useState<'home' | 'discover' | 'cart' | 'people' | 'profile' | 'all_live' | 'messages' | 'my_products' | 'address' | 'payment' | 'my_orders' | 'organizer_tools' | 'my_rate' | 'my_schedule'>('home');
  const [returnTab, setReturnTab] = useState<string | null>(null); // For navigation history
  const [homeTab, setHomeTab] = useState<'live' | 'rooms' | 'models'>('live'); // New: Sub-tab for Home
  const [selectedChatUser, setSelectedChatUser] = useState<MessagePreview | null>(null);
  const [selectedGroupRoom, setSelectedGroupRoom] = useState<ChatRoom | null>(null);
  const [organizerToolTab, setOrganizerToolTab] = useState<'rooms' | 'members'>('rooms'); // State for organizer tool tab
  const [isStartLiveModalOpen, setIsStartLiveModalOpen] = useState(false);

  // People Tab State
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  // Modal State
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isLiveSelectionOpen, setIsLiveSelectionOpen] = useState(false);
  const [isProductSelectionOpen, setIsProductSelectionOpen] = useState(false);
  const [isAuctionSetupOpen, setIsAuctionSetupOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isModelApplicationOpen, setIsModelApplicationOpen] = useState(false);

  // Live Setup State
  const [selectionMode, setSelectionMode] = useState<'multiple' | 'single'>('multiple');
  const [auctionSelectedProduct, setAuctionSelectedProduct] = useState<Product | null>(null);

  // Countdown State
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [countdownValue, setCountdownValue] = useState(5);

  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>(MOCK_USER_PROFILE);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingGallery, setIsEditingGallery] = useState(false);

  // Wallet State
  const [walletBalance, setWalletBalance] = useState(0);

  // Cart State (In real app, fetch from DB order_items with status 'in_cart' if implemented)
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const t = TRANSLATIONS[language];

  // --- SUPABASE INTEGRATION: Auth & Data ---
  useEffect(() => {
    // 1. Check Session & Handle Recovery Link
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);

      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email);
        fetchGlobalData(session.user.id);
      }
    });

    // 2. Auth State Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email);
        fetchGlobalData(session.user.id);
      }

      // Handle Password Recovery Event
      if (event === 'PASSWORD_RECOVERY') {
        setIsUpdatePasswordOpen(true);
      }
    });

    // 3. Fallback: Manually check URL hash for recovery params
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setIsUpdatePasswordOpen(true);
    }

    return () => subscription.unsubscribe();

  }, []);

  const fetchGlobalData = async (userId: string) => {
    // 1. Fetch Rooms (Streamers)
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
            *,
            profiles:host_id (username, avatar)
          `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const dbStreamers: Streamer[] = data.map((room: any) => ({
          id: room.id,
          name: room.profiles?.username || 'Unknown Host',
          title: room.title,
          viewerCount: room.viewer_count || 0,
          coverImage: room.cover_image || DEFAULT_IMAGES.COVER,
          videoUrl: room.video_url,
          youtubeId: room.youtube_id,
          itemCount: 0, // Need to join products if possible, or fetch separate
          products: [], // Populate if needed
          isAuction: room.is_auction,
          auctionEndTime: room.auction_end_time ? Number(room.auction_end_time) : undefined,
          auctionStartingPrice: room.auction_starting_price,
          currentBid: room.current_bid,
          topBidder: room.top_bidder_name
        }));
        setStreamers(dbStreamers);
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
    }

    // 2. Fetch My Products
    try {
      const { data: prodData } = await supabase.from('products').select('*').eq('seller_id', userId);
      if (prodData) setMyProducts(prodData);
    } catch (err) {
      console.error('Error fetching products:', err);
    }

    // 3. Fetch All People (Profiles)
    try {
      const { data: profileData } = await supabase.from('profiles').select('*');
      if (profileData) {
        setPeople(profileData.map(p => ({
          id: p.id,
          username: p.username || 'User',
          avatar: p.avatar || DEFAULT_IMAGES.AVATAR,
          isOnline: false, // Placeholder
          followers: p.followers || 0,
          role: p.role
        })));
      }
    } catch (err) {
      console.error('Error fetching people:', err);
    }

    // 4. Chat Rooms (Use 'rooms' table or separate 'chat_rooms' if exists. Reusing rooms for now)
    // Since schema uses 'rooms' for live, we can treat them as group chats too if they are persistent
    // For now, let's just initialize empty or filter for non-live rooms if logic existed
    // setChatRooms([]); 
  };

  const fetchUserProfile = async (userId: string, email?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        const safeAvatar = (data.avatar && data.avatar.trim() !== '') ? data.avatar : DEFAULT_IMAGES.AVATAR;
        const safeCover = (data.cover_image && data.cover_image.trim() !== '') ? data.cover_image : DEFAULT_IMAGES.COVER;

        setUserProfile({
          username: data.username || email?.split('@')[0] || 'User',
          avatar: safeAvatar,
          coverImage: safeCover,
          role: data.role || 'supporter',
          bio: data.bio || '',
          location: data.location || '',
          age: data.age || 0,
          height: data.height || 0,
          weight: data.weight || 0,
          favorites: data.favorites || [],
          gallery: data.gallery || [],
          followers: data.followers || 0,
          following: data.following || 0,
        });
        setWalletBalance(data.wallet_balance || 0);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false);
  };

  const handleOpenStream = (streamer: Streamer) => {
    setCurrentStreamer(streamer);
  };

  const handleCloseStream = async () => {
    // If I am the host (check if room ID contains my User ID, based on creation logic)
    if (session?.user && currentStreamer?.id?.includes(session.user.id)) {
      try {
        await supabase.from('rooms').delete().eq('id', currentStreamer.id);
        console.log("Room deleted from DB");
      } catch (err) {
        console.error("Error deleting room:", err);
      }
    }
    setCurrentStreamer(null);
  };

  const handleTopUp = (amount: number) => {
    setWalletBalance(prev => prev + amount);
    // In real app, call Supabase to update balance here
  };

  const handleUseCoins = (amount: number) => {
    setWalletBalance(prev => Math.max(0, prev - amount));
    // In real app, call Supabase to update balance here
  };

  // --- PROFILE UPDATE LOGIC ---
  const handleSaveProfile = async (updatedProfile: UserProfile) => {
    // 1. Optimistic Update (Update UI immediately)
    setUserProfile(updatedProfile);
    setIsEditingProfile(false);

    // 2. Database Update
    if (session?.user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            username: updatedProfile.username,
            location: updatedProfile.location,
            bio: updatedProfile.bio,
            avatar: updatedProfile.avatar,
            cover_image: updatedProfile.coverImage,
            age: updatedProfile.age,
            height: updatedProfile.height,
            weight: updatedProfile.weight,
            favorites: updatedProfile.favorites
          })
          .eq('id', session.user.id);

        if (error) throw error;
        console.log("Profile updated successfully in DB");
      } catch (error: any) {
        console.error("Error updating profile in DB:", error.message || error);
        alert("Failed to save changes to the server. " + (error.message || ''));
      }
    }
  };

  // --- GALLERY UPDATE LOGIC ---
  const handleSaveGallery = async (newGallery: string[]) => {
    // 1. Optimistic Update
    setUserProfile(prev => ({ ...prev, gallery: newGallery }));
    setIsEditingGallery(false);

    // 2. Database Update
    if (session?.user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            gallery: newGallery
          })
          .eq('id', session.user.id);

        if (error) throw error;
        console.log("Gallery updated successfully in DB");
      } catch (error: any) {
        console.error("Error updating gallery in DB:", error.message || error);
        alert("Failed to save gallery changes. Make sure you ran the SQL to add the 'gallery' column.");
      }
    }
  };

  const handlePlusClick = () => {
    // Only Models and Organizers can start a live stream
    if (userProfile.role === 'supporter') {
      alert(language === 'th' ? "เฉพาะนายแบบและผู้จัดเท่านั้นที่สามารถเริ่มไลฟ์ได้ กรุณาสมัครเป็นนายแบบก่อน" : "Only Models and Organizers can start a live stream. Please apply to become a Model.");
      setIsMenuOpen(true); // Open menu to guide them to apply
      return;
    }
    setIsLiveSelectionOpen(true);
  };

  const handleLiveTypeSelect = (type: 'selling' | 'auction') => {
    setIsLiveSelectionOpen(false);

    if (type === 'selling') {
      setSelectionMode('multiple');
      setIsProductSelectionOpen(true);
    } else {
      // Auction: Must select 1 product first
      setSelectionMode('single');
      setIsProductSelectionOpen(true);
    }
  };

  const handleProductSelectionConfirm = (selectedProducts: Product[]) => {
    setIsProductSelectionOpen(false);

    if (selectionMode === 'multiple') {
      // Go straight to start live modal
      setIsStartLiveModalOpen(true);
    } else {
      if (selectedProducts.length > 0) {
        setAuctionSelectedProduct(selectedProducts[0]);
        setIsAuctionSetupOpen(true);
      }
    }
  };

  const handleAuctionSetupConfirm = (durationMs: number, startingPrice: number) => {
    setIsAuctionSetupOpen(false);
    setIsStartLiveModalOpen(true);
    // Store auction data for when start stream is pressed
    // In a real app we'd pass this to the StartLiveModal or store in state
  };

  const handleStartStream = async (streamConfig: Streamer) => {
    setIsStartLiveModalOpen(false);

    // Start Countdown
    setIsCountdownActive(true);
    setCountdownValue(5);

    let count = 5;
    const timer = setInterval(async () => {
      count--;
      if (count > 0) {
        setCountdownValue(count);
      } else {
        clearInterval(timer);
        setIsCountdownActive(false);

        const roomId = `live-${session?.user?.id || Date.now()}`;

        // Construct Final Stream Object
        const myStream: Streamer = {
          ...streamConfig,
          id: roomId,
          name: userProfile.username,
          coverImage: userProfile.coverImage,
          products: myProducts,
          // Add auction data if needed
          // Add auction data if needed
        };

        setCurrentStreamer(myStream);

        // SAVE TO SUPABASE DB (So others can see it)
        if (session?.user) {
          try {
            const { error } = await supabase.from('rooms').insert({
              id: roomId,
              host_id: session.user.id,
              title: streamConfig.title || 'Untitled Live',
              cover_image: userProfile.coverImage,
              video_url: null, // Using LiveKit
              youtube_id: null,
              viewer_count: 0,
              is_auction: false, // Default for now
              created_at: new Date().toISOString()
            });
            if (error) console.error("Error creating room in DB:", error);
          } catch (err) {
            console.error("Failed to create room:", err);
          }
        }
      }
    }, 1000);
  };

  const handleAddProductRedirect = () => {
    setIsProductSelectionOpen(false);
    setActiveTab('my_products');
  };

  // Upgrade to Organizer Logic
  const handleConfirmUpgrade = () => {
    const PRICE = 5000;
    if (walletBalance >= PRICE) {
      setWalletBalance(prev => prev - PRICE);
      setUserProfile(prev => ({
        ...prev,
        role: 'organizer'
      }));
      alert(t.upgradeSuccess);
    }
  };

  // Model Application Logic
  const handleOpenModelApplication = () => {
    setIsModelApplicationOpen(true);
    setIsMenuOpen(false);
  };

  const handleSubmitModelApplication = async () => {
    // 1. Update local state to immediately reflect 'Model' status
    setUserProfile(prev => ({
      ...prev,
      role: 'model',
      modelApplicationStatus: 'approved'
    }));

    // 2. Feedback
    alert(language === 'th'
      ? "อนุมัติเรียบร้อย! คุณเป็น 'นายแบบ' แล้ว สามารถเริ่มไลฟ์ขายของได้เลย"
      : "Approved! You are now a 'Model' and can start selling."
    );

    // 3. Persist to Supabase
    if (session?.user) {
      try {
        await supabase
          .from('profiles')
          .update({ role: 'model' })
          .eq('id', session.user.id);
      } catch (err) {
        console.error("Error updating role:", err);
      }
    }
  };

  // Room Creation Logic
  const handleCreateRoom = (newRoom: ChatRoom) => {
    setChatRooms(prev => [newRoom, ...prev]);
  };

  // Cart Logic
  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAddToCart = (newItem: CartItem) => {
    setCartItems(prev => {
      const existingItemIndex = prev.findIndex(
        item => item.id === newItem.id && item.color === newItem.color && item.size === newItem.size
      );

      if (existingItemIndex > -1) {
        const updatedItems = [...prev];
        updatedItems[existingItemIndex].quantity += newItem.quantity;
        return updatedItems;
      } else {
        return [...prev, newItem];
      }
    });
  };

  const handleCheckout = () => {
    const total = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    if (walletBalance >= total) {
      setWalletBalance(prev => prev - total);
      setCartItems([]); // Clear Cart
    } else {
      alert('Insufficient Balance. Please Top Up.');
      setIsWalletOpen(true);
    }
  };

  // Menu items
  const menuItems = [
    { id: 'profile', icon: User, label: t.profile },
    { id: 'my_orders', icon: ShoppingBag, label: t.myOrders },
    { id: 'address', icon: MapPin, label: t.myAddress },
    { id: 'payment', icon: CreditCard, label: t.myPayment },
    { id: 'wallet', icon: Wallet, label: t.myWallet },
  ];

  const handleMenuClick = (id: string) => {
    if (id === 'wallet') {
      setIsWalletOpen(true);
      setIsMenuOpen(false);
    } else if (id === 'my_products') {
      setActiveTab('my_products');
      setIsMenuOpen(false);
    } else if (id === 'profile') {
      setActiveTab('profile');
      setIsMenuOpen(false);
    } else if (id === 'address') {
      setActiveTab('address');
      setIsMenuOpen(false);
    } else if (id === 'payment') {
      setActiveTab('payment');
      setIsMenuOpen(false);
    } else if (id === 'my_orders') {
      setActiveTab('my_orders');
      setIsMenuOpen(false);
    }
  };

  // Organizer Tools Navigation
  const handleOrganizerToolClick = (tool: 'create' | 'list' | 'members') => {
    if (tool === 'create') {
      setIsCreateRoomOpen(true);
      setIsMenuOpen(false);
    } else if (tool === 'list') {
      setActiveTab('organizer_tools');
      setOrganizerToolTab('rooms');
      setIsMenuOpen(false);
    } else if (tool === 'members') {
      setActiveTab('organizer_tools');
      setOrganizerToolTab('members');
      setIsMenuOpen(false);
    }
  };

  // Chat Navigation Logic
  const handleOpenChat = (user: MessagePreview) => {
    setSelectedChatUser(user);
  };

  const handleCloseChat = () => {
    setSelectedChatUser(null);
    if (returnTab) {
      setActiveTab(returnTab as any);
      setReturnTab(null);
    }
  };

  const handleOpenGroup = (room: ChatRoom) => {
    setReturnTab(activeTab); // Store current tab to return to
    setSelectedGroupRoom(room);
    setActiveTab('messages'); // Force switch to messages tab to render GroupChatRoom
  };

  const handleCloseGroup = () => {
    setSelectedGroupRoom(null);
    if (returnTab) {
      setActiveTab(returnTab as any);
      setReturnTab(null);
    }
  };

  const handleStartChatFromProfile = (person: Person) => {
    const newChatUser: MessagePreview = {
      id: `chat-${person.id}-${Date.now()}`,
      userId: person.id,
      username: person.username,
      avatar: person.avatar,
      lastMessage: 'Start chatting...',
      time: 'Now',
      unread: 0,
      isOnline: person.isOnline,
      isVerified: false
    };

    setReturnTab(activeTab);
    setSelectedChatUser(newChatUser);
    setActiveTab('messages');
    // Don't clear selectedPerson here, so we can return to it
  };

  // --- Helpers for Layout ---
  const isFullScreenTab = activeTab === 'messages' || activeTab === 'all_live' || activeTab === 'my_products' || activeTab === 'address' || activeTab === 'payment' || activeTab === 'my_orders' || activeTab === 'organizer_tools' || activeTab === 'my_rate' || activeTab === 'my_schedule';
  const isPeopleTab = activeTab === 'people';
  const isPeopleDetail = isPeopleTab && selectedPerson !== null;
  const isHomeTab = activeTab === 'home';

  // Decide when to show Top/Bottom Bars
  const showTopNav = !isFullScreenTab && !isPeopleDetail;
  const showBottomNav = !isFullScreenTab && !isPeopleDetail;

  // --- Render Content based on Active Tab ---
  const renderContent = () => {
    // If Chat Detail is open, it overrides the Messages tab content
    if (activeTab === 'messages') {
      if (selectedChatUser) {
        return (
          <ChatDetail
            user={selectedChatUser}
            language={language}
            onBack={handleCloseChat}
            onOpenStream={handleOpenStream}
          />
        );
      }
      if (selectedGroupRoom) {
        return (
          <GroupChatRoom
            room={selectedGroupRoom}
            language={language}
            onBack={handleCloseGroup}
            currentUser={userProfile.username}
            walletBalance={walletBalance}
            onUseCoins={handleUseCoins}
            onOpenWallet={() => setIsWalletOpen(true)}
          />
        );
      }
      return (
        <Messages
          language={language}
          onBack={() => setActiveTab('home')}
          onOpenChat={handleOpenChat}
          onOpenGroup={handleOpenGroup}
          chatRooms={chatRooms}
          userProfile={userProfile}
          onCreateRoom={() => setIsCreateRoomOpen(true)}
        />
      );
    }

    switch (activeTab) {
      case 'discover':
        return (
          <Discover
            language={language}
            onOpenStream={handleOpenStream}
            streamers={streamers}
          />
        );
      case 'cart':
        return (
          <Cart
            language={language}
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onCheckout={handleCheckout}
            onGoShopping={() => setActiveTab('discover')}
          />
        );
      case 'people':
        if (selectedPerson) {
          return (
            <UserProfileDetail
              language={language}
              person={selectedPerson}
              onBack={() => setSelectedPerson(null)}
              onChat={() => handleStartChatFromProfile(selectedPerson)}
            />
          );
        }
        return (
          <People
            language={language}
            onUserClick={(person) => setSelectedPerson(person)}
            streamers={streamers}
            people={people}
          />
        );
      case 'profile':
        if (isEditingProfile) {
          return (
            <EditProfile
              language={language}
              initialData={userProfile}
              onSave={handleSaveProfile}
              onCancel={() => setIsEditingProfile(false)}
            />
          );
        }
        if (isEditingGallery) {
          return (
            <EditGallery
              language={language}
              initialGallery={userProfile.gallery}
              onSave={handleSaveGallery}
              onCancel={() => setIsEditingGallery(false)}
            />
          );
        }
        return (
          <Profile
            language={language}
            user={userProfile}
            onEdit={() => setIsEditingProfile(true)}
            onEditGallery={() => setIsEditingGallery(true)}
            onUpgrade={() => setIsUpgradeModalOpen(true)}
          />
        );
      case 'my_products':
        if (userProfile.role !== 'model') {
          return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-500 space-y-4">
              <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center border border-gray-800">
                <LockKeyhole size={32} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Access Restricted</h3>
                <p className="text-sm">Only verified models can manage and sell products.</p>
              </div>
              <button onClick={() => setActiveTab('home')} className="px-6 py-2 bg-gray-800 text-white rounded-lg text-sm font-bold border border-gray-700 hover:bg-gray-700">Go Home</button>
            </div>
          );
        }
        return (
          <MyProducts
            language={language}
            onBack={() => setActiveTab('home')}
            products={myProducts}
            setProducts={setMyProducts}
          />
        );
      case 'my_rate':
        return (
          <MyRate
            language={language}
            onBack={() => setActiveTab('home')}
          />
        );
      case 'my_schedule':
        return (
          <div className="pb-24 animate-fade-in bg-black min-h-screen flex flex-col">
            <div className="flex items-center gap-3 px-4 py-4 sticky top-0 bg-black/90 backdrop-blur z-30 border-b border-gray-800">
              <button
                onClick={() => setActiveTab('home')}
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors border border-gray-700"
              >
                <ArrowLeft size={20} className="text-white" />
              </button>
              <h2 className="text-xl font-athletic tracking-wide text-white">{t.mySchedule}</h2>
            </div>
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <p>My Schedule (Coming Soon)</p>
            </div>
          </div>
        );
      case 'address':
        return (
          <MyAddress
            language={language}
            onBack={() => setActiveTab('home')}
          />
        );
      case 'payment':
        return (
          <MyPayment
            language={language}
            onBack={() => setActiveTab('home')}
          />
        );
      case 'my_orders':
        return (
          <MyOrders
            language={language}
            onBack={() => setActiveTab('home')}
          />
        );
      case 'organizer_tools':
        return (
          <OrganizerTools
            language={language}
            onBack={() => setActiveTab('home')}
            onCreateRoom={() => setIsCreateRoomOpen(true)}
            chatRooms={chatRooms}
            initialTab={organizerToolTab}
          />
        );
      case 'all_live':
        return (
          <div className="pb-24 animate-fade-in">
            <div className="flex items-center gap-4 mb-6 sticky top-0 bg-black/80 backdrop-blur z-30 py-4 -mt-4 px-2 border-b border-gray-800">
              <button
                onClick={() => setActiveTab('home')}
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors border border-gray-700"
              >
                <ArrowLeft size={20} className="text-white" />
              </button>
              <h2 className="text-xl font-athletic tracking-wide text-white flex items-center gap-2">
                {t.liveNow}
                <span className="text-red-600 text-sm font-sans font-normal bg-red-900/20 px-2 py-0.5 rounded-full border border-red-900/50">
                  All
                </span>
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-2">
              {streamers.map((streamer, index) => (
                <StreamCard
                  key={`${streamer.id}-${index}`}
                  streamer={streamer}
                  onPress={handleOpenStream}
                />
              ))}
            </div>
          </div>
        );
      case 'home':
      default:
        return (
          <>
            {/* Fixed Sub-Tabs */}
            <div className="fixed top-16 left-0 right-0 z-30 bg-black/95 backdrop-blur-md py-1 px-2 border-b border-gray-800/50 shadow-md max-w-5xl mx-auto">
              <div className="flex bg-gray-900 rounded-xl p-1 border border-gray-800">
                <button
                  onClick={() => setHomeTab('live')}
                  className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${homeTab === 'live' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  <Video size={16} /> <span>{t.homeTabs.live}</span>
                </button>
                <button
                  onClick={() => setHomeTab('rooms')}
                  className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${homeTab === 'rooms' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  <MessageSquare size={16} /> <span>{t.homeTabs.rooms}</span>
                </button>
                <button
                  onClick={() => setHomeTab('models')}
                  className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${homeTab === 'models' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  <Users size={16} /> <span>{t.homeTabs.models}</span>
                </button>
              </div>
            </div>

            {/* Sub-tab Content */}
            <div className="pt-12 pb-6 animate-fade-in">
              {homeTab === 'live' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-2">
                  {streamers.length > 0 ? streamers.map(streamer => (
                    <StreamCard
                      key={streamer.id}
                      streamer={streamer}
                      onPress={handleOpenStream}
                    />
                  )) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
                      <Video size={48} className="mb-4 opacity-30" />
                      <p>No live streams found</p>
                    </div>
                  )}
                </div>
              )}

              {homeTab === 'rooms' && (
                <div className="space-y-3 px-2">
                  {chatRooms.length > 0 ? chatRooms.map(room => (
                    <div
                      key={room.id}
                      onClick={() => handleOpenGroup(room)}
                      className="flex items-center gap-4 px-4 py-4 bg-gray-900 border border-gray-800 rounded-2xl cursor-pointer active:scale-95 transition-all hover:border-gray-700"
                    >
                      <div className="relative">
                        <div className="w-14 h-14 rounded-xl bg-gray-800 overflow-hidden border border-gray-700">
                          <img src={room.image} className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-gray-900 rounded-full p-0.5 border border-gray-700">
                          {room.type === 'private' ? <Shield size={12} className="text-yellow-500" /> : <Globe size={12} className="text-blue-500" />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-base truncate">{room.name}</h3>
                        <p className="text-sm text-gray-500 truncate mt-0.5">{room.lastMessage}</p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                          <Users size={12} /> {room.members} Members
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400">
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                      <MessageSquare size={48} className="mb-4 opacity-30" />
                      <p>No rooms active</p>
                    </div>
                  )}
                </div>
              )}

              {homeTab === 'models' && (
                <div className="grid grid-cols-3 gap-1 px-1">
                  {people.filter(p => p.role === 'model').length > 0 ? people.filter(p => p.role === 'model').map((person) => {
                    const isLive = streamers.some(s => s.name === person.username);
                    return (
                      <div
                        key={person.id}
                        onClick={() => { setSelectedPerson(person); setActiveTab('people'); }}
                        className="relative aspect-[9/16] bg-gray-900 cursor-pointer overflow-hidden rounded-lg"
                      >
                        <img
                          src={person.avatar}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                          alt={person.username}
                        />

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90"></div>

                        {/* Badge */}
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-lg z-10 bg-white">
                          <BicepsFlexed size={12} className="text-black" strokeWidth={3} />
                        </div>

                        {/* Online/Live Status */}
                        {isLive ? (
                          <div className="absolute top-2 left-2 bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 z-20 shadow-md animate-pulse">
                            <span className="w-1.5 h-1.5 bg-white rounded-full"></span> LIVE
                          </div>
                        ) : person.isOnline ? (
                          <div className="absolute top-2 left-2 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black shadow-[0_0_8px_rgba(34,197,94,0.8)] z-10 animate-pulse"></div>
                        ) : null}

                        {/* Info */}
                        <div className="absolute bottom-2 left-2 right-2">
                          <span className="text-xs font-bold text-white truncate block">
                            {person.username}
                          </span>
                          <span className="text-xs text-gray-400 block">
                            {person.followers} Followers
                          </span>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
                      <Users size={48} className="mb-4 opacity-30" />
                      <p>No models found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        );
    }
  };

  // If loading session state
  if (loadingSession) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  // FORCE LOGIN
  if (!session) {
    return <AuthPage language={language} onLanguageChange={setLanguage} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-gray-800 text-white font-sans selection:bg-red-500 selection:text-white overflow-hidden">

      {/* Side Menu (Same as before) */}
      <div
        className={`fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMenuOpen(false)}
      />
      <div className={`fixed top-0 left-0 bottom-0 w-[80%] max-w-sm z-[60] bg-gray-900 border-r border-gray-800 shadow-2xl transform transition-transform duration-300 ease-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
          <div className="p-6 pt-12 border-b border-gray-800 bg-gradient-to-b from-black to-gray-900">
            <button onClick={() => setIsMenuOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24} /></button>

            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className={`w-16 h-16 rounded-full p-[2px] ${userProfile.role === 'organizer' ? 'bg-gradient-to-tr from-yellow-300 via-yellow-500 to-yellow-700 shadow-lg shadow-yellow-900/50' :
                  userProfile.role === 'model' ? 'bg-gradient-to-tr from-blue-400 via-blue-600 to-blue-800 shadow-lg shadow-blue-900/50' :
                    'bg-gradient-to-tr from-gray-600 to-gray-400'
                  }`}>
                  <img src={userProfile.avatar} className="w-full h-full rounded-full border-2 border-black object-cover" alt="Profile" />
                </div>
              </div>

              <div className="flex flex-col">
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md w-fit mb-1 border ${userProfile.role === 'organizer' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' :
                  userProfile.role === 'model' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                    'bg-gray-800 border-gray-700 text-gray-400'
                  }`}>
                  {userProfile.role === 'organizer' && <Crown size={10} className="fill-current" />}
                  {userProfile.role === 'model' && <BicepsFlexed size={10} />}
                  {userProfile.role === 'supporter' && <User size={10} />}
                  <span className="text-[9px] font-bold uppercase tracking-wider leading-none pt-0.5">{t.roles[userProfile.role]}</span>
                </div>

                <h2 className="text-xl font-athletic tracking-wide text-white leading-tight">{userProfile.username}</h2>

                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center text-yellow-400 text-xs font-bold">
                    <Wallet size={12} className="mr-1" />
                    {walletBalance.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-gray-500">|</span>
                  <span className="text-[10px] text-gray-500">{t.memberSince}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center mt-4 bg-gray-800 rounded-lg p-1 w-fit">
              <button onClick={() => setLanguage('th')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${language === 'th' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>TH</button>
              <button onClick={() => setLanguage('en')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${language === 'en' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>EN</button>
            </div>
          </div>

          {/* Roles Upgrade Section */}
          <div className="px-4 mt-4 mb-2 grid grid-cols-2 gap-3">
            {userProfile.role !== 'organizer' && (
              <button onClick={() => { setIsUpgradeModalOpen(true); setIsMenuOpen(false); }} className="relative overflow-hidden rounded-xl p-3 bg-gradient-to-br from-yellow-900/40 to-black border border-yellow-600/30 flex flex-col items-center text-center group transition-all hover:border-yellow-500 active:scale-95">
                <div className="absolute inset-0 bg-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 mb-2 group-hover:scale-110 transition-transform">
                  <Crown size={16} />
                </div>
                <span className="text-[10px] text-yellow-500 uppercase font-bold tracking-wider mb-0.5">{t.roles.organizer}</span>
                <span className="text-xs text-white font-bold">{t.applyNow}</span>
              </button>
            )}

            {userProfile.role !== 'model' && (
              <button
                onClick={userProfile.modelApplicationStatus === 'pending' ? undefined : handleOpenModelApplication}
                className={`relative overflow-hidden rounded-xl p-3 bg-gradient-to-br border flex flex-col items-center text-center group transition-all ${userProfile.modelApplicationStatus === 'pending'
                  ? 'from-gray-800 to-black border-gray-700 cursor-not-allowed opacity-80'
                  : 'from-blue-900/40 to-black border-blue-600/30 hover:border-blue-500 active:scale-95'
                  }`}
              >
                {userProfile.modelApplicationStatus !== 'pending' && (
                  <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                )}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-transform ${userProfile.modelApplicationStatus === 'pending'
                  ? 'bg-yellow-500/20 text-yellow-500'
                  : 'bg-blue-500/20 text-blue-500 group-hover:scale-110'
                  }`}>
                  {userProfile.modelApplicationStatus === 'pending' ? <Clock size={16} /> : <BicepsFlexed size={16} />}
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-wider mb-0.5 ${userProfile.modelApplicationStatus === 'pending' ? 'text-yellow-500' : 'text-blue-500'
                  }`}>{t.roles.model}</span>
                <span className={`text-xs font-bold ${userProfile.modelApplicationStatus === 'pending' ? 'text-yellow-100' : 'text-white'
                  }`}>
                  {userProfile.modelApplicationStatus === 'pending' ? t.pendingApproval : t.applyNow}
                </span>
              </button>
            )}
          </div>

          <div className="flex-1 py-4">

            {/* Organizer Tools */}
            {userProfile.role === 'organizer' && (
              <div className="mb-4">
                <div className="px-6 py-2 mt-2 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <Shield size={12} className="text-yellow-500" /> {t.organizerTools}
                </div>
                <button onClick={() => handleOrganizerToolClick('create')} className="w-full flex items-center justify-between px-6 py-3 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-red-900/30 border border-red-500/50 flex items-center justify-center group-hover:bg-red-600 transition-colors">
                      <Plus size={18} className="text-red-500 group-hover:text-white" />
                    </div>
                    <span className="font-medium text-base text-gray-200 group-hover:text-white">{t.createRoom}</span>
                  </div>
                </button>
                <button onClick={() => handleOrganizerToolClick('list')} className="w-full flex items-center justify-between px-6 py-3 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 transition-colors">
                      <List size={18} className="text-gray-400 group-hover:text-white" />
                    </div>
                    <span className="font-medium text-base text-gray-200 group-hover:text-white">{t.roomList}</span>
                  </div>
                </button>
                <button onClick={() => handleOrganizerToolClick('members')} className="w-full flex items-center justify-between px-6 py-3 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 transition-colors">
                      <UserCog size={18} className="text-gray-400 group-hover:text-white" />
                    </div>
                    <span className="font-medium text-base text-gray-200 group-hover:text-white">{t.manageMembers}</span>
                  </div>
                </button>
                <div className="h-px bg-gray-800 mx-6 my-2"></div>
              </div>
            )}

            {/* Model Tools */}
            {userProfile.role === 'model' && (
              <div className="mb-4">
                <div className="px-6 py-2 mt-2 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <BicepsFlexed size={12} className="text-blue-500" /> Model Tools
                </div>
                <button onClick={() => { setActiveTab('my_products'); setIsMenuOpen(false); }} className="w-full flex items-center justify-between px-6 py-3 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-blue-900/30 border border-blue-500/50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                      <Box size={18} className="text-blue-500 group-hover:text-white" />
                    </div>
                    <span className="font-medium text-base text-gray-200 group-hover:text-white">{t.myProducts}</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-600 group-hover:text-white" />
                </button>
                <button onClick={() => { setActiveTab('my_rate'); setIsMenuOpen(false); }} className="w-full flex items-center justify-between px-6 py-3 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-blue-900/30 border border-blue-500/50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                      <Banknote size={18} className="text-blue-500 group-hover:text-white" />
                    </div>
                    <span className="font-medium text-base text-gray-200 group-hover:text-white">{t.myRate}</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-600 group-hover:text-white" />
                </button>
                <button onClick={() => { setActiveTab('my_schedule'); setIsMenuOpen(false); }} className="w-full flex items-center justify-between px-6 py-3 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-blue-900/30 border border-blue-500/50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                      <Calendar size={18} className="text-blue-500 group-hover:text-white" />
                    </div>
                    <span className="font-medium text-base text-gray-200 group-hover:text-white">{t.mySchedule}</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-600 group-hover:text-white" />
                </button>
                <div className="h-px bg-gray-800 mx-6 my-2"></div>
              </div>
            )}

            {/* Menu Items */}
            {menuItems.map((item, index) => (
              <button key={index} onClick={() => handleMenuClick(item.id)} className="w-full flex items-center justify-between px-6 py-3.5 hover:bg-white/5 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-red-600 transition-colors">
                    <item.icon size={20} className="text-white" />
                  </div>
                  <span className="font-medium text-lg text-gray-200 group-hover:text-white">{item.label}</span>
                </div>
                <ChevronRight size={18} className="text-gray-600 group-hover:text-white" />
              </button>
            ))}
          </div>

          <div className="p-6 border-t border-gray-800 bg-black/20">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all font-bold">
              <LogOut size={20} /><span>{t.logout}</span>
            </button>
            <p className="text-center text-[10px] text-gray-600 mt-4 uppercase tracking-widest">Version 1.0.3</p>
          </div>
        </div>
      </div>

      {/* FIXED TOP NAV BAR */}
      {showTopNav && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-md px-4 py-3 border-b border-gray-800 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMenuOpen(true)} className="active:scale-90 transition-transform">
              <Menu className="text-white" size={24} />
            </button>
            <h1 className="text-lg font-athletic text-white tracking-wider">UNDERWEAR<span className="text-red-600">LIVE</span></h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsWalletOpen(true)}
              className="flex items-center gap-1.5 bg-gray-800 rounded-full pl-2 pr-3 py-1 border border-gray-700 hover:border-yellow-500 transition-colors active:scale-95"
            >
              <Coins size={16} className="text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-bold text-white font-athletic">{walletBalance.toLocaleString()}</span>
            </button>

            <button className="relative p-1 hover:text-gray-300 transition-colors">
              <Bell size={22} className="text-white" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-black animate-pulse"></span>
            </button>

            <button onClick={() => setActiveTab('messages')} className="relative p-1 hover:text-gray-300 transition-colors">
              <MessageCircle size={22} className="text-white" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-black"></span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`h-full overflow-y-auto no-scrollbar ${showTopNav ? 'pt-[64px]' : ''} ${showBottomNav ? 'pb-[80px]' : ''}`}>
        {renderContent()}
      </div>

      {/* FIXED BOTTOM NAV BAR */}
      {showBottomNav && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-lg border-t border-gray-800 px-2 py-2 flex justify-around items-end pb-safe">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex-1 flex flex-col items-center gap-1 transition-all duration-200 active:scale-90 ${activeTab === 'home' ? 'text-red-600' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">{t.home}</span>
          </button>

          <button
            onClick={() => setActiveTab('discover')}
            className={`flex-1 flex flex-col items-center gap-1 transition-all duration-200 active:scale-90 ${activeTab === 'discover' ? 'text-red-600' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Compass size={24} strokeWidth={activeTab === 'discover' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">{t.discover}</span>
          </button>

          <div className="flex-1 flex justify-center -mt-6">
            <button
              onClick={handlePlusClick}
              className="w-14 h-14 bg-gradient-to-tr from-red-600 to-red-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-900/50 border-4 border-black active:scale-95 transition-transform"
            >
              <Plus size={28} strokeWidth={3} />
            </button>
          </div>

          <button
            onClick={() => setActiveTab('people')}
            className={`flex-1 flex flex-col items-center gap-1 transition-all duration-200 active:scale-90 ${activeTab === 'people' ? 'text-red-600' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Users size={24} strokeWidth={activeTab === 'people' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">{t.people}</span>
          </button>

          <button
            onClick={() => setActiveTab('cart')}
            className={`flex-1 flex flex-col items-center gap-1 relative transition-all duration-200 active:scale-90 ${activeTab === 'cart' ? 'text-red-600' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <div className="relative">
              <ShoppingCart size={24} strokeWidth={activeTab === 'cart' ? 2.5 : 2} />
              {cartItems.length > 0 && <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[9px] min-w-[16px] h-4 rounded-full flex items-center justify-center font-bold px-1 border border-black">{cartItems.length}</span>}
            </div>
            <span className="text-[10px] font-bold">{t.cart}</span>
          </button>
        </div>
      )}

      {/* Overlays / Modals */}
      {currentStreamer && (
        <LiveRoom
          streamer={currentStreamer}
          onClose={handleCloseStream}
          language={language}
          walletBalance={walletBalance}
          onUseCoins={handleUseCoins}
          onOpenWallet={() => setIsWalletOpen(true)}
          onAddToCart={handleAddToCart}
        />
      )}

      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        balance={walletBalance}
        onTopUp={handleTopUp}
        language={language}
      />

      <LiveSelectionModal
        isOpen={isLiveSelectionOpen}
        onClose={() => setIsLiveSelectionOpen(false)}
        onSelect={handleLiveTypeSelect}
        language={language}
      />

      <LiveProductSelectionModal
        isOpen={isProductSelectionOpen}
        onClose={() => setIsProductSelectionOpen(false)}
        products={myProducts}
        onConfirm={handleProductSelectionConfirm}
        onAddProductRedirect={handleAddProductRedirect}
        language={language}
        selectionMode={selectionMode}
      />

      <LiveAuctionSetupModal
        isOpen={isAuctionSetupOpen}
        onClose={() => setIsAuctionSetupOpen(false)}
        onConfirm={handleAuctionSetupConfirm}
        language={language}
        product={auctionSelectedProduct}
      />

      <UpgradeOrganizerModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        language={language}
        walletBalance={walletBalance}
        onConfirmUpgrade={handleConfirmUpgrade}
        onTopUpRedirect={() => { setIsUpgradeModalOpen(false); setIsWalletOpen(true); }}
      />

      <ModelApplicationModal
        isOpen={isModelApplicationOpen}
        onClose={() => setIsModelApplicationOpen(false)}
        onSubmit={handleSubmitModelApplication}
        language={language}
      />

      <CreateRoomModal
        isOpen={isCreateRoomOpen}
        language={language}
        onClose={() => setIsCreateRoomOpen(false)}
        onCreate={handleCreateRoom}
        username={userProfile.username}
      />

      {isStartLiveModalOpen && (
        <StartLiveModal
          language={language}
          onClose={() => setIsStartLiveModalOpen(false)}
          onStart={handleStartStream}
        />
      )}

      <UpdatePasswordModal
        isOpen={isUpdatePasswordOpen}
        onClose={() => setIsUpdatePasswordOpen(false)}
        language={language}
      />

      <CountdownOverlay
        count={countdownValue}
        isActive={isCountdownActive}
        language={language}
      />

    </div>
  );
};

export default App;
