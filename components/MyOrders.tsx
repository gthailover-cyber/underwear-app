
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, Truck, CheckCircle, Circle, RotateCw, X } from 'lucide-react';
import { Language, Order, OrderStatus } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabaseClient';

interface MyOrdersProps {
  language: Language;
  onBack: () => void;
}

const MyOrders: React.FC<MyOrdersProps> = ({ language, onBack }) => {
  const t = TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState<'all' | OrderStatus>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Fetch orders. NOTE: Schema might need 'order_items' join
        // For simplicity, we just fetch orders table first
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('buyer_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
           // Mapping logic here depends on how complex your real query is
           // Assuming a simpler structure for now or just placeholder items
           const mappedOrders: Order[] = data.map((o: any) => ({
              id: o.id,
              items: [], // Would need a separate fetch or join for items
              totalPrice: o.total_amount,
              status: o.status,
              date: new Date(o.created_at).toLocaleDateString(),
              trackingNumber: o.tracking_number
           }));
           setOrders(mappedOrders);
        }
      }
      setLoading(false);
    };

    fetchOrders();
  }, []);

  const filteredOrders = activeTab === 'all' 
    ? orders 
    : orders.filter(o => o.status === activeTab);

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

  const handleTrackOrder = (order: Order) => {
     setSelectedOrder(order);
     setIsTrackingOpen(true);
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
        <h2 className="text-xl font-athletic tracking-wide text-white">{t.myOrders}</h2>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-2 sticky top-[72px] bg-black z-20 overflow-x-auto no-scrollbar border-b border-gray-800">
         <div className="flex gap-4 min-w-max pb-2">
            {(['all', 'pending', 'shipping', 'delivered', 'cancelled'] as const).map(tab => (
               <button
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                    activeTab === tab 
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

      {/* Order List */}
      <div className="flex-1 p-4 space-y-4">
         {loading ? (
             <div className="flex justify-center pt-20">
                 <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
             </div>
         ) : filteredOrders.length > 0 ? (
           filteredOrders.map(order => (
             <div key={order.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg animate-slide-up">
                
                {/* Order Header */}
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/30">
                   <div className="flex items-center gap-2">
                      <Package size={16} className="text-gray-400" />
                      <span className="text-xs text-gray-400 font-mono text-ellipsis overflow-hidden max-w-[100px]">{order.id}</span>
                   </div>
                   <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                   </span>
                </div>

                {/* Products Placeholder since we don't fetch items yet */}
                <div className="p-4">
                   <p className="text-sm text-gray-400">Items info loading...</p>
                </div>

                {/* Footer / Actions */}
                <div className="p-4 border-t border-gray-800 bg-gray-950/30">
                   <div className="flex justify-between items-center mb-4">
                      <span className="text-xs text-gray-400">Total</span>
                      <div className="flex items-center gap-2">
                         <span className="text-lg font-bold text-yellow-400 font-athletic">฿{order.totalPrice.toLocaleString()}</span>
                      </div>
                   </div>
                   
                   <div className="flex gap-3 justify-end">
                      {(order.status === 'shipping' || order.status === 'delivered') && (
                         <button 
                           onClick={() => handleTrackOrder(order)}
                           className="px-4 py-2 rounded-lg text-xs font-bold bg-gray-800 text-white hover:bg-gray-700 flex items-center gap-1.5"
                         >
                            <Truck size={14} /> {t.trackOrder}
                         </button>
                      )}
                   </div>
                </div>
             </div>
           ))
         ) : (
           <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Package size={48} className="mb-4 opacity-50" />
              <p>No orders found.</p>
           </div>
         )}
      </div>

      {/* Tracking Modal */}
      {isTrackingOpen && selectedOrder && (
         <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md bg-gray-900 rounded-3xl border border-gray-800 shadow-2xl flex flex-col max-h-[85vh] animate-slide-up overflow-hidden">
                <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                    <div>
                        <h3 className="text-white font-bold text-lg">{t.trackingTitle}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{selectedOrder.trackingNumber || 'Processing'}</p>
                    </div>
                    <button onClick={() => setIsTrackingOpen(false)} className="text-gray-400 hover:text-white bg-gray-800 p-2 rounded-full">
                        <X size={20} />
                    </button>
                </div>
                <div className="h-32 bg-gray-800 relative overflow-hidden flex items-center justify-center border-b border-gray-800">
                   <div className="relative z-10 flex flex-col items-center text-gray-400">
                      <Truck size={32} className="mb-2 text-red-500 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-widest">In Transit</span>
                   </div>
                </div>
                <div className="flex-1 p-6 text-center text-gray-500">
                    <p>Tracking details coming soon.</p>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default MyOrders;
