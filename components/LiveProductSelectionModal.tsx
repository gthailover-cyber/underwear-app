
import React, { useState } from 'react';
import { X, CheckCircle, Package, Plus, Video, Circle } from 'lucide-react';
import { Language, Product } from '../types';
import { TRANSLATIONS } from '../constants';

interface LiveProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onConfirm: (selectedProducts: Product[]) => void;
  onAddProductRedirect: () => void;
  language: Language;
  selectionMode?: 'multiple' | 'single';
  liveType?: 'selling' | 'auction' | null;
}

const LiveProductSelectionModal: React.FC<LiveProductSelectionModalProps> = ({
  isOpen,
  onClose,
  products,
  onConfirm,
  onAddProductRedirect,
  language,
  selectionMode = 'multiple',
  liveType
}) => {
  const t = TRANSLATIONS[language];
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const toggleSelection = (id: string) => {
    if (selectionMode === 'single') {
      const newSelection = new Set<string>();
      if (!selectedIds.has(id)) {
        newSelection.add(id);
      }
      setSelectedIds(newSelection);
    } else {
      const newSelection = new Set(selectedIds);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      setSelectedIds(newSelection);
    }
  };

  const handleConfirm = () => {
    const selected = products.filter(p => selectedIds.has(p.id));
    onConfirm(selected);
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-md bg-gray-900 rounded-3xl border border-gray-800 shadow-2xl flex flex-col max-h-[85vh] animate-fade-in shadow-[0_20px_50px_rgba(220,38,38,0.1)]">

        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-athletic text-white tracking-wide">
              {liveType === 'auction'
                ? (language === 'th' ? 'เลือกสินค้าประมูล' : 'Select Auction Item')
                : t.selectProductsTitle
              }
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {selectedIds.size} {t.selected}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-2 border-2 border-dashed ${liveType === 'auction' ? 'bg-yellow-900/10 border-yellow-900/30' : 'bg-gray-800 border-gray-700'}`}>
                <Package size={32} className={liveType === 'auction' ? 'text-yellow-600' : 'text-gray-500'} />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">
                  {language === 'th'
                    ? (liveType === 'auction' ? 'ไม่พบสินค้าประมูล' : 'ไม่พบสินค้าปกติ')
                    : (liveType === 'auction' ? 'No Auction Items' : 'No Normal Items')
                  }
                </h3>
                <p className="text-gray-400 text-sm max-w-[200px] mx-auto mt-1">
                  {language === 'th'
                    ? (liveType === 'auction' ? 'คุณต้องเพิ่มสินค้าประเภทประมูลก่อนเริ่มไลฟ์' : 'คุณต้องเพิ่มสินค้าปกติก่อนเริ่มไลฟ์')
                    : (liveType === 'auction' ? 'You need to add auction products first.' : 'You need to add normal products first.')
                  }
                </p>
              </div>
              <button
                onClick={onAddProductRedirect}
                className="mt-4 px-6 py-3 bg-gray-800 border border-gray-700 hover:border-red-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95"
              >
                <Plus size={18} /> {t.goToAddProduct}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map(product => {
                const isSelected = selectedIds.has(product.id);
                return (
                  <div
                    key={product.id}
                    onClick={() => toggleSelection(product.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected
                        ? (liveType === 'auction' ? 'bg-yellow-900/10 border-yellow-600' : 'bg-red-900/20 border-red-600')
                        : 'bg-gray-800 border-gray-700 hover:border-gray-600 shadow-inner'
                      }`}
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected
                        ? (liveType === 'auction' ? 'bg-yellow-500 border-yellow-500' : 'bg-red-600 border-red-600')
                        : 'border-gray-500'
                      }`}>
                      {isSelected
                        ? <CheckCircle size={14} className="text-white" />
                        : selectionMode === 'single' && <Circle size={14} className="text-transparent" />
                      }
                    </div>

                    <div className="relative">
                      <img src={product.image} className="w-12 h-12 rounded-lg object-cover bg-gray-700 shadow-md" alt={product.name} />
                      {product.type === 'auction' && (
                        <div className="absolute -top-1 -left-1 bg-yellow-600 text-[6px] font-black px-1 rounded shadow-sm">
                          BID
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                        {product.name}
                      </h4>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-gray-500 uppercase font-medium">
                          {liveType === 'auction' ? 'Rare Item' : `Stock: ${product.stock}`}
                        </span>
                        <span className="text-xs font-bold text-yellow-500">฿{product.price.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {products.length > 0 && (
          <div className="p-5 border-t border-gray-800 bg-gray-900/50 backdrop-blur">
            <button
              onClick={handleConfirm}
              disabled={selectedIds.size === 0}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all ${selectedIds.size > 0
                  ? (liveType === 'auction'
                    ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-white shadow-yellow-900/50 hover:from-yellow-500 hover:to-yellow-400 active:scale-95'
                    : 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-red-900/50 hover:from-red-500 hover:to-red-400 active:scale-95')
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
            >
              {selectionMode === 'single' ? (language === 'th' ? 'ไปตั้งค่าประมูล' : 'Continue to Setup') : (
                <><Video size={20} /> {t.startLive} {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}</>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default LiveProductSelectionModal;
