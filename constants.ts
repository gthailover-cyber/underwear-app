
import { Streamer, Product, Language, UserProfile, MessagePreview, ChatMessage, Person, Order, ChatRoom, UserRole } from './types';

export const TRANSLATIONS = {
  en: {
    // Auth
    welcomeBack: 'Welcome Back',
    welcomeDesc: 'Sign in to continue watching and shopping.',
    createAccount: 'Create Account',
    createDesc: 'Join the community of underwear lovers.',
    email: 'Email',
    password: 'Password',
    fullName: 'Full Name',
    confirmPassword: 'Confirm Password',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    orContinueWith: 'Or continue with',
    forgotPassword: 'Forgot Password?',
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: "Already have an account?",
    loginError: 'Login failed. Please check your credentials.',
    registerError: 'Registration failed. Please try again.',
    registerSuccess: 'Registration successful! Please sign in.',
    // Forgot Password
    resetPasswordTitle: 'Reset Password',
    resetPasswordDesc: 'Enter your email to receive password reset instructions.',
    sendResetLink: 'Send Reset Link',
    backToLogin: 'Back to Login',
    resetLinkSent: 'Password reset link sent! Check your email.',
    resetError: 'Failed to send reset link. Please try again.',
    newPassword: 'New Password',
    updatePassword: 'Update Password',
    passwordUpdated: 'Password updated successfully!',
    setNewPasswordTitle: 'Set New Password',
    setNewPasswordDesc: 'Please enter your new password below.',
    // ... existing translations ...
    menuTitle: 'Menu',
    applyNow: 'Apply Now',
    myOrders: 'My Orders',
    myAddress: 'My Address',
    myPayment: 'My Payment',
    myWallet: 'My Wallet',
    myProducts: 'My Products',
    logout: 'Log Out',
    home: 'Home',
    discover: 'Discover',
    cart: 'Cart',
    profile: 'Profile',
    people: 'People',
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
    homeTabs: {
      live: 'Live Stream',
      rooms: 'Rooms',
      models: 'Models'
    },
    // Roles & Upgrade
    roles: {
      model: 'Model',
      organizer: 'Organizer',
      supporter: 'Supporter'
    },
    upgradeTitle: 'Become an Organizer',
    upgradeDesc: 'Unlock exclusive hosting features, manage larger events, and earn more revenue.',
    upgradePrice: '5,000 Coins',
    upgradeButton: 'Upgrade Now',
    insufficientForUpgrade: 'Insufficient coins. Please top up.',
    upgradeSuccess: 'Upgrade Successful! You are now an Organizer.',
    pendingApproval: 'Pending Approval',
    // Model Application
    modelAppTitle: 'Model Application',
    step1Title: 'Close-up Photo',
    step1Desc: 'Please take a clear photo of your face directly looking at the camera.',
    step2Title: 'Half-body Photo',
    step2Desc: 'Please take a photo from your waist up, showing your physique clearly.',
    cameraPermission: 'Camera access is required to take verification photos.',
    retake: 'Retake',
    usePhoto: 'Use Photo',
    submitApp: 'Submit Application',
    takingPhoto: 'Taking photo...',
    instructions: 'Instructions',
    startCamera: 'Open Camera',
    // Organizer Tools
    organizerTools: 'Organizer Tools',
    roomList: 'Room List',
    manageMembers: 'Manage Members',
    banUser: 'Ban User',
    muteUser: 'Mute',
    activeRooms: 'Active Rooms',
    totalMembers: 'Total Members',
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
    followers: 'Followers',
    following: 'Following',
    // Messages
    messages: 'Messages',
    searchMessages: 'Search...',
    noMessages: 'No messages yet',
    typeMessage: 'Type a message...',
    watchLive: 'Watch Live',
    chats: 'Chats',
    groups: 'Groups',
    createRoom: 'Create Room',
    roomName: 'Room Name',
    privacy: 'Privacy',
    public: 'Public',
    private: 'Private',
    create: 'Create',
    members: 'Members',
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
    bidTooLow: 'Bid too low',
    // Address & Payment
    addNewAddress: 'Add New Address',
    recipientName: 'Recipient Name',
    phoneNumber: 'Phone Number',
    addressDetails: 'Address Details',
    province: 'Province',
    postalCode: 'Postal Code',
    defaultAddress: 'Default',
    addNewPayment: 'Add Payment Method',
    cardNumber: 'Card Number',
    cardHolder: 'Card Holder Name',
    expiryDate: 'Expiry Date',
    cvv: 'CVV',
    linked: 'Linked',
    delete: 'Delete',
    // My Orders
    orderId: 'Order ID',
    orderDate: 'Date',
    orderTotal: 'Order Total',
    trackOrder: 'Track Order',
    writeReview: 'Write Review',
    buyAgain: 'Buy Again',
    status: {
      all: 'All',
      pending: 'To Pay',
      shipping: 'To Ship',
      delivered: 'Completed',
      cancelled: 'Cancelled'
    },
    trackingTitle: 'Delivery Status',
    trackingNumber: 'Tracking Number',
    copy: 'Copy',
    copied: 'Copied',
  },
  th: {
    // Auth
    welcomeBack: 'ยินดีต้อนรับกลับ',
    welcomeDesc: 'เข้าสู่ระบบเพื่อรับชมไลฟ์และช้อปปิ้ง',
    createAccount: 'สร้างบัญชีผู้ใช้',
    createDesc: 'เข้าร่วมคอมมูนิตี้คนรักกางเกงในชาย',
    email: 'อีเมล',
    password: 'รหัสผ่าน',
    fullName: 'ชื่อ-นามสกุล',
    confirmPassword: 'ยืนยันรหัสผ่าน',
    signIn: 'เข้าสู่ระบบ',
    signUp: 'สมัครสมาชิก',
    orContinueWith: 'หรือเข้าสู่ระบบด้วย',
    forgotPassword: 'ลืมรหัสผ่าน?',
    dontHaveAccount: "ยังไม่มีบัญชีใช่ไหม?",
    alreadyHaveAccount: "มีบัญชีอยู่แล้ว?",
    loginError: 'เข้าสู่ระบบไม่สำเร็จ โปรดตรวจสอบข้อมูล',
    registerError: 'สมัครสมาชิกไม่สำเร็จ โปรดลองใหม่',
    registerSuccess: 'สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ',
    // Forgot Password
    resetPasswordTitle: 'รีเซ็ตรหัสผ่าน',
    resetPasswordDesc: 'กรอกอีเมลของคุณเพื่อรับลิงก์ตั้งรหัสผ่านใหม่',
    sendResetLink: 'ส่งลิงก์รีเซ็ต',
    backToLogin: 'กลับไปหน้าเข้าสู่ระบบ',
    resetLinkSent: 'ส่งลิงก์รีเซ็ตเรียบร้อย! โปรดตรวจสอบอีเมล',
    resetError: 'ไม่สามารถส่งลิงก์ได้ โปรดลองอีกครั้ง',
    newPassword: 'รหัสผ่านใหม่',
    updatePassword: 'อัปเดตรหัสผ่าน',
    passwordUpdated: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว!',
    setNewPasswordTitle: 'ตั้งรหัสผ่านใหม่',
    setNewPasswordDesc: 'กรุณากรอกรหัสผ่านใหม่ของคุณด้านล่าง',
    // ... existing translations ...
    menuTitle: 'เมนู',
    applyNow: 'สมัครเลย',
    myOrders: 'รายการคำสั่งซื้อ',
    myAddress: 'ที่อยู่ของฉัน',
    myPayment: 'ช่องทางการชำระเงิน',
    myWallet: 'กระเป๋าเงิน',
    myProducts: 'สินค้าของฉัน',
    logout: 'ออกจากระบบ',
    home: 'หน้าหลัก',
    discover: 'ค้นพบ',
    cart: 'รถเข็น',
    profile: 'โปรไฟล์',
    people: 'ผู้คน',
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
    homeTabs: {
      live: 'Live สด',
      rooms: 'ห้อง',
      models: 'นายแบบ'
    },
    // Roles & Upgrade
    roles: {
      model: 'นายแบบ',
      organizer: 'ผู้จัด',
      supporter: 'ผู้สนับสนุน'
    },
    upgradeTitle: 'สมัครเป็นผู้จัด (Organizer)',
    upgradeDesc: 'ปลดล็อกฟีเจอร์การไลฟ์ขั้นสูง จัดการอีเวนต์ และสร้างรายได้ที่มากขึ้น',
    upgradePrice: '5,000 เหรียญ',
    upgradeButton: 'อัปเกรดทันที',
    insufficientForUpgrade: 'เหรียญไม่พอ กรุณาเติมเงิน',
    upgradeSuccess: 'อัปเกรดสำเร็จ! คุณเป็นผู้จัดแล้ว',
    pendingApproval: 'รออนุมัติ',
    // Model Application
    modelAppTitle: 'สมัครเป็นนายแบบ',
    step1Title: 'รูปถ่ายหน้าตรง',
    step1Desc: 'กรุณาถ่ายรูปหน้าตรง (ซูมใบหน้า) ให้เห็นใบหน้าชัดเจน',
    step2Title: 'รูปถ่ายครึ่งตัว',
    step2Desc: 'กรุณาถ่ายรูปครึ่งตัวบน ให้เห็นรูปร่างชัดเจน',
    cameraPermission: 'จำเป็นต้องใช้กล้องเพื่อถ่ายรูปยืนยันตัวตน',
    retake: 'ถ่ายใหม่',
    usePhoto: 'ใช้รูปนี้',
    submitApp: 'ส่งใบสมัคร',
    takingPhoto: 'กำลังถ่าย...',
    instructions: 'คำแนะนำ',
    startCamera: 'เปิดกล้อง',
    // Organizer Tools
    organizerTools: 'เครื่องมือผู้จัด',
    roomList: 'รายชื่อ Room',
    manageMembers: 'จัดการสมาชิก',
    banUser: 'แบนผู้ใช้',
    muteUser: 'ปิดเสียง',
    activeRooms: 'ห้องที่ใช้งานอยู่',
    totalMembers: 'สมาชิกทั้งหมด',
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
    followers: 'ผู้ติดตาม',
    following: 'กำลังติดตาม',
    // Messages
    messages: 'ข้อความ',
    searchMessages: 'ค้นหา...',
    noMessages: 'ไม่มีข้อความ',
    typeMessage: 'พิมพ์ข้อความ...',
    watchLive: 'ดูไลฟ์',
    chats: 'แชท',
    groups: 'กลุ่ม',
    createRoom: 'สร้างห้อง',
    roomName: 'ชื่อห้องแชท',
    privacy: 'ความเป็นส่วนตัว',
    public: 'สาธารณะ',
    private: 'ส่วนตัว',
    create: 'สร้าง',
    members: 'สมาชิก',
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
    bidTooLow: 'ราคาต่ำเกินไป',
    // Address & Payment
    addNewAddress: 'เพิ่มที่อยู่ใหม่',
    recipientName: 'ชื่อผู้รับ',
    phoneNumber: 'เบอร์โทรศัพท์',
    addressDetails: 'รายละเอียดที่อยู่',
    province: 'จังหวัด',
    postalCode: 'รหัสไปรษณีย์',
    defaultAddress: 'ค่าเริ่มต้น',
    addNewPayment: 'เพิ่มช่องทางชำระเงิน',
    cardNumber: 'หมายเลขบัตร',
    cardHolder: 'ชื่อผู้ถือบัตร',
    expiryDate: 'วันหมดอายุ',
    cvv: 'CVV',
    linked: 'เชื่อมต่อแล้ว',
    delete: 'ลบ',
    // My Orders
    orderId: 'หมายเลขคำสั่งซื้อ',
    orderDate: 'วันที่สั่งซื้อ',
    orderTotal: 'ยอดรวม',
    trackOrder: 'ติดตามพัสดุ',
    writeReview: 'เขียนรีวิว',
    buyAgain: 'ซื้อซ้ำ',
    status: {
      all: 'ทั้งหมด',
      pending: 'ที่ต้องชำระ',
      shipping: 'ที่ต้องจัดส่ง',
      delivered: 'สำเร็จ',
      cancelled: 'ยกเลิก'
    },
    trackingTitle: 'สถานะการจัดส่ง',
    trackingNumber: 'เลขพัสดุ',
    copy: 'คัดลอก',
    copied: 'คัดลอกแล้ว',
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

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-882910',
    items: [
      { ...MOCK_PRODUCTS[0], quantity: 2, size: 'L', color: '#000000' }
    ],
    totalPrice: 700,
    status: 'shipping',
    date: '2024-05-20',
    trackingNumber: 'TH123456789',
    timeline: [
      {
        id: 't1',
        title: 'Order Placed',
        description: 'Your order has been verified.',
        date: '20 May',
        time: '10:30',
        isCompleted: true,
        isCurrent: false
      },
      {
        id: 't2',
        title: 'Packed',
        description: 'Seller has packed your order.',
        date: '20 May',
        time: '14:00',
        isCompleted: true,
        isCurrent: false
      },
      {
        id: 't3',
        title: 'In Transit',
        description: 'Package is on the way to logistics center.',
        date: '21 May',
        time: '09:15',
        isCompleted: true,
        isCurrent: true
      },
      {
        id: 't4',
        title: 'Delivered',
        description: 'Package will be delivered to you.',
        date: 'Expected 22 May',
        time: '-',
        isCompleted: false,
        isCurrent: false
      }
    ]
  },
  {
    id: 'ORD-773122',
    items: [
      { ...MOCK_PRODUCTS[1], quantity: 1, size: 'M', color: '#FF0000' }
    ],
    totalPrice: 450,
    status: 'delivered',
    date: '2024-05-15',
    trackingNumber: 'TH987654321',
    timeline: [
      {
        id: 't1',
        title: 'Order Placed',
        description: '',
        date: '15 May',
        time: '09:00',
        isCompleted: true,
        isCurrent: false
      },
      {
        id: 't4',
        title: 'Delivered',
        description: 'Package delivered successfully.',
        date: '17 May',
        time: '13:45',
        isCompleted: true,
        isCurrent: true
      }
    ]
  },
  {
    id: 'ORD-662199',
    items: [
      { ...MOCK_PRODUCTS[3], quantity: 3, size: 'M', color: '#0000FF' }
    ],
    totalPrice: 1770,
    status: 'pending',
    date: '2024-05-21',
  }
];

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
  role: 'supporter', // Default Role
  modelApplicationStatus: 'none', // Initial status
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
  ],
  followers: 12500,
  following: 342,
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

