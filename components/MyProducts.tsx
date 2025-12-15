
import React, { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, X, Package, Check, ImagePlus, ArrowLeft, Loader2, Save } from 'lucide-react';
import { Product, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabaseClient';

interface MyProductsProps {
  language: Language;
  onBack: () => void;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const AVAILABLE_COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Green', hex: '#008000' },
  { name: 'Navy', hex: '#000080' },
];

const MyProducts: React.FC<MyProductsProps> = ({ language, onBack, products, setProducts }) => {
  const t = TRANSLATIONS[language];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Image Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    price: 0,
    stock: 0,
    colors: [],
    sizes: [],
    image: ''
  });

  const handleOpenModal = (product?: Product) => {
    setImageFile(null); // Reset file
    if (product) {
      setEditingProduct(product);
      setFormData({ ...product });
      setPreviewImage(product.image);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        price: 0,
        stock: 1,
        colors: [],
        sizes: [],
        image: ''
      });
      setPreviewImage('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  // --- IMAGE HANDLING ---
  
  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  // Utility to resize image before upload
  const resizeImage = (file: File, maxWidth: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Canvas to Blob failed'));
            }, 'image/jpeg', 0.85);
          } else {
            reject(new Error('Canvas context failed'));
          }
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const uploadImageToSupabase = async (file: File): Promise<string | null> => {
      try {
          const resizedBlob = await resizeImage(file, 800);
          const fileExt = 'jpg';
          const fileName = `products/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
              .from('gunderwear-bucket') 
              .upload(fileName, resizedBlob, { contentType: 'image/jpeg' });

          if (uploadError) throw uploadError;

          const { data } = supabase.storage.from('gunderwear-bucket').getPublicUrl(fileName);
          return data.publicUrl;
      } catch (error: any) {
          console.error("Error uploading product image:", error);
          alert(`Failed to upload image: ${error.message}`);
          return null;
      }
  };

  // --- DATABASE ACTIONS ---

  const handleDelete = async (id: string) => {
    if (!window.confirm(t.deleteConfirm)) return;

    // Optimistic Update
    const previousProducts = [...products];
    setProducts(prev => prev.filter(p => p.id !== id));

    try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
    } catch (error: any) {
        console.error("Error deleting product:", error);
        alert("Failed to delete product.");
        setProducts(previousProducts); // Revert
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // 1. Upload Image if new file selected
        let finalImageUrl = formData.image;
        if (imageFile) {
            const uploadedUrl = await uploadImageToSupabase(imageFile);
            if (uploadedUrl) {
                finalImageUrl = uploadedUrl;
            } else {
                throw new Error("Image upload failed");
            }
        }

        // Validate Image
        if (!finalImageUrl) {
            alert("Please upload a product image.");
            setIsSaving(false);
            return;
        }

        // 2. Prepare Data Payload
        const payload = {
            seller_id: user.id,
            name: formData.name,
            price: Number(formData.price),
            stock: Number(formData.stock),
            colors: formData.colors,
            sizes: formData.sizes,
            image: finalImageUrl,
            description: formData.description || ''
        };

        if (editingProduct) {
            // UPDATE
            const { data, error } = await supabase
                .from('products')
                .update(payload)
                .eq('id', editingProduct.id)
                .select()
                .single();

            if (error) throw error;

            // Update Local State
            setProducts(prev => prev.map(p => (p.id === editingProduct.id ? { ...p, ...data } as Product : p)));

        } else {
            // CREATE
            const { data, error } = await supabase
                .from('products')
                .insert(payload)
                .select()
                .single();

            if (error) throw error;

            // Update Local State
            if (data) {
                const newProduct: Product = {
                    id: data.id,
                    name: data.name,
                    price: data.price,
                    stock: data.stock,
                    image: data.image,
                    colors: data.colors,
                    sizes: data.sizes,
                    sold: data.sold
                };
                setProducts(prev => [newProduct, ...prev]);
            }
        }

        handleCloseModal();

    } catch (error: any) {
        console.error("Error saving product:", error);
        alert(`Failed to save product: ${error.message}`);
    } finally {
        setIsSaving(false);
    }
  };

  const toggleSize = (size: string) => {
    setFormData(prev => {
      const sizes = prev.sizes || [];
      if (sizes.includes(size)) {
        return { ...prev, sizes: sizes.filter(s => s !== size) };
      } else {
        return { ...prev, sizes: [...sizes, size] };
      }
    });
  };

  const toggleColor = (hex: string) => {
    setFormData(prev => {
      const colors = prev.colors || [];
      if (colors.includes(hex)) {
        return { ...prev, colors: colors.filter(c => c !== hex) };
      } else {
        return { ...prev, colors: [...colors, hex] };
      }
    });
  };

  return (
    <div className="pb-24 animate-fade-in min-h-screen bg-black text-white">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 sticky top-0 bg-black/90 backdrop-blur z-30 border-b border-gray-800">
        <div className="flex items-center gap-3">
            <button 
                onClick={onBack}
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors border border-gray-700"
            >
                <ArrowLeft size={20} className="text-white" />
            </button>
            <h2 className="text-xl font-athletic tracking-wide text-white">{t.myProducts}</h2>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 text-sm shadow-lg shadow-red-900/50 transition-all active:scale-95"
        >
          <Plus size={16} /> <span className="hidden sm:inline">{t.addProduct}</span>
        </button>
      </div>

      {/* Product List */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => (
          <div key={product.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col group hover:border-gray-600 transition-all">
            <div className="flex p-3 gap-3">
              {/* Image */}
              <div className="w-24 h-24 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 relative">
                <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                <div>
                  <h3 className="font-bold text-white line-clamp-2 leading-tight mb-1">{product.name}</h3>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {product.colors?.map(c => (
                        <span key={c} className="w-3 h-3 rounded-full border border-gray-600" style={{ backgroundColor: c }}></span>
                    ))}
                    {product.sizes?.length ? <span className="text-gray-500 text-xs">| {product.sizes.join(', ')}</span> : null}
                  </div>
                </div>
                
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-xs text-gray-500 block">{t.stock}: {product.stock}</span>
                    <span className="text-lg font-bold text-yellow-400">฿{product.price.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-gray-950/50 p-2 flex gap-2 border-t border-gray-800">
               <button 
                 onClick={() => handleOpenModal(product)}
                 className="flex-1 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors"
               >
                 <Edit2 size={12} /> {t.editProduct}
               </button>
               <button 
                 onClick={() => handleDelete(product.id)}
                 className="w-10 flex items-center justify-center rounded-lg bg-red-900/20 hover:bg-red-900/40 text-red-500 transition-colors"
               >
                 <Trash2 size={14} />
               </button>
            </div>
          </div>
        ))}

        {products.length === 0 && (
           <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
              <Package size={48} className="mb-4 opacity-50" />
              <p>No products yet. Add your first item!</p>
           </div>
        )}
      </div>

      {/* --- Add/Edit Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative w-full max-w-lg bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl flex flex-col max-h-[90vh] animate-fade-in">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{editingProduct ? t.editProduct : t.addProduct}</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-white"><X size={20}/></button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-6">
               
               {/* Image Upload Area */}
               <div className="flex justify-center">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange}
                  />
                  <div 
                    onClick={handleFileClick}
                    className="relative w-32 h-32 bg-gray-800 rounded-xl overflow-hidden border-2 border-dashed border-gray-700 group cursor-pointer hover:border-red-500 transition-colors"
                  >
                     {previewImage ? (
                        <>
                           <img src={previewImage} className="w-full h-full object-cover" />
                           <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white">
                              <Edit2 size={24} />
                              <span className="text-[10px] font-bold mt-1">Change</span>
                           </div>
                        </>
                     ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-white">
                           <ImagePlus size={24} />
                           <span className="text-[10px] font-bold mt-1">Upload</span>
                        </div>
                     )}
                  </div>
               </div>

               {/* Name */}
               <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-1">{t.productName}</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-red-600 focus:outline-none"
                    />
                  </div>
               </div>

               {/* Price & Stock */}
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-1">{t.price} (THB)</label>
                    <input 
                      required
                      type="number" 
                      min="0"
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-red-600 focus:outline-none"
                    />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-1">{t.stock}</label>
                    <input 
                      required
                      type="number"
                      min="0" 
                      value={formData.stock}
                      onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-red-600 focus:outline-none"
                    />
                 </div>
               </div>

               {/* Sizes */}
               <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-2">{t.sizes}</label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_SIZES.map(size => (
                      <button
                        type="button"
                        key={size}
                        onClick={() => toggleSize(size)}
                        className={`w-10 h-10 rounded-lg font-bold text-sm transition-all border ${
                          formData.sizes?.includes(size)
                           ? 'bg-red-600 border-red-600 text-white'
                           : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
               </div>

               {/* Colors */}
               <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-2">{t.colors}</label>
                  <div className="flex flex-wrap gap-3">
                    {AVAILABLE_COLORS.map(color => {
                      const isSelected = formData.colors?.includes(color.hex);
                      return (
                        <button
                          type="button"
                          key={color.hex}
                          onClick={() => toggleColor(color.hex)}
                          className={`w-8 h-8 rounded-full border-2 relative transition-transform ${isSelected ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        >
                          {isSelected && <Check size={14} className={`absolute inset-0 m-auto ${['#FFFFFF', '#FFFF00'].includes(color.hex) ? 'text-black' : 'text-white'}`} />}
                        </button>
                      );
                    })}
                  </div>
               </div>

               <div className="pt-4">
                 <button 
                   type="submit"
                   disabled={isSaving}
                   className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-900/30 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                 >
                   {isSaving ? (
                       <>
                         <Loader2 className="w-5 h-5 animate-spin" /> {t.saving}
                       </>
                   ) : (
                       <>
                         <Save size={18} /> {t.save}
                       </>
                   )}
                 </button>
               </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyProducts;
