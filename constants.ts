
import { Streamer, Product, Language, UserProfile, MessagePreview, ChatMessage } from './types';

export const TRANSLATIONS = {
  en: {
    menuTitle: 'Menu',
    myAddress: 'My Address',
    myPayment: 'My Payment',
    myWallet: 'My Wallet',
    myProducts: 'My Products',
    logout: 'Log Out',
    home: 'Home',
    discover: 'Discover',
    cart: 'Cart',
    profile: 'Profile',
    liveNow: 'Live Now',
    viewAll: 'View All',
    follow: 'FOLLOW',
    watching: 'watching',
    saySomething: 'Say something...',
    shopItems: 'Shop Items',
    buyNow: 'BUY NOW',
    stock: 'Stock',
    sold: 'Sold',
    remaining: 'Remaining',
    products: 'Products',
    memberSince: 'Member since 2024',
    tags: ['All', 'Hot 🔥', 'New Arrival', 'Sale', 'Briefs', 'Boxers', 'Jockstraps'],
    // Wallet Translations
    wallet: 'Wallet',
    currentBalance: 'Current Balance',
    topUp: 'Top Up',
    coins: 'Coins',
    selectAmount: 'Select Amount',
    paymentMethod: 'Payment Method',
    creditDebit: 'Credit / Debit Card',
    truemoney: 'TrueMoney Wallet',
    payNow: 'Pay Now',
    processing: 'Processing...',
    paymentSuccess: 'Payment Successful!',
    exchangeRate: '1 Baht = 1 Coin',
    // Discover Translations
    featured: 'Featured',
    trendingNow: 'Trending Now',
    hotLive: 'Hot Live 🔥',
    recommended: 'Recommended Lives',
    shopCollection: 'Watch Live',
    categories: {
      new: 'New Live',
      sale: 'Flash Sale',
      bundle: 'Big Lot',
      premium: 'Premium'
    },
    // Cart Translations
    myCart: 'My Cart',
    items: 'items',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    total: 'Total',
    checkout: 'CHECKOUT',
    emptyCart: 'Your cart is empty',
    startShopping: 'Start Shopping',
    free: 'Free',
    remove: 'Remove',
    // Profile Translations
    editProfile: 'Edit Profile',
    editGallery: 'Edit Gallery',
    editGalleryTitle: 'Manage Gallery',
    uploadImage: 'Upload Image',
    age: 'Age',
    height: 'Height',
    weight: 'Weight',
    favorites: 'My Preferences',
    gallery: 'My Gallery',
    location: 'Location',
    aboutMe: 'About Me',
    cm: 'cm',
    kg: 'kg',
    years: 'y/o',
    save: 'Save',
    cancel: 'Cancel',
    username: 'Username',
    changeCover: 'Change Cover',
    changeAvatar: 'Change Avatar',
    addTag: 'Add Tag',
    enterTagPlaceholder: 'Ex. Briefs, Jockstrap...',
    // Messages
    messages: 'Messages',
    searchMessages: 'Search messages...',
    noMessages: 'No messages yet',
    typeMessage: 'Type a message...',
    watchLive: 'Watch Live',
    // End Live
    endLiveTitle: 'End Live Stream?',
    endLiveDesc: 'Are you sure you want to stop streaming?',
    confirmEnd: 'End Now',
    // Live Selection
    liveSelectionTitle: 'Select Live Type',
    liveSelling: 'Live Selling',
    liveSellingDesc: 'Sell products directly to viewers',
    liveAuction: 'Live Auction',
    liveAuctionDesc: 'Bid and win rare items',
    // My Products
    addProduct: 'Add Product',
    editProduct: 'Edit Product',
    productName: 'Product Name',
    price: 'Price',
    description: 'Description',
    colors: 'Colors',
    sizes: 'Sizes',
    deleteConfirm: 'Delete this product?',
    manageStock: 'Manage Stock',
    // Live Product Selection
    selectProductsTitle: 'Select Products for Live',
    noProductsFound: 'No Products Found',
    pleaseAddProduct: 'You need to add products before starting a live sale.',
    goToAddProduct: 'Go to Add Product',
    startLive: 'Start Live',
    selected: 'Selected',
    readyToLive: 'Ready to Live',
    startingIn: 'Starting in',
    // Auction Setup
    auctionSetupTitle: 'Auction Setup',
    duration: 'Duration',
    startingPrice: 'Starting Price',
    startAuction: 'Start Auction',
    min: 'min',
    hour: 'hour',
    hours: 'hours',
    // Auction UI
    currentBid: 'Current Bid',
    topBidder: 'Top Bidder',
    placeBid: 'PLACE BID',
    yourBid: 'Your Bid',
    bidSuccess: 'Bid Placed!',
    bidTooLow: 'Bid too low'
  },
  th: {
    menuTitle: 'เมนู',
    myAddress: 'ที่อยู่ของฉัน',
    myPayment: 'ช่องทางการชำระเงิน',
    myWallet: 'กระเป๋าเงิน',
    myProducts: 'สินค้าของฉัน',
    logout: 'ออกจากระบบ',
    home: 'หน้าหลัก',
    discover: 'ค้นพบ',
    cart: 'รถเข็น',
    profile: 'โปรไฟล์',
    liveNow: 'ไลฟ์สด',
    viewAll: 'ดูทั้งหมด',
    follow: 'ติดตาม',
    watching: 'คนดู',
    saySomething: 'พูดคุย...',
    shopItems: 'สินค้าในร้าน',
    buyNow: 'ซื้อเลย',
    stock: 'คงเหลือ',
    sold: 'ขายแล้ว',
    remaining: 'เหลือ',
    products: 'สินค้า',
    memberSince: 'สมาชิกตั้งแต่ 2024',
    tags: ['ทั้งหมด', 'มาแรง 🔥', 'สินค้าใหม่', 'ลดราคา', 'กางเกงใน', 'บ็อกเซอร์', 'จ็อกสแตรป'],
    // Wallet Translations
    wallet: 'กระเป๋าเงิน',
    currentBalance: 'ยอดเงินคงเหลือ',
    topUp: 'เติมเงิน',
    coins: 'เหรียญ',
    selectAmount: 'เลือกจำนวน',
    paymentMethod: 'ช่องทางชำระเงิน',
    creditDebit: 'บัตรเครดิต / เดบิต',
    truemoney: 'ทรูมันนี่ วอลเล็ท',
    payNow: 'ชำระเงิน',
    processing: 'กำลังดำเนินการ...',
    paymentSuccess: 'ชำระเงินสำเร็จ!',
    exchangeRate: '1 บาท = 1 เหรียญ',
    // Discover Translations
    featured: 'แนะนำ',
    trendingNow: 'กำลังมาแรง',
    hotLive: 'ไลฟ์ยอดฮิต 🔥',
    recommended: 'ไลฟ์แนะนำ',
    shopCollection: 'ชมไลฟ์',
    categories: {
      new: 'ไลฟ์ใหม่',
      sale: 'ลดกระหน่ำ',
      bundle: 'เหมาโหล',
      premium: 'พรีเมียม'
    },
    // Cart Translations
    myCart: 'รถเข็นของฉัน',
    items: 'รายการ',
    subtotal: 'ยอดรวมสินค้า',
    shipping: 'ค่าจัดส่ง',
    total: 'ยอดรวมทั้งสิ้น',
    checkout: 'ชำระเงิน',
    emptyCart: 'ไม่มีสินค้าในรถเข็น',
    startShopping: 'เริ่มช้อปปิ้ง',
    free: 'ฟรี',
    remove: 'ลบ',
    // Profile Translations
    editProfile: 'แก้ไขโปรไฟล์',
    editGallery: 'แก้ไขแกลเลอรี่',
    editGalleryTitle: 'จัดการแกลเลอรี่',
    uploadImage: 'อัปโหลดรูปภาพ',
    age: 'อายุ',
    height: 'ส่วนสูง',
    weight: 'น้ำหนัก',
    favorites: 'ความชอบ',
    gallery: 'แกลเลอรี่ของฉัน',
    location: 'ที่อยู่',
    aboutMe: 'เกี่ยวกับฉัน',
    cm: 'ซม.',
    kg: 'กก.',
    years: 'ปี',
    save: 'บันทึก',
    cancel: 'ยกเลิก',
    username: 'ชื่อผู้ใช้',
    changeCover: 'เปลี่ยนรูปปก',
    changeAvatar: 'เปลี่ยนรูปโปรไฟล์',
    addTag: 'เพิ่มแท็ก',
    enterTagPlaceholder: 'เช่น บ็อกเซอร์, จ็อกสแตรป...',
    // Messages
    messages: 'ข้อความ',
    searchMessages: 'ค้นหาข้อความ...',
    noMessages: 'ไม่มีข้อความ',
    typeMessage: 'พิมพ์ข้อความ...',
    watchLive: 'ดูไลฟ์',
    // End Live
    endLiveTitle: 'จบการไลฟ์?',
    endLiveDesc: 'คุณแน่ใจหรือไม่ว่าต้องการหยุดการถ่ายทอดสด?',
    confirmEnd: 'จบตอนนี้',
    // Live Selection
    liveSelectionTitle: 'เลือกประเภทการไลฟ์',
    liveSelling: 'ไลฟ์ขายของ',
    liveSellingDesc: 'ขายสินค้าให้กับผู้ชมโดยตรง',
    liveAuction: 'ไลฟ์ประมูล',
    liveAuctionDesc: 'ประมูลสินค้าแรร์ไอเทม',
    // My Products
    addProduct: 'เพิ่มสินค้า',
    editProduct: 'แก้ไขสินค้า',
    productName: 'ชื่อสินค้า',
    price: 'ราคา',
    description: 'รายละเอียด',
    colors: 'สี',
    sizes: 'ไซส์',
    deleteConfirm: 'ต้องการลบสินค้านี้ใช่ไหม?',
    manageStock: 'จัดการสต็อก',
    // Live Product Selection
    selectProductsTitle: 'เลือกสินค้าสำหรับไลฟ์',
    noProductsFound: 'ไม่พบสินค้า',
    pleaseAddProduct: 'คุณต้องเพิ่มสินค้าก่อนเริ่มไลฟ์ขายของ',
    goToAddProduct: 'ไปที่เพิ่มสินค้า',
    startLive: 'เริ่มไลฟ์',
    selected: 'เลือกแล้ว',
    readyToLive: 'เตรียมพร้อมไลฟ์',
    startingIn: 'เริ่มใน',
    // Auction Setup
    auctionSetupTitle: 'ตั้งค่าการประมูล',
    duration: 'ระยะเวลา',
    startingPrice: 'ราคาเริ่มต้น',
    startAuction: 'เริ่มประมูล',
    min: 'นาที',
    hour: 'ชั่วโมง',
    hours: 'ชั่วโมง',
    // Auction UI
    currentBid: 'ราคาปัจจุบัน',
    topBidder: 'ผู้ประมูลสูงสุด',
    placeBid: 'เสนอราคา',
    yourBid: 'ราคาของคุณ',
    bidSuccess: 'เสนอราคาสำเร็จ!',
    bidTooLow: 'ราคาต่ำเกินไป'
  }
};

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Classic Boxer Briefs (Black)',
    price: 350,
    image: 'https://picsum.photos/200/200?random=101',
    stock: 50,
    sold: 12,
    colors: ['#000000', '#FFFFFF', '#808080'],
    sizes: ['M', 'L', 'XL']
  },
  {
    id: 'p2',
    name: 'Seamless Trunks (Red)',
    price: 450,
    image: 'https://picsum.photos/200/200?random=102',
    stock: 20,
    sold: 5,
    colors: ['#FF0000', '#000000'],
    sizes: ['S', 'M']
  },
  {
    id: 'p3',
    name: 'Cotton Briefs Pack (White)',
    price: 990,
    image: 'https://picsum.photos/200/200?random=103',
    stock: 15,
    sold: 8,
    colors: ['#FFFFFF'],
    sizes: ['L', 'XL', 'XXL']
  },
  {
    id: 'p4',
    name: 'Sport Performance Jockstrap',
    price: 590,
    image: 'https://picsum.photos/200/200?random=104',
    stock: 10,
    sold: 2,
    colors: ['#0000FF', '#FFFF00'],
    sizes: ['M', 'L']
  }
];

