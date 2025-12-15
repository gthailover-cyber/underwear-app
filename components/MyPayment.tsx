
import React, { useState } from 'react';
import { ArrowLeft, Plus, CreditCard, Smartphone, Trash2, X } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface MyPaymentProps {
  language: Language;
  onBack: () => void;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'truemoney';
  name: string;
  detail: string;
  isDefault: boolean;
}

const MyPayment: React.FC<MyPaymentProps> = ({ language, onBack }) => {
  const t = TRANSLATIONS[language];
  const [payments, setPayments] = useState<PaymentMethod[]>([]); // Initialize empty
  const [isAdding, setIsAdding] = useState(false);
  const [addType, setAddType] = useState<'none' | 'card' | 'truemoney'>('none');
  
  const [cardNumber, setCardNumber] = useState('');
  const [phone, setPhone] = useState('');

  const handleDelete = (id: string) => {
      setPayments(prev => prev.filter(p => p.id !== id));
  };

  const handleSetDefault = (id: string) => {
      setPayments(prev => prev.map(p => ({
          ...p,
          isDefault: p.id === id
      })));
  };

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      const newMethod: PaymentMethod = {
          id: Date.now().toString(),
          type: addType === 'card' ? 'card' : 'truemoney',
          name: addType === 'card' ? 'Visa' : 'TrueMoney Wallet',
          detail: addType === 'card' ? `**** **** **** ${cardNumber.slice(-4)}` : phone,
          isDefault: payments.length === 0 // Make default if it's the first one
      };
      setPayments(prev => [...prev, newMethod]);
      setAddType('none');
      setIsAdding(false);
      setCardNumber('');
      setPhone('');
  };

  return (
    <div className="pb-24 animate-fade-in bg-black min-h-screen flex flex-col">
       {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 sticky top-0 bg-black/90 backdrop-blur z-30 border-b border-gray-800">
        <div className="flex items-center gap-3">
            <button 
                onClick={onBack}
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors border border-gray-700"
            >
                <ArrowLeft size={20} className="text-white" />
            </button>
            <h2 className="text-xl font-athletic tracking-wide text-white">{t.myPayment}</h2>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full font-bold shadow-lg shadow-red-900/50 transition-all active:scale-95"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {payments.map(method => (
              <div 
                key={method.id} 
                className={`bg-gray-900 border ${method.isDefault ? 'border-red-600/50 bg-red-900/10' : 'border-gray-800'} rounded-xl p-4 flex items-center justify-between group transition-all`}
              >
                  <div className="flex items-center gap-4">
                      {method.type === 'card' ? (
                          <div className="w-12 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded flex items-center justify-center shadow-lg flex-shrink-0">
                              <span className="text-[10px] font-bold italic text-white/90">VISA</span>
                          </div>
                      ) : (
                          <div className="w-12 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded flex items-center justify-center shadow-lg flex-shrink-0">
                              <Smartphone size={16} className="text-white" />
                          </div>
                      )}
                      <div>
                          <div className="flex items-center gap-2">
                             <h3 className="font-bold text-white">{method.name}</h3>
                             {method.isDefault && (
                               <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold">Default</span>
                             )}
                          </div>
                          <p className="text-sm text-gray-500">{method.detail}</p>
                          
                          {!method.isDefault && (
                             <button 
                               onClick={() => handleSetDefault(method.id)}
                               className="text-[10px] text-red-500 hover:text-red-400 font-medium mt-1 underline decoration-red-500/30 underline-offset-2"
                             >
                               Set as Default
                             </button>
                          )}
                      </div>
                  </div>
                  <button onClick={() => handleDelete(method.id)} className="text-gray-600 hover:text-red-500 p-2">
                      <Trash2 size={18} />
                  </button>
              </div>
          ))}
          
          {payments.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                  <CreditCard size={48} className="mb-4 opacity-50" />
                  <p>No payment methods added.</p>
              </div>
          )}
      </div>

      {/* Add Modal */}
      {isAdding && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-gray-900 w-full max-w-md rounded-2xl border border-gray-800 shadow-2xl overflow-hidden animate-slide-up">
                  <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                      <h3 className="font-bold text-white">{t.addNewPayment}</h3>
                      <button onClick={() => { setIsAdding(false); setAddType('none'); }} className="text-gray-400 hover:text-white"><X size={20}/></button>
                  </div>
                  
                  {addType === 'none' ? (
                      <div className="p-6 space-y-3">
                          <button 
                             onClick={() => setAddType('card')}
                             className="w-full flex items-center gap-4 p-4 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-blue-500 transition-all group"
                          >
                              <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                  <CreditCard size={20} />
                              </div>
                              <span className="text-white font-bold">{t.creditDebit}</span>
                          </button>
                          <button 
                             onClick={() => setAddType('truemoney')}
                             className="w-full flex items-center gap-4 p-4 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-orange-500 transition-all group"
                          >
                              <div className="w-10 h-10 rounded-full bg-orange-600/20 text-orange-500 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                  <Smartphone size={20} />
                              </div>
                              <span className="text-white font-bold">{t.truemoney}</span>
                          </button>
                      </div>
                  ) : (
                      <form onSubmit={handleSave} className="p-6 space-y-4">
                          {addType === 'card' ? (
                              <>
                                  <input 
                                    required
                                    placeholder={t.cardNumber}
                                    value={cardNumber}
                                    onChange={e => setCardNumber(e.target.value)}
                                    maxLength={16}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-red-600 focus:outline-none"
                                  />
                                  <input 
                                    required
                                    placeholder={t.cardHolder}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-red-600 focus:outline-none"
                                  />
                                  <div className="grid grid-cols-2 gap-4">
                                      <input 
                                        required
                                        placeholder="MM/YY"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-red-600 focus:outline-none"
                                      />
                                      <input 
                                        required
                                        placeholder={t.cvv}
                                        maxLength={3}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-red-600 focus:outline-none"
                                      />
                                  </div>
                              </>
                          ) : (
                              <>
                                  <div className="flex items-center justify-center mb-4">
                                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                                          <Smartphone size={32} className="text-white" />
                                      </div>
                                  </div>
                                  <p className="text-center text-sm text-gray-400 mb-4">Enter your TrueMoney number to link</p>
                                  <input 
                                    required
                                    placeholder={t.phoneNumber}
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-orange-500 focus:outline-none text-center text-lg tracking-widest"
                                  />
                              </>
                          )}
                          
                          <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl mt-4">
                              {t.save}
                          </button>
                          <button type="button" onClick={() => setAddType('none')} className="w-full text-gray-500 py-2 text-sm hover:text-white">Back</button>
                      </form>
                  )}
              </div>
          </div>
      )}

    </div>
  );
};

export default MyPayment;
