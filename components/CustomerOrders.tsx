
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, X, User, ExternalLink, MapPin } from 'lucide-react';
import { Language, OrderStatus } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabaseClient';

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

    useEffect(() => {
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
                        orders!inner(
                            id,
                            status,
                            created_at,
                            tracking_number,
                            buyer_id,
                            shipping_address,
                            profiles:buyer_id (
                                username,
                                avatar
                            )
                        ),
                        products!inner(
                            id,
                            seller_id
                        )
                    `)
                    .eq('products.seller_id', user.id)
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

        fetchCustomerOrders();
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
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-800 bg-black/30">
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-2xl transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerOrders;