// Using Mixkit free stock videos for professional demo quality
// These are direct MP4 links that work reliably
export const MOCK_STREAMERS: Streamer[] = [
  {
    id: 's1',
    name: 'Jason Model',
    title: 'Sale! Boxer Briefs 50% Off 🔥',
    viewerCount: 1540,
    coverImage: 'https://picsum.photos/400/700?random=1',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-exercising-with-gym-ropes-209-large.mp4',
    itemCount: 12,
    products: MOCK_PRODUCTS
  },
  {
    id: 's2',
    name: 'Top Form Men',
    title: 'New Collection Arrival 🕶️',
    viewerCount: 890,
    coverImage: 'https://picsum.photos/400/700?random=2',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-man-training-on-the-bars-in-the-gym-23588-large.mp4',
    itemCount: 8,
    products: [MOCK_PRODUCTS[0], MOCK_PRODUCTS[2]]
  },
  {
    id: 's3',
    name: 'Guy Next Door',
    title: 'ล้างสต็อก หมดแล้วหมดเลย 📦',
    viewerCount: 3200,
    coverImage: 'https://picsum.photos/400/700?random=3',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-doing-push-ups-in-gym-23616-large.mp4',
    itemCount: 5,
    products: [MOCK_PRODUCTS[1], MOCK_PRODUCTS[3]]
  },
  {
    id: 's4',
    name: 'Fitness Addict',
    title: 'Sport Underwear for Gym 💪',
    viewerCount: 560,
    coverImage: 'https://picsum.photos/400/700?random=4',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-athletic-man-working-out-with-heavy-ropes-23267-large.mp4',
    itemCount: 20,
    products: MOCK_PRODUCTS,
    isAuction: true,
    auctionEndTime: Date.now() + 3600000,
    auctionStartingPrice: 500,
    currentBid: 650,
    topBidder: 'GymRat99'
  }
];