export const MOCK_CHAT_ROOMS: ChatRoom[] = [
  {
    id: 'room1',
    name: 'Underwear Lovers Community',
    image: 'https://picsum.photos/200/200?random=301',
    type: 'public',
    hostId: 'host1',
    hostName: 'Admin Guy',
    members: 1250,
    lastMessage: 'Welcome everyone to the biggest community!',
    lastMessageTime: '10:45'
  },
  {
    id: 'room2',
    name: 'VIP Models Exclusive',
    image: 'https://picsum.photos/200/200?random=302',
    type: 'private',
    hostId: 'host2',
    hostName: 'Top Model Agency',
    members: 45,
    lastMessage: 'New casting call tomorrow.',
    lastMessageTime: 'Yesterday'
  },
  {
    id: 'room3',
    name: 'Gym & Fitness Talk',
    image: 'https://picsum.photos/200/200?random=303',
    type: 'public',
    hostId: 'host3',
    hostName: 'Fit Coach',
    members: 890,
    lastMessage: 'Best underwear for leg day?',
    lastMessageTime: '1h ago'
  }
];

export const MOCK_PEOPLE: Person[] = Array.from({ length: 24 }).map((_, i) => ({
  id: `person-${i}`,
  username: ['Alex Gym', 'TopGuy88', 'BKK Boy', 'FitAddict', 'ThaiModel', 'BoxerLvr'][i % 6] + (i > 5 ? `_${i}` : ''),
  avatar: `https://picsum.photos/200/200?random=${200 + i}`,
  isOnline: Math.random() > 0.5, // Randomized online status (approx 50% online)
  followers: Math.floor(Math.random() * 5000),
  role: (i % 6 === 0) ? 'organizer' : (i % 3 === 0) ? 'model' : 'supporter' as UserRole, // Assign random roles
}));
