import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  CheckCircle2, 
  XCircle, 
  MessageCircle, 
  Filter,
  Tag
} from 'lucide-react';
import { ACCESSORIES_CATALOG, BUSINESS_DETAILS } from '../data/initialData';
import { AccessoryItem, ShopBusinessDetails } from '../types';
import { formatImageUrl } from '../lib/imageUtils';

interface AccessoriesCatalogProps {
  items?: AccessoryItem[];
  businessDetails?: ShopBusinessDetails;
}

export const AccessoriesCatalog: React.FC<AccessoriesCatalogProps> = ({
  items = ACCESSORIES_CATALOG,
  businessDetails = BUSINESS_DETAILS
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Display', 'Battery', 'Charger/Cable', 'Audio', 'Protection'];

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.compatibleModels.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div>
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
            In-Stock Parts & Accessories
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            Mobile Parts & Smartphone Accessories
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Genuine AMOLED/LCD displays, high-cycle batteries, fast chargers, earphones & screen guards available at TECHFIX Shop.
          </p>
        </div>

        <a
          href={`https://wa.me/${BUSINESS_DETAILS.whatsapp}?text=Hello%20TECHFIX,%20I%20am%20looking%20for%20a%20mobile%20part%20/%20accessory.`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition shrink-0"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Enquire Stock via WhatsApp</span>
        </a>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search parts or models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div 
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Product Image */}
              <div className="relative h-44 bg-slate-100 overflow-hidden">
                <img 
                  src={formatImageUrl(item.image)} 
                  alt={item.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
                  {item.category}
                </span>

                <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  item.inStock ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'
                }`}>
                  {item.inStock ? 'In Stock' : 'On Order'}
                </span>
              </div>

              {/* Body */}
              <div className="p-5 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm leading-snug">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {item.description}
                </p>

                <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 font-medium">
                  Compatible: <strong className="text-slate-800">{item.compatibleModels}</strong>
                </div>
              </div>
            </div>

            {/* Footer Pricing & Inquiry */}
            <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-100 mt-2 pt-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Shop Price</p>
                <p className="text-lg font-black text-slate-900">₹{item.price}</p>
              </div>

              <a
                href={`https://wa.me/${BUSINESS_DETAILS.whatsapp}?text=Hello%20TECHFIX,%20I%20want%20to%20buy/enquire%20about:%20${encodeURIComponent(item.name)}%20(₹${item.price}).`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Enquire</span>
              </a>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