export const INITIAL_COMMENTS = [
  { id: 'c1', username: 'System', message: 'Welcome to the live room!', isSystem: true, avatar: '' },
  { id: 'c2', username: 'User123', message: 'ราคาเท่าไหร่ครับ?', avatar: 'https://picsum.photos/200/200?random=50' },
  { id: 'c3', username: 'TonyStark', message: 'Looking good!', avatar: 'https://picsum.photos/200/200?random=51' },
  { id: 'c4', username: 'BKK_Boy', message: 'มีสีแดงไหมครับ?', avatar: 'https://picsum.photos/200/200?random=52' },
  { id: 'c5', username: 'Sarah_Jane', message: 'Fabulous!', avatar: 'https://picsum.photos/200/200?random=53' },
  { id: 'c6', username: 'Mike_T', message: 'Can I see the back?', avatar: 'https://picsum.photos/200/200?random=54' },
];

export const MOCK_STORIES = [
  {
    id: 'story1',
    username: 'Jason M.',
    avatar: 'https://picsum.photos/200/200?random=1',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80',
    isLive: true
  },
  {
    id: 'story2',
    username: 'Gym Rat',
    avatar: 'https://picsum.photos/200/200?random=2',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&q=80',
    isLive: false
  },
  {
    id: 'story3',
    username: 'BKK Boy',
    avatar: 'https://picsum.photos/200/200?random=3',
    image: 'https://images.unsplash.com/photo-1504194921103-f8b80cadd5e4?w=400&q=80',
    isLive: false
  },
  {
    id: 'story4',
    username: 'Underwear King',
    avatar: 'https://picsum.photos/200/200?random=4',
    image: 'https://images.unsplash.com/photo-1552160793-cbaf2bd5cf7f?w=400&q=80',
    isLive: true
  },
  {
    id: 'story5',
    username: 'Max Power',
    avatar: 'https://picsum.photos/200/200?random=5',
    image: 'https://images.unsplash.com/photo-1550993510-06f6e52c8033?w=400&q=80',
    isLive: false
  }
];

