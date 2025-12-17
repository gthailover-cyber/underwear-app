
import React, { useState } from 'react';
import { ArrowLeft, MapPin, Plus, Trash2, X } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabaseClient';

interface MyAddressProps {
  language: Language;
  onBack: () => void;
}

interface Address {
  id: string;
  name: string;
  phone: string;
  address: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

const MyAddress: React.FC<MyAddressProps> = ({ language, onBack }) => {
  const t = TRANSLATIONS[language];
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState<Partial<Address>>({
    name: '',
    phone: '',
    address: '',
    province: '',
    postalCode: '',
    isDefault: false
  });

  const fetchAddresses = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false }); // Defaults first

      if (data) {
        setAddresses(data.map((d: any) => ({
          id: d.id,
          name: d.name,
          phone: d.phone,
          address: d.address,
          province: d.province,
          postalCode: d.postal_code,
          isDefault: d.is_default
        })));
      }
    }
    setLoading(false);
  };

  React.useEffect(() => {
    fetchAddresses();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newAddr = {
      user_id: user.id,
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      province: formData.province,
      postal_code: formData.postalCode,
      is_default: formData.isDefault
    };

    // If setting as default, we might want to unset others first?
    // Postgres trigger or simple logic here. 
    if (formData.isDefault) {
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
    }

    const { error } = await supabase.from('addresses').insert(newAddr);

    if (error) {
      console.error("Error saving address:", error);
      alert("Failed to save address.");
    } else {
      fetchAddresses();
      setIsAdding(false);
      setFormData({ name: '', phone: '', address: '', province: '', postalCode: '', isDefault: false });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const { error } = await supabase.from('addresses').delete().eq('id', id);
    if (!error) fetchAddresses();
  };

  const handleSetDefault = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Unset all
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
    // 2. Set target
    await supabase.from('addresses').update({ is_default: true }).eq('id', id);

    fetchAddresses();
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
          <h2 className="text-xl font-athletic tracking-wide text-white">{t.myAddress}</h2>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full font-bold shadow-lg shadow-red-900/50 transition-all active:scale-95"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {loading ? (
          <div className="flex justify-center pt-20">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : addresses.map(addr => (
          <div key={addr.id} className={`bg-gray-900 border ${addr.isDefault ? 'border-red-600/50 bg-red-900/10' : 'border-gray-800'} rounded-xl p-4 relative group`}>
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{addr.name}</span>
                {addr.isDefault && (
                  <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">
                    Default
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {!addr.isDefault && (
                  <button onClick={() => handleSetDefault(addr.id)} className="text-gray-500 hover:text-green-500 text-xs font-medium">
                    Set Default
                  </button>
                )}
                <button onClick={() => handleDelete(addr.id)} className="text-gray-500 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {addr.address} <br />
              {addr.province} {addr.postalCode}
            </p>
            <p className="text-gray-400 text-sm mt-1 flex items-center gap-1">
              <span className="text-gray-600 text-xs">Tel:</span> {addr.phone}
            </p>
          </div>
        ))}

        {!loading && addresses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-600">
            <MapPin size={48} className="mb-4 opacity-50" />
            <p>No addresses found.</p>
          </div>
        )}
      </div>

      {/* Add Address Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 w-full max-w-md rounded-2xl border border-gray-800 shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="font-bold text-white">{t.addNewAddress}</h3>
              <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <input
                  required
                  placeholder={t.recipientName}
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-red-600 focus:outline-none"
                />
              </div>
              <div>
                <input
                  required
                  placeholder={t.phoneNumber}
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-red-600 focus:outline-none"
                />
              </div>
              <div>
                <textarea
                  required
                  placeholder={t.addressDetails}
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-red-600 focus:outline-none resize-none h-24"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  required
                  placeholder={t.province}
                  value={formData.province}
                  onChange={e => setFormData({ ...formData, province: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-red-600 focus:outline-none"
                />
                <input
                  required
                  placeholder={t.postalCode}
                  value={formData.postalCode}
                  onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-red-600 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="defaultAddr"
                  checked={formData.isDefault}
                  onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4 accent-red-600 bg-gray-800 border-gray-700 rounded"
                />
                <label htmlFor="defaultAddr" className="text-sm text-gray-300">{t.defaultAddress}</label>
              </div>

              <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl mt-4">
                {t.save}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAddress;
