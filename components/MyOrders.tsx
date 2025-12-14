
import React, { useState } from 'react';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, ChevronRight, Copy, MapPin, X, Circle, RotateCw } from 'lucide-react';
import { Language, Order, OrderStatus } from '../types';
import { TRANSLATIONS, MOCK_ORDERS } from '../constants';

interface MyOrdersProps {
  language: Language;
  onBack: () => void;
}

const MyOrders: React.FC<MyOrdersProps> = ({ language, onBack }) => {
  const t = TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState<'all' | OrderStatus>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);

  const filteredOrders = activeTab === 'all' 
    ? MOCK_ORDERS 
    : MOCK_ORDERS.filter(o => o.status === activeTab);

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
            className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors border border-gray-700 md:hidden"
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
         {filteredOrders.length > 0 ? (
           filteredOrders.map(order => (
             <div key={order.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg animate-slide-up">
                
                {/* Order Header */}
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/30">
                   <div className="flex items-center gap-2">
                      <Package size={16} className="text-gray-400" />
                      <span className="text-xs text-gray-400 font-mono">{order.id}</span>
                   </div>
                   <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                   </span>
                </div>

                {/* Products */}
                <div className="p-4 space-y-4">
                   {order.items.map((item, idx) => (
                      <div key={`${order.id}-item-${idx}`} className="flex gap-4">
                         <img src={item.image} className="w-16 h-16 rounded-md object-cover bg-gray-800 flex-shrink-0" />
                         <div className="flex-1 min-w-0">
                            <h4 className="text-sm text-white font-medium line-clamp-1">{item.name}</h4>
                            <div className="text-xs text-gray-500 mt-1 flex gap-2">
                               <span>{item.color}</span>
                               <span>{item.size}</span>
                               <span>x{item.quantity}</span>
                            </div>
                            <div className="text-right mt-1">
                               <span className="text-sm font-bold text-white">฿{item.price.toLocaleString()}</span>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>

                {/* Footer / Actions */}
                <div className="p-4 border-t border-gray-800 bg-gray-950/30">
                   <div className="flex justify-between items-center mb-4">
                      <span className="text-xs text-gray-400">{order.items.length} items</span>
                      <div className="flex items-center gap-2">
                         <span className="text-xs text-gray-400">{t.orderTotal}:</span>
                         <span className="text-lg font-bold text-yellow-400 font-athletic">฿{order.totalPrice.toLocaleString()}</span>
                      </div>
                   </div>
                   
                   <div className="flex gap-3 justify-end">
                      {order.status === 'delivered' && (
                         <button className="px-4 py-2 rounded-lg text-xs font-bold border border-gray-700 text-white hover:bg-gray-800">
                            {t.buyAgain}
                         </button>
                      )}
                      {(order.status === 'shipping' || order.status === 'delivered') && (
                         <button 
                           onClick={() => handleTrackOrder(order)}
                           className="px-4 py-2 rounded-lg text-xs font-bold bg-gray-800 text-white hover:bg-gray-700 flex items-center gap-1.5"
                         >
                            <Truck size={14} /> {t.trackOrder}
                         </button>
                      )}
                      {order.status === 'pending' && (
                         <button className="px-4 py-2 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-500">
                            {t.payNow}
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

      {/* --- Tracking Modal --- */}
      {isTrackingOpen && selectedOrder && (
         <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md bg-gray-900 rounded-3xl border border-gray-800 shadow-2xl flex flex-col max-h-[85vh] animate-slide-up overflow-hidden">
                
                {/* Header */}
                <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                    <div>
                        <h3 className="text-white font-bold text-lg">{t.trackingTitle}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{selectedOrder.trackingNumber || 'Processing'}</p>
                    </div>
                    <button onClick={() => setIsTrackingOpen(false)} className="text-gray-400 hover:text-white bg-gray-800 p-2 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                {/* Map Placeholder (Professional touch) */}
                <div className="h-32 bg-gray-800 relative overflow-hidden flex items-center justify-center border-b border-gray-800">
                   <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/World_map_blank_without_borders.svg/2000px-World_map_blank_without_borders.svg.png')] bg-cover bg-center filter invert"></div>
                   <div className="relative z-10 flex flex-col items-center text-gray-400">
                      <Truck size={32} className="mb-2 text-red-500 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-widest">In Transit</span>
                   </div>
                </div>

                {/* Timeline */}
                <div className="flex-1 overflow-y-auto p-6 relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[44px] top-8 bottom-8 w-0.5 bg-gray-800 z-0"></div>

                    <div className="space-y-8 relative z-10">
                        {selectedOrder.timeline ? (
                            selectedOrder.timeline.map((event, index) => (
                                <div key={event.id} className="flex gap-4 group">
                                    <div className="flex flex-col items-center">
                                       <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 ${
                                           event.isCompleted 
                                             ? 'bg-green-500 border-gray-900 text-black' 
                                             : event.isCurrent 
                                                ? 'bg-red-600 border-gray-900 text-white shadow-[0_0_10px_rgba(220,38,38,0.6)]'
                                                : 'bg-gray-800 border-gray-900 text-gray-500'
                                       }`}>
                                          {event.isCompleted ? <CheckCircle size={14} /> : event.isCurrent ? <Truck size={14} /> : <Circle size={10} />}
                                       </div>
                                    </div>
                                    <div className={`flex-1 pt-1 ${event.isCompleted || event.isCurrent ? 'opacity-100' : 'opacity-50'}`}>
                                       <h4 className="text-sm font-bold text-white leading-none mb-1">{event.title}</h4>
                                       <p className="text-xs text-gray-400 mb-1">{event.description}</p>
                                       <span className="text-[10px] text-gray-500 font-mono block">{event.date}, {event.time}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                           <div className="text-center text-gray-500 py-10">
                              <RotateCw size={24} className="mx-auto mb-2 opacity-50" />
                              <p>Tracking info updating...</p>
                           </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
      )}

    </div>
  );
};

export default MyOrders;
