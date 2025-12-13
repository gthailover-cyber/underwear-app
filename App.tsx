
import React, { useState } from 'react';
import { MessageCircle, Bell, Menu, Plus, Home, Compass, ShoppingCart, User, MapPin, CreditCard, Wallet, LogOut, ChevronRight, X, Globe, Coins, ArrowLeft } from 'lucide-react';
import StreamCard from './components/StreamCard';
import LiveRoom from './components/LiveRoom';
import WalletModal from './components/WalletModal';
import Discover from './components/Discover';
import Cart from './components/Cart';
import Profile from './components/Profile';
import EditProfile from './components/EditProfile';
import EditGallery from './components/EditGallery';
import Messages from './components/Messages';
import ChatDetail from './components/ChatDetail';
import { MOCK_STREAMERS, TRANSLATIONS, MOCK_PRODUCTS, MOCK_USER_PROFILE } from './constants';
import { Streamer, Language, CartItem, UserProfile, MessagePreview } from './types';

const App: React.FC = () => {
  const [currentStreamer, setCurrentStreamer] = useState<Streamer | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [language, setLanguage] = useState<Language>('th');
  const [activeTab, setActiveTab] = useState<'home' | 'discover' | 'cart' | 'profile' | 'all_live' | 'messages'>('home');
  const [selectedChatUser, setSelectedChatUser] = useState<MessagePreview | null>(null);
  
  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>(MOCK_USER_PROFILE);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingGallery, setIsEditingGallery] = useState(false);

  // Wallet State
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(150); // Default balance

  // Cart State (Initialize with some mock items for demo)
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { ...MOCK_PRODUCTS[0], quantity: 1, size: 'M' },
    { ...MOCK_PRODUCTS[2], quantity: 2, size: 'L' }
  ]);

  const t = TRANSLATIONS[language];

  const handleOpenStream = (streamer: Streamer) => {
    setCurrentStreamer(streamer);
  };

  const handleCloseStream = () => {
    setCurrentStreamer(null);
  };

  const handleTopUp = (amount: number) => {
    setWalletBalance(prev => prev + amount);
  };

  const handleSaveProfile = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
    setIsEditingProfile(false);
  };

  const handleSaveGallery = (newGallery: string[]) => {
    setUserProfile(prev => ({ ...prev, gallery: newGallery }));
    setIsEditingGallery(false);
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

  const handleCheckout = () => {
    // Determine Total
    const total = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    if (walletBalance >= total) {
      // Success Logic (Mock)
      alert(`Checkout Successful! -${total} Coins`);
      setWalletBalance(prev => prev - total);
      setCartItems([]); // Clear Cart
    } else {
      // Insufficient Funds
      alert('Insufficient Balance. Please Top Up.');
      setIsWalletOpen(true);
    }
  };

  const menuItems = [
    { id: 'address', icon: MapPin, label: t.myAddress },
    { id: 'payment', icon: CreditCard, label: t.myPayment },
    { id: 'wallet', icon: Wallet, label: t.myWallet },
  ];

  const handleMenuClick = (id: string) => {
    if (id === 'wallet') {
      setIsWalletOpen(true);
      setIsMenuOpen(false); // Close menu when opening wallet
    }
  };

  // Chat Navigation Logic
  const handleOpenChat = (user: MessagePreview) => {
    setSelectedChatUser(user);
  };

  const handleCloseChat = () => {
    setSelectedChatUser(null);
  };

  // --- Render Content based on Active Tab ---
  const renderContent = () => {
    // If Chat Detail is open, it overrides the Messages tab content
    if (activeTab === 'messages' && selectedChatUser) {
      return (
        <ChatDetail 
          user={selectedChatUser}
          language={language}
          onBack={handleCloseChat}
          onOpenStream={handleOpenStream}
        />
      );
    }

    switch (activeTab) {
      case 'messages':
        return (
          <Messages 
            language={language}
            onBack={() => setActiveTab('home')}
            onOpenChat={handleOpenChat}
          />
        );
      case 'discover':
        return (
          <Discover 
            language={language} 
            onOpenStream={handleOpenStream} 
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
          />
        );
      case 'all_live':
        return (
          <div className="pb-24 animate-fade-in">
             {/* Sticky Header for All Live */}
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

             {/* Full Grid */}
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-2">
               {/* Displaying Mock Data (Doubled to simulate more content) */}
               {[...MOCK_STREAMERS, ...MOCK_STREAMERS].map((streamer, index) => (
                 <StreamCard 
                   key={`${streamer.id}-${index}`} 
                   streamer={{...streamer, id: `${streamer.id}-${index}`}} // Unique ID for key
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
             {/* Categories / Tags */}
            <div className="flex overflow-x-auto gap-3 pb-6 no-scrollbar">
               {t.tags.map((tag, i) => (
                 <button 
                   key={tag} 
                   className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${i === 0 ? 'bg-white text-black' : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-gray-500'}`}
                 >
                   {tag}
                 </button>
               ))}
            </div>

            {/* Live Grid */}
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-bold flex items-center">
                 <span className="w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse"></span>
                 {t.liveNow}
               </h3>
               <button 
                  onClick={() => setActiveTab('all_live')}
                  className="text-xs text-gray-400 font-medium hover:text-white transition-colors"
               >
                  {t.viewAll}
               </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-10">
              {MOCK_STREAMERS.map(streamer => (
                <StreamCard 
                  key={streamer.id} 
                  streamer={streamer} 
                  onPress={handleOpenStream} 
                />
              ))}
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-gray-800 text-white font-sans selection:bg-red-500 selection:text-white overflow-hidden">
      
      {/* --- Side Menu Drawer --- */}
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMenuOpen(false)}
      />
      
      {/* Drawer Panel */}
      <div className={`fixed top-0 left-0 bottom-0 w-[80%] max-w-sm z-50 bg-gray-900 border-r border-gray-800 shadow-2xl transform transition-transform duration-300 ease-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Menu Header */}
          <div className="p-6 pt-12 border-b border-gray-800 bg-gradient-to-b from-black to-gray-900">
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 to-red-500">
                <img src={userProfile.avatar} className="w-full h-full rounded-full border-2 border-black" alt="Profile" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-athletic tracking-wide">{userProfile.username}</h2>
                <span className="text-xs text-gray-400">{t.memberSince}</span>
                <div className="mt-1 flex items-center text-yellow-400 text-xs font-bold">
                  <Wallet size={12} className="mr-1" />
                  {walletBalance.toLocaleString()} Coins
                </div>
              </div>
            </div>
            
            {/* Language Switcher in Header */}
            <div className="flex items-center mt-4 bg-gray-800 rounded-lg p-1 w-fit">
               <button 
                 onClick={() => setLanguage('th')}
                 className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${language === 'th' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
               >
                 TH
               </button>
               <button 
                 onClick={() => setLanguage('en')}
                 className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${language === 'en' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
               >
                 EN
               </button>
            </div>
          </div>

          {/* Menu Items */}
          <div className="flex-1 py-4">
            {menuItems.map((item, index) => (
              <button 
                key={index}
                onClick={() => handleMenuClick(item.id)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors group"
              >
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

          {/* Footer / Logout */}
          <div className="p-6 border-t border-gray-800 bg-black/20">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all font-bold">
              <LogOut size={20} />
              <span>{t.logout}</span>
            </button>
            <p className="text-center text-[10px] text-gray-600 mt-4 uppercase tracking-widest">
              Version 1.0.2
            </p>
          </div>
        </div>
      </div>

      {/* --- Wallet Modal --- */}
      <WalletModal 
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        balance={walletBalance}
        onTopUp={handleTopUp}
        language={language}
      />


      {/* --- Main View --- */}
      <div className={`transition-all duration-300 ${currentStreamer ? 'scale-95 opacity-0 pointer-events-none hidden' : 'scale-100 opacity-100'}`}>
        
        {/* Fixed Header */}
        {activeTab !== 'messages' && activeTab !== 'all_live' && (
          <header className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md px-4 h-16 flex items-center justify-between border-b border-gray-800 shadow-lg shadow-black/50">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsMenuOpen(true)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <Menu size={24} className="text-white" />
              </button>
              <h1 className="text-2xl font-athletic italic tracking-wider text-white">
                UNDERWEAR<span className="text-red-600">LIVE</span>
              </h1>
            </div>
            <div className="flex items-center gap-1">
              
              {/* Wallet Display Button */}
              <button 
                onClick={() => setIsWalletOpen(true)}
                className="flex items-center gap-1 mr-1 bg-gray-800/50 backdrop-blur border border-yellow-500/30 rounded-full pl-2 pr-2.5 py-1 hover:bg-gray-700 transition-colors active:scale-95"
              >
                <Coins size={13} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-bold text-yellow-400 leading-none pt-0.5">{walletBalance.toLocaleString()}</span>
              </button>

              <button 
                onClick={() => setActiveTab('messages')}
                className="hover:bg-gray-800 p-2 rounded-full transition-colors relative"
              >
                <MessageCircle size={20} className="text-gray-300" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-black"></span>
              </button>
              <button className="relative hover:bg-gray-800 p-2 rounded-full transition-colors">
                <Bell size={20} className="text-gray-300" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </header>
        )}

        {/* Main Scrollable Content */}
        <main className={`${(activeTab === 'messages' || activeTab === 'all_live') ? 'pt-0 p-0 h-screen overflow-hidden' : 'pt-20 p-4 pb-24 h-screen overflow-y-auto no-scrollbar'} max-w-5xl mx-auto`}>
          {renderContent()}
        </main>
        
        {/* Fixed Bottom Nav */}
        {(activeTab !== 'messages') && (
          <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur border-t border-gray-800 py-3 px-6 flex justify-between items-center z-40 md:hidden pb-safe shadow-[0_-5px_10px_rgba(0,0,0,0.5)]">
             <button 
               onClick={() => setActiveTab('home')}
               className={`flex flex-col items-center gap-1 ${activeTab === 'home' || activeTab === 'all_live' ? 'text-red-500' : 'text-gray-500 hover:text-gray-300'}`}
             >
               <Home size={24} />
               <span className="text-[10px] font-medium">{t.home}</span>
             </button>
             
             <button 
               onClick={() => setActiveTab('discover')}
               className={`flex flex-col items-center gap-1 ${activeTab === 'discover' ? 'text-red-500' : 'text-gray-500 hover:text-gray-300'}`}
             >
               <Compass size={24} />
               <span className="text-[10px] font-medium">{t.discover}</span>
             </button>
             
             <div className="w-12 h-12 bg-red-600 rounded-full -mt-8 flex items-center justify-center border-4 border-black shadow-lg shadow-red-900/50 cursor-pointer hover:bg-red-700 transition-colors">
                <Plus size={24} color="white" />
             </div>
             
             <button 
               onClick={() => setActiveTab('cart')}
               className={`flex flex-col items-center gap-1 relative ${activeTab === 'cart' ? 'text-red-500' : 'text-gray-500 hover:text-gray-300'}`}
             >
               <ShoppingCart size={24} />
               <span className="text-[10px] font-medium">{t.cart}</span>
               {cartItems.length > 0 && (
                 <span className="absolute -top-1 right-2 w-4 h-4 bg-red-600 border border-black text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                   {cartItems.length}
                 </span>
               )}
             </button>
             
             <button 
               onClick={() => setActiveTab('profile')}
               className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-red-500' : 'text-gray-500 hover:text-gray-300'}`}
             >
               <User size={24} />
               <span className="text-[10px] font-medium">{t.profile}</span>
             </button>
          </nav>
        )}
      </div>

      {/* --- Live Room Overlay --- */}
      {currentStreamer && (
        <LiveRoom 
          streamer={currentStreamer} 
          onClose={handleCloseStream}
          language={language}
        />
      )}
    </div>
  );
};

export default App;