export const DISCOVER_TAGS = [
  '#Sexy', '#GymWear', '#Cotton100%', '#LimitedEdition', '#ThaiBrand', '#ModelLive'
];

export const MOCK_USER_PROFILE: UserProfile = {
  username: 'JASON STATHAM',
  avatar: 'https://picsum.photos/200/200?random=99',
  coverImage: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
  age: 28,
  height: 182,
  weight: 78,
  location: 'Bangkok, Thailand',
  bio: 'Fitness enthusiast & Underwear collector. Love gym, swimming and outdoor activities. Check out my collection!',
  favorites: ['Boxer Briefs', 'Jockstraps', 'Trunks', 'Sports Wear'],
  gallery: [
    'https://picsum.photos/300/400?random=10',
    'https://picsum.photos/300/400?random=11',
    'https://picsum.photos/300/400?random=12',
    'https://picsum.photos/300/400?random=13',
    'https://picsum.photos/300/400?random=14',
    'https://picsum.photos/300/400?random=15',
    'https://picsum.photos/300/400?random=16',
    'https://picsum.photos/300/400?random=17',
    'https://picsum.photos/300/400?random=18',
  ]
};

export const MOCK_MESSAGES: MessagePreview[] = [
  {
    id: 'm1',
    userId: 'u1',
    username: 'Jason Model',
    avatar: 'https://picsum.photos/200/200?random=1',
    lastMessage: 'ขอบคุณที่สั่งซื้อสินค้าครับ จะรีบจัดส่งให้วันนี้เลย!',
    time: '10:30',
    unread: 2,
    isOnline: true,
    isVerified: true
  },
  {
    id: 'm2',
    userId: 'u2',
    username: 'Underwear King',
    avatar: 'https://picsum.photos/200/200?random=4',
    lastMessage: 'รุ่นใหม่มาแล้วนะครับ สนใจรับเพิ่มไหม?',
    time: 'Yesterday',
    unread: 0,
    isOnline: false,
    isVerified: true
  },
  {
    id: 'm3',
    userId: 'u3',
    username: 'Customer Support',
    avatar: 'https://picsum.photos/200/200?random=50',
    lastMessage: 'Your refund request has been processed.',
    time: 'Mon',
    unread: 1,
    isOnline: true
  },
  {
    id: 'm4',
    userId: 'u4',
    username: 'Top Form Men',
    avatar: 'https://picsum.photos/200/200?random=2',
    lastMessage: '👍👍',
    time: 'Sun',
    unread: 0,
    isOnline: false
  },
  {
    id: 'm5',
    userId: 'u5',
    username: 'Gym Bro Shop',
    avatar: 'https://picsum.photos/200/200?random=8',
    lastMessage: 'มีไซส์ XL สีดำเหลือ 2 ตัวครับ',
    time: 'Last Week',
    unread: 0,
    isOnline: true
  }
];

