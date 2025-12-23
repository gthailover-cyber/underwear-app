
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, X, User, ExternalLink, MapPin, Camera, Scan, Save, RefreshCw } from 'lucide-react';
import { Language, OrderStatus } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabaseClient';
import { BrowserMultiFormatReader } from '@zxing/library';

interface CustomerOrdersProps {
    language: Language;
    onBack: () => void;
}

interface CustomerOrderItem {
    id: string;
    product_name: string;
    product_image: string;
    price: number;
    quantity: number;
    color: string | null;
    size: string | null;
    order: {
        id: string;
        status: OrderStatus;
        created_at: string;
        tracking_number: string | null;
        buyer: {
            username: string;
            avatar: string;
        } | null;
        shipping_address: string | null;
    };
}

const CustomerOrders: React.FC<CustomerOrdersProps> = ({ language, onBack }) => {
    const t = TRANSLATIONS[language];
    const [activeTab, setActiveTab] = useState<'all' | OrderStatus>('all');
    const [orderItems, setOrderItems] = useState<CustomerOrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<CustomerOrderItem | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('pending');
    const scannerRef = useRef<BrowserMultiFormatReader | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const fetchCustomerOrders = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            // Fetch order items for products sold by this user
            // We join with orders to get status and buyer info
            const { data, error } = await supabase
                .from('order_items')
                .select(`
                        id,
                        product_name,
                        product_image,
                        price,
                        quantity,
                        color,
                        size,
                        product_id,
                        order_id,
                        seller_id,
                        orders!inner(
                            id,
                            status,
                            created_at,
                            tracking_number,
                            shipping_address,
                            profiles:buyer_id (
                                username,
                                avatar
                            )
                        )
                    `)
                .eq('seller_id', user.id)
                // @ts-ignore
                .order('created_at', { foreignTable: 'orders', ascending: false });

            if (error) {
                console.error('Error fetching customer orders:', error);
            } else if (data) {
                const mappedItems: CustomerOrderItem[] = data.map((item: any) => ({
                    id: item.id,
                    product_name: item.product_name || 'Unknown Product',
                    product_image: item.product_image || 'https://via.placeholder.com/150',
                    price: item.price,
                    quantity: item.quantity,
                    color: item.color,
                    size: item.size,
                    order: {
                        id: item.orders.id,
                        status: item.orders.status,
                        created_at: item.orders.created_at,
                        tracking_number: item.orders.tracking_number,
                        buyer: item.orders.profiles || null,
                        shipping_address: item.orders.shipping_address
                    }
                }));

                setOrderItems(mappedItems);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCustomerOrders();

        let channel: any;
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (user) {
                channel = supabase
                    .channel('public:customer_order_items')
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'order_items',
                            filter: `seller_id=eq.${user.id}`
                        },
                        (payload) => {
                            console.log('New order item received for me, refreshing!');
                            fetchCustomerOrders();
                        }
                    )
                    .subscribe();
            }
        });

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        if (selectedItem) {
            setTrackingNumber(selectedItem.order.tracking_number || '');
            setSelectedStatus(selectedItem.order.status);
        }
    }, [selectedItem]);

    const handleUpdateOrder = async () => {
        if (!selectedItem) return;
        setIsUpdating(true);

        try {
            const { error } = await supabase
                .from('orders')
                .update({
                    status: selectedStatus,
                    tracking_number: trackingNumber
                })
                .eq('id', selectedItem.order.id);

            if (error) throw error;

            alert(language === 'th' ? 'อัปเดตสถานะสำเร็จ!' : 'Status updated successfully!');
            await fetchCustomerOrders();
            setSelectedItem(null);
        } catch (err) {
            console.error('Update Error:', err);
            alert('Failed to update order.');
        } finally {
            setIsUpdating(false);
        }
    };

    const startScanning = async () => {
        setIsScanning(true);
        const codeReader = new BrowserMultiFormatReader();
        scannerRef.current = codeReader;

        try {
            // Wait for video element to be available in DOM
            setTimeout(async () => {
                if (!videoRef.current) return;

                try {
                    const result = await codeReader.decodeFromVideoDevice(
                        undefined, // Default to back camera automatically by browser if environment is preferred
                        videoRef.current,
                        (result, error) => {
                            if (result) {
                                setTrackingNumber(result.getText());
                                stopScanning();
                                // According to user: Success (delivered) = Seller handed over to transport
                                if (selectedStatus === 'pending' || selectedStatus === 'shipping') {
                                    setSelectedStatus('delivered');
                                }
                                alert(language === 'th' ? `สแกนสำเร็จ: ${result.getText()}` : `Scan successful: ${result.getText()}`);
                            }
                        }
                    );
                } catch (err) {
                    console.error('Barcode scan error:', err);
                }
            }, 500);
        } catch (err) {
            console.error('Scanner init error:', err);
            setIsScanning(false);
        }
    };

    const stopScanning = () => {
        if (scannerRef.current) {
            scannerRef.current.reset();
            scannerRef.current = null;
        }
        setIsScanning(false);
    };

    // Auto-clean on unmount
    useEffect(() => {
        return () => {
            if (scannerRef.current) scannerRef.current.reset();
        };
    }, []);

    const filteredItems = activeTab === 'all'
        ? orderItems
        : orderItems.filter(item => item.order.status === activeTab);

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case 'pending': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'shipping': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            case 'delivered': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'cancelled': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-gray-500';
        }
    };

    const getStatusLabel = (status: OrderStatus) => {
        // @ts-ignore
        return t.status[status] || status;
    };

    return (
        <div className="pb-24 animate-fade-in bg-black min-h-screen flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-4 sticky top-0 bg-black/90 backdrop-blur z-30 border-b border-gray-800">
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors border border-gray-700"
                >
                    <ArrowLeft size={20} className="text-white" />
                </button>
                {/* @ts-ignore */}
                <h2 className="text-xl font-athletic tracking-wide text-white">{t.customerOrders || 'Customer Orders'}</h2>
            </div>

            {/* Tabs */}
            <div className="px-4 pt-2 sticky top-[72px] bg-black z-20 overflow-x-auto no-scrollbar border-b border-gray-800">
                <div className="flex gap-4 min-w-max pb-2">
                    {(['all', 'pending', 'shipping', 'delivered', 'cancelled'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${activeTab === tab
                                ? 'bg-red-600 border-red-600 text-white'
                                : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'
                                }`}
                        >
                            {/* @ts-ignore */}
                            {t.status[tab]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Items List */}
            <div className="flex-1 p-4 space-y-4">
                {loading ? (
                    <div className="flex justify-center pt-20">
                        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredItems.length > 0 ? (
                    filteredItems.map(item => (
                        <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg animate-slide-up">
                            {/* Item Header (Order Info) */}
                            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/30">
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <Clock size={14} />
                                    <span>{new Date(item.order.created_at).toLocaleDateString()}</span>
                                    <span className="mx-1">•</span>
                                    <span className="font-mono">{item.order.id.slice(0, 8)}...</span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusColor(item.order.status)}`}>
                                    {getStatusLabel(item.order.status)}
                                </span>
                            </div>

                            {/* Product & Buyer Info */}
                            <div className="p-4 flex gap-4">
                                <div className="w-20 h-20 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 border border-gray-700">
                                    <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-white text-sm font-bold line-clamp-1">{item.product_name}</h4>
                                    <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
                                        {item.color && (
                                            <div className="flex items-center gap-1">
                                                <span>Color:</span>
                                                <div
                                                    className="w-3 h-3 rounded-full border border-gray-600"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                            </div>
                                        )}
                                        {item.size && <span>Size: {item.size}</span>}
                                        <span>Qty: {item.quantity}</span>
                                    </div>

                                    {/* Buyer Info */}
                                    <div className="mt-3 flex items-center gap-2 bg-black/40 p-2 rounded-lg border border-gray-800">
                                        <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-700 bg-gray-800">
                                            {item.order.buyer?.avatar ? (
                                                <img src={item.order.buyer.avatar} className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={12} className="m-auto text-gray-500" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] text-gray-500 leading-none">Buyer</p>
                                            <p className="text-xs text-white font-bold truncate leading-tight mt-0.5">
                                                {item.order.buyer?.username || 'Unknown User'}
                                            </p>
                                        </div>
                                        <div className="text-sm font-bold text-yellow-500 font-athletic">
                                            ฿{(item.price * item.quantity).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="px-4 py-3 border-t border-gray-800 bg-black/20 flex justify-between items-center">
                                <div className="text-[10px] text-gray-500">
                                    {item.order.tracking_number ? (
                                        <span className="flex items-center gap-1">
                                            <Truck size={12} /> {item.order.tracking_number}
                                        </span>
                                    ) : (
                                        'No tracking info yet'
                                    )}
                                </div>
                                <button
                                    onClick={() => setSelectedItem(item)}
                                    className="text-[10px] font-bold text-red-500 flex items-center gap-1 hover:text-red-400 transition-colors uppercase tracking-wider"
                                >
                                    Details <ExternalLink size={10} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <Package size={48} className="mb-4 opacity-50" />
                        <p>No customer orders yet.</p>
                    </div>
                )}
            </div>

            {/* Item Detail Modal (Optional but nice) */}
            {selectedItem && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="relative w-full max-w-md bg-gray-900 rounded-3xl border border-gray-800 shadow-2xl flex flex-col max-h-[85vh] animate-slide-up overflow-hidden">
                        <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                            <div>
                                <h3 className="text-white font-bold text-lg">Order Details</h3>
                                <p className="text-xs text-gray-400 mt-0.5">#{selectedItem.order.id}</p>
                            </div>
                            <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-white bg-gray-800 p-2 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Large Product Image */}
                            <div className="aspect-square w-full rounded-2xl overflow-hidden border border-gray-800">
                                <img src={selectedItem.product_image} className="w-full h-full object-cover" />
                            </div>

                            <div>
                                <h4 className="text-xl font-bold text-white">{selectedItem.product_name}</h4>
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                                        <div className="w-4 h-4 rounded-full border border-gray-700" style={{ backgroundColor: selectedItem.color || 'transparent' }}></div>
                                        <span>{selectedItem.color || 'N/A'}</span>
                                    </div>
                                    <div className="text-gray-400 text-sm">Size: <span className="text-white font-bold">{selectedItem.size || 'N/A'}</span></div>
                                    <div className="text-gray-400 text-sm">Qty: <span className="text-white font-bold">{selectedItem.quantity}</span></div>
                                </div>
                            </div>

                            <div className="h-px bg-gray-800"></div>

                            <div className="flex justify-between items-end">
                                <div className="text-gray-400 text-sm">Total Price</div>
                                <div className="text-2xl font-bold text-yellow-500 font-athletic">฿{(selectedItem.price * selectedItem.quantity).toLocaleString()}</div>
                            </div>

                            <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700">
                                <h5 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">Customer Information</h5>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-600 bg-gray-700">
                                        {selectedItem.order.buyer?.avatar ? (
                                            <img src={selectedItem.order.buyer.avatar} className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={24} className="m-auto text-gray-500" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-white font-bold">{selectedItem.order.buyer?.username || 'Unknown User'}</p>
                                        <p className="text-xs text-gray-500 mt-1">Ordered on {new Date(selectedItem.order.created_at).toLocaleString()}</p>
                                    </div>
                                </div>

                                {selectedItem.order.shipping_address && (
                                    <div className="mt-4 pt-4 border-t border-gray-700/50">
                                        <div className="flex items-start gap-2 text-gray-400">
                                            <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wider font-bold mb-1">Shipping Address & Contact</p>
                                                <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">
                                                    {selectedItem.order.shipping_address}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="h-px bg-gray-800 my-2"></div>

                                {/* Order Management Section */}
                                <div className="space-y-4">
                                    <h5 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Manage Order Status</h5>

                                    <div className="grid grid-cols-2 gap-2">
                                        {(['pending', 'shipping', 'delivered', 'cancelled'] as OrderStatus[]).map(status => (
                                            <button
                                                key={status}
                                                onClick={() => setSelectedStatus(status)}
                                                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${selectedStatus === status
                                                    ? 'bg-blue-600 border-blue-500 text-white'
                                                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                                                    }`}
                                            >
                                                {getStatusLabel(status)}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-500">Tracking Number</label>
                                        <div className="flex gap-2">
                                            <div className="flex-1 relative">
                                                <input
                                                    type="text"
                                                    value={trackingNumber}
                                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                                    placeholder="Enter tracking number"
                                                    className="w-full bg-black border border-gray-700 rounded-xl py-2.5 px-3 text-white text-sm focus:border-blue-500 focus:outline-none transition-all"
                                                />
                                                <Truck size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600" />
                                            </div>
                                            <button
                                                onClick={startScanning}
                                                disabled={isScanning}
                                                className="bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-black px-4 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-yellow-900/20"
                                                title="Scan Barcode"
                                            >
                                                <Scan size={20} />
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-gray-600 italic">Tip: Use Scan button to automatically capture tracking number from parcel</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Scanner Overlay */}
                        {isScanning && (
                            <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center animate-fade-in">
                                <div className="absolute top-8 right-8 z-[210]">
                                    <button
                                        onClick={stopScanning}
                                        className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 border border-white/20"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
                                    <video
                                        ref={videoRef}
                                        className="w-full h-full object-cover"
                                        playsInline
                                    />

                                    {/* Scanner Frame UI */}
                                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                                        <div className="w-72 h-48 border-2 border-yellow-500 rounded-3xl relative">
                                            {/* Corner Accents */}
                                            <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-yellow-500 rounded-tl-xl"></div>
                                            <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-yellow-500 rounded-tr-xl"></div>
                                            <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-yellow-500 rounded-bl-xl"></div>
                                            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-yellow-500 rounded-br-xl"></div>

                                            {/* Scanning Line Animation */}
                                            <div className="absolute left-0 right-0 h-0.5 bg-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.8)] animate-scan-line"></div>
                                        </div>
                                        <p className="mt-8 text-white font-bold text-sm bg-black/40 px-6 py-2 rounded-full backdrop-blur-md">
                                            Align Barcode/QR inside the frame
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="p-6 border-t border-gray-800 bg-black/30 flex gap-3">
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-2xl transition-all"
                            >
                                {language === 'th' ? 'ปิด' : 'Close'}
                            </button>
                            <button
                                onClick={handleUpdateOrder}
                                disabled={isUpdating}
                                className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                            >
                                {isUpdating ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                                {language === 'th' ? 'บันทึก' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerOrders;
