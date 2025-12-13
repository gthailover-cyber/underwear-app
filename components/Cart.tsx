
import React, { useState } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ShieldCheck, CheckCircle, Receipt } from 'lucide-react';
import { CartItem, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface CartProps {
  language: Language;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  onGoShopping: () => void;
}

const Cart: React.FC<CartProps> = ({ 
  language, 
  items, 
  onUpdateQuantity, 
  onRemoveItem, 
  onCheckout,
  onGoShopping
}) => {
  const [isSuccess, setIsSuccess] = useState(false);
  
  const t = TRANSLATIONS[language];
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = 0; // Free shipping logic can be added here
  const total = subtotal + shipping;

  const handleCheckoutProcess = () => {
      // Show success animation first, then trigger parent checkout logic
      setIsSuccess(true);
      setTimeout(() => {
          setIsSuccess(false);
          onCheckout();
      }, 2500);
  };

  if (isSuccess) {
      return (
          <div className="flex flex-col items-center justify-center h-[70vh] animate-fade-in text-center px-6">
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/30 animate-float">
                  <CheckCircle size={48} className="text-white" />
              </div>
              <h2 className="text-2xl font-athletic text-white mb-2 tracking-wide">Payment Successful!</h2>
              <p className="text-gray-400 mb-8 text-sm">Thank you for your purchase.</p>
              
              <div className="bg-gray-800 rounded-xl p-6 w-full max-w-xs border border-gray-700 relative">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -mt-3 w-6 h-6 bg-black rounded-full border-b border-gray-700"></div>
                  <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-400 text-xs uppercase">Order ID</span>
                      <span className="text-white font-mono text-sm">#ORDER-{Math.floor(Math.random()*10000)}</span>
                  </div>
                  <div className="border-t border-dashed border-gray-600 my-4"></div>
                  <div className="flex justify-between items-center">
                      <span className="text-gray-300 font-bold">Total Paid</span>
                      <span className="text-yellow-400 font-bold text-xl">฿{total.toLocaleString()}</span>
                  </div>
              </div>
          </div>
      );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] animate-fade-in text-center px-6">
        <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-black/50">
          <ShoppingBag size={48} className="text-gray-600" />
        </div>
        <h2 className="text-2xl font-athletic text-white mb-2 tracking-wide">{t.emptyCart}</h2>
        <p className="text-gray-400 mb-8 text-sm">Looks like you haven't added any underwear to your cart yet.</p>
        <button 
          onClick={onGoShopping}
          className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700 transition-all flex items-center gap-2"
        >
          {t.startShopping}
        </button>
      </div>
    );
  }

  return (
    <div className="pb-32 animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between px-2">
        <h2 className="text-3xl font-athletic text-white tracking-wide">{t.myCart}</h2>
        <span className="text-gray-400 font-medium text-sm mb-1">{items.length} {t.items}</span>
      </div>

      {/* Cart Items List */}
      <div className="space-y-4 mb-8">
        {items.map((item) => (
          <div 
            key={item.id} 
            className="bg-gray-800/50 border border-gray-700 rounded-2xl p-3 flex gap-4 transition-all hover:border-gray-600 group relative overflow-hidden"
          >
            {/* Item Image */}
            <div className="w-24 h-28 bg-gray-900 rounded-xl overflow-hidden flex-shrink-0">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            </div>

            {/* Item Details */}
            <div className="flex-1 flex flex-col justify-between py-1">
              <div>
                <div className="flex justify-between items-start">
                   <h3 className="text-white font-bold text-sm line-clamp-2 leading-tight pr-4">{item.name}</h3>
                   <button 
                     onClick={() => onRemoveItem(item.id)}
                     className="text-gray-500 hover:text-red-500 transition-colors p-1"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
                <div className="flex gap-2 mt-1">
                   <span className="text-gray-400 text-[10px] bg-gray-900 px-2 py-0.5 rounded border border-gray-700">Size: M</span>
                   <span className="text-gray-400 text-[10px] bg-gray-900 px-2 py-0.5 rounded border border-gray-700">Color: Black</span>
                </div>
              </div>

              <div className="flex justify-between items-end">
                <span className="text-lg font-bold text-yellow-400">฿{item.price.toLocaleString()}</span>
                
                {/* Quantity Controls */}
                <div className="flex items-center bg-gray-900 rounded-lg p-1 border border-gray-700">
                  <button 
                    onClick={() => onUpdateQuantity(item.id, -1)}
                    disabled={item.quantity <= 1}
                    className="w-7 h-7 flex items-center justify-center rounded bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-gray-800"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-white">{item.quantity}</span>
                  <button 
                    onClick={() => onUpdateQuantity(item.id, 1)}
                    className="w-7 h-7 flex items-center justify-center rounded bg-gray-800 text-white hover:bg-gray-700"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Section */}
      <div className="bg-gray-900/80 backdrop-blur-md rounded-t-3xl border-t border-gray-800 p-6 fixed bottom-[80px] left-0 right-0 z-30 md:bottom-0 md:relative md:bg-transparent md:border-t-0 md:p-0">
        
        {/* Trust Badge */}
        <div className="flex items-center justify-center gap-2 mb-6 text-gray-500 text-xs">
          <ShieldCheck size={14} className="text-green-500" />
          <span>Secure Checkout • 100% Authentic</span>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-gray-400 text-sm">
            <span>{t.subtotal}</span>
            <span>฿{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-400 text-sm">
            <span>{t.shipping}</span>
            <span className="text-green-400">{shipping === 0 ? t.free : `฿${shipping}`}</span>
          </div>
          <div className="h-px bg-gray-800 my-2"></div>
          <div className="flex justify-between items-end">
            <span className="text-white font-bold text-lg">{t.total}</span>
            <span className="text-2xl font-black text-white font-athletic tracking-wide">฿{total.toLocaleString()}</span>
          </div>
        </div>

        <button 
          onClick={handleCheckoutProcess}
          className="w-full bg-gradient-to-r from-red-700 to-red-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-red-900/50 hover:from-red-600 hover:to-red-500 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {t.checkout} <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default Cart;
