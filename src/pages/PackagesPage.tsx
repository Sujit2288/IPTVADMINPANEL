import React, { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from "firebase/firestore";
import { 
  Package as PackageIcon, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Check,
  Search,
  DollarSign,
  Calendar
} from "lucide-react";
import { Package, Channel } from "../types";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    validityDays: 30,
    channelIds: [] as string[]
  });

  useEffect(() => {
    const unsubPackages = onSnapshot(collection(db, "packages"), (snapshot) => {
      const packagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Package));
      setPackages(packagesData);
      setLoading(false);
    });

    const unsubChannels = onSnapshot(collection(db, "channels"), (snapshot) => {
      const channelsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel));
      setChannels(channelsData);
    });

    return () => {
      unsubPackages();
      unsubChannels();
    };
  }, []);

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPackage) {
        await updateDoc(doc(db, "packages", editingPackage.id), formData);
      } else {
        await addDoc(collection(db, "packages"), formData);
      }
      setIsModalOpen(false);
      setEditingPackage(null);
      setFormData({ name: "", price: 0, validityDays: 30, channelIds: [] });
    } catch (err) {
      console.error("Error saving package:", err);
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this package?")) {
      await deleteDoc(doc(db, "packages", id));
    }
  };

  const toggleChannel = (channelId: string) => {
    setFormData(prev => ({
      ...prev,
      channelIds: prev.channelIds.includes(channelId)
        ? prev.channelIds.filter(id => id !== channelId)
        : [...prev.channelIds, channelId]
    }));
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Package Management</h2>
          <p className="text-slate-500">Create and manage subscription packages for your users.</p>
        </div>
        <button 
          onClick={() => {
            setEditingPackage(null);
            setFormData({ name: "", price: 0, validityDays: 30, channelIds: [] });
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          Add Package
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <motion.div 
            key={pkg.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col"
          >
            <div className="p-6 flex-1">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <PackageIcon size={24} />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setEditingPackage(pkg);
                      setFormData({
                        name: pkg.name,
                        price: pkg.price,
                        validityDays: pkg.validityDays,
                        channelIds: pkg.channelIds
                      });
                      setIsModalOpen(true);
                    }}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeletePackage(pkg.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-1">{pkg.name}</h3>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <DollarSign size={16} className="text-emerald-500" />
                  <span className="text-lg font-bold text-slate-900">{pkg.price}</span>
                  <span className="text-xs text-slate-400 font-medium">/ month</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Calendar size={16} className="text-indigo-500" />
                  <span className="text-sm font-semibold">{pkg.validityDays} Days</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-50">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Included Channels</p>
                <div className="flex flex-wrap gap-2">
                  {pkg.channelIds.slice(0, 5).map(id => (
                    <span key={id} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold">
                      {channels.find(c => c.id === id)?.name || "Unknown"}
                    </span>
                  ))}
                  {pkg.channelIds.length > 5 && (
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold">
                      +{pkg.channelIds.length - 5} more
                    </span>
                  )}
                  {pkg.channelIds.length === 0 && (
                    <span className="text-xs text-slate-400 italic">No channels selected</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Package Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingPackage ? "Edit Package" : "Add New Package"}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSavePackage} className="space-y-6 overflow-y-auto pr-2 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Package Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="e.g. Premium HD"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Price ($)</label>
                      <input 
                        type="number" 
                        required
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Validity (Days)</label>
                      <input 
                        type="number" 
                        required
                        value={formData.validityDays}
                        onChange={(e) => setFormData({ ...formData, validityDays: Number(e.target.value) })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="30"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-slate-700">Select Channels</label>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                      {formData.channelIds.length} Selected
                    </span>
                  </div>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search channels..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-100 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-100 rounded-xl">
                    {channels
                      .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map(channel => (
                        <button
                          key={channel.id}
                          type="button"
                          onClick={() => toggleChannel(channel.id)}
                          className={cn(
                            "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left",
                            formData.channelIds.includes(channel.id)
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                              : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                          )}
                        >
                          <span className="truncate">{channel.name}</span>
                          {formData.channelIds.includes(channel.id) && <Check size={14} />}
                        </button>
                      ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-3 sticky bottom-0 bg-white">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                  >
                    {editingPackage ? "Update Package" : "Save Package"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