export const MOCK_CHAT_HISTORY: ChatMessage[] = [
  { id: '1', senderId: 'u1', text: 'สวัสดีครับ สนใจกางเกงในรุ่น Classic Boxer Briefs ครับ', type: 'text', timestamp: '10:00', read: true },
  { id: '2', senderId: 'me', text: 'สวัสดีครับผม รุ่นนี้มีของพร้อมส่งครับ', type: 'text', timestamp: '10:02', read: true },
  { id: '3', senderId: 'me', text: 'รับสีดำ ไซส์ M ใช่ไหมครับ?', type: 'text', timestamp: '10:02', read: true },
  { id: '4', senderId: 'u1', text: 'ใช่ครับ', type: 'text', timestamp: '10:05', read: true },
  { 
    id: '5', 
    senderId: 'me', 
    type: 'live_share', 
    timestamp: '10:06', 
    read: true,
    sharedStreamerId: 's1',
    sharedStreamer: MOCK_STREAMERS[0]
  },
  { id: '6', senderId: 'me', text: 'ตอนนี้ผมกำลังไลฟ์สดอยู่พอดี เข้ามาดูสินค้าจริงในไลฟ์ก่อนได้นะครับ', type: 'text', timestamp: '10:06', read: true },
  { id: '7', senderId: 'u1', text: 'โอเคครับ เดี๋ยวเข้าไปดูครับ', type: 'text', timestamp: '10:08', read: true },
  { id: '8', senderId: 'me', text: 'ขอบคุณที่สั่งซื้อสินค้าครับ จะรีบจัดส่งให้วันนี้เลย!', type: 'text', timestamp: '10:30', read: false },
];
