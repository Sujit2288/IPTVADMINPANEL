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
  Tv, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Search,
  ExternalLink,
  Image as ImageIcon,
  PlusCircle,
  Shield,
  Info
} from "lucide-react";
import { Channel, Category, ChannelSource } from "../types";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    channelNumber: 1,
    sources: [{ name: "Server 1", url: "", type: "hls" as "hls" | "dash", drm: { kid: "", key: "" } }] as ChannelSource[],
    categoryId: "",
    logoUrl: "",
    description: ""
  });

  const addSource = () => {
    setFormData({
      ...formData,
      sources: [...formData.sources, { name: `Server ${formData.sources.length + 1}`, url: "", type: "hls", drm: { kid: "", key: "" } }]
    });
  };

  const removeSource = (index: number) => {
    if (formData.sources.length <= 1) return;
    const newSources = [...formData.sources];
    newSources.splice(index, 1);
    setFormData({ ...formData, sources: newSources });
  };

  const updateSource = (index: number, field: keyof ChannelSource | "drm_kid" | "drm_key", value: string) => {
    const newSources = [...formData.sources] as ChannelSource[];
    if (field === "drm_kid") {
      newSources[index] = { ...newSources[index], drm: { kid: value, key: newSources[index].drm?.key || "" } };
    } else if (field === "drm_key") {
      newSources[index] = { ...newSources[index], drm: { kid: newSources[index].drm?.kid || "", key: value } };
    } else {
      newSources[index] = { ...newSources[index], [field]: value } as ChannelSource;
    }
    setFormData({ ...formData, sources: newSources });
  };

  useEffect(() => {
    const unsubChannels = onSnapshot(collection(db, "channels"), (snapshot) => {
      const channelsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel));
      setChannels(channelsData);
      setLoading(false);
    });

    const unsubCategories = onSnapshot(collection(db, "categories"), (snapshot) => {
      const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(categoriesData);
    });

    return () => {
      unsubChannels();
      unsubCategories();
    };
  }, []);

  const handleSaveChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Clean up DRM if not provided
      const cleanedSources = formData.sources.map(source => {
        if (source.drm && (!source.drm.kid || !source.drm.key)) {
          const { drm, ...rest } = source;
          return rest;
        }
        return source;
      });

      const dataToSave = {
        ...formData,
        sources: cleanedSources
      };

      if (editingChannel) {
        await updateDoc(doc(db, "channels", editingChannel.id), dataToSave);
      } else {
        await addDoc(collection(db, "channels"), dataToSave);
      }
      setIsModalOpen(false);
      setEditingChannel(null);
      setFormData({ 
        name: "", 
        channelNumber: 1,
        sources: [{ name: "Server 1", url: "", type: "hls", drm: { kid: "", key: "" } }], 
        categoryId: "", 
        logoUrl: "",
        description: ""
      });
    } catch (err) {
      console.error("Error saving channel:", err);
    }
  };

  const handleDeleteChannel = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this channel?")) {
      await deleteDoc(doc(db, "channels", id));
    }
  };

  const filteredChannels = channels
    .filter(channel => 
      (channel.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => (a.channelNumber || 0) - (b.channelNumber || 0));

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Channel Management</h2>
          <p className="text-slate-500">Manage your IPTV channel list and stream sources.</p>
        </div>
        <button 
          onClick={() => {
            const nextNumber = channels.length > 0 
              ? Math.max(...channels.map(c => c.channelNumber || 0)) + 1 
              : 1;
            setEditingChannel(null);
            setFormData({ 
              name: "", 
              channelNumber: nextNumber,
              sources: [{ name: "Server 1", url: "", type: "hls", drm: { kid: "", key: "" } }], 
              categoryId: "", 
              logoUrl: "",
              description: ""
            });
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          Add Channel
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-8">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search channels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
          {filteredChannels.map((channel) => (
            <motion.div 
              key={channel.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative bg-slate-50 rounded-2xl p-4 border border-slate-100 hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-xl border border-slate-100 overflow-hidden flex items-center justify-center shadow-sm relative">
                  <div className="absolute top-0 left-0 bg-indigo-600 text-white text-[8px] font-bold px-1 rounded-br-lg z-10">
                    #{channel.channelNumber}
                  </div>
                  {channel.logoUrl ? (
                    <img 
                      src={channel.logoUrl} 
                      alt={channel.name} 
                      className="w-full h-full object-contain p-1"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://api.dicebear.com/7.x/initials/svg?seed=" + channel.name;
                      }}
                    />
                  ) : (
                    <Tv size={24} className="text-slate-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 truncate">{channel.name}</h3>
                  <p className="text-xs text-slate-500 font-medium truncate">
                    {categories.find(c => c.id === channel.categoryId)?.name || "Uncategorized"}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 pt-4 border-t border-slate-200/50">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {channel.sources?.length || 0} Sources
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setEditingChannel(channel);
                        setFormData({
                          name: channel.name,
                          channelNumber: channel.channelNumber || 1,
                          sources: channel.sources || [{ name: "Server 1", url: "", type: "hls", drm: { kid: "", key: "" } }],
                          categoryId: channel.categoryId,
                          logoUrl: channel.logoUrl,
                          description: channel.description || ""
                        });
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteChannel(channel.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {channel.sources?.[0] && (
                  <a 
                    href={channel.sources[0].url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink size={12} />
                    PRIMARY: {channel.sources[0].name}
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Channel Modal */}
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
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8 sticky top-0 bg-white z-10 pb-2">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingChannel ? "Edit Channel" : "Add New Channel"}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveChannel} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Channel Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="e.g. HBO HD"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Channel No.</label>
                    <input 
                      type="number" 
                      required
                      value={formData.channelNumber}
                      onChange={(e) => setFormData({ ...formData, channelNumber: Number(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                    <select 
                      required
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      <option value="">Select a category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="e.g. World, Qatar, etc."
                    rows={2}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Tv size={18} className="text-indigo-600" />
                      Stream Sources
                    </label>
                    <button 
                      type="button"
                      onClick={addSource}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 px-3 py-1.5 bg-indigo-50 rounded-lg transition-colors"
                    >
                      <PlusCircle size={14} />
                      Add Server
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.sources.map((source, index) => (
                      <div key={index} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 relative">
                        {formData.sources.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => removeSource(index)}
                            className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Server Name</label>
                            <input 
                              type="text" 
                              required
                              value={source.name}
                              onChange={(e) => updateSource(index, "name", e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                              placeholder="Server 1"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Stream URL</label>
                            <input 
                              type="url" 
                              required
                              value={source.url}
                              onChange={(e) => updateSource(index, "url", e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                              placeholder="https://..."
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-6">
                          <div className="flex items-center gap-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Type:</label>
                            <div className="flex bg-white rounded-lg p-1 border border-slate-200">
                              <button 
                                type="button"
                                onClick={() => updateSource(index, "type", "hls")}
                                className={cn(
                                  "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                                  source.type === "hls" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
                                )}
                              >
                                HLS
                              </button>
                              <button 
                                type="button"
                                onClick={() => updateSource(index, "type", "dash")}
                                className={cn(
                                  "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                                  source.type === "dash" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
                                )}
                              >
                                DASH
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">DRM Protection:</label>
                            <button 
                              type="button"
                              onClick={() => {
                                const newSources = [...formData.sources] as ChannelSource[];
                                if (newSources[index].drm) {
                                  const { drm, ...rest } = newSources[index];
                                  newSources[index] = rest as ChannelSource;
                                } else {
                                  newSources[index] = { ...newSources[index], drm: { kid: "", key: "" } };
                                }
                                setFormData({ ...formData, sources: newSources });
                              }}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border",
                                source.drm ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-white border-slate-200 text-slate-500"
                              )}
                            >
                              <Shield size={12} />
                              {source.drm ? "DRM ENABLED" : "DRM DISABLED"}
                            </button>
                          </div>
                        </div>

                        {source.drm && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200/50"
                          >
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">DRM KID</label>
                              <input 
                                type="text" 
                                value={source.drm.kid}
                                onChange={(e) => updateSource(index, "drm_kid", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="7995c724a13748ed970840a8ab5bb9b3"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">DRM KEY</label>
                              <input 
                                type="text" 
                                value={source.drm.key}
                                onChange={(e) => updateSource(index, "drm_key", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="67bdaf1e2175b9ff682fcdf0e2354b1e"
                              />
                            </div>
                          </motion.div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Channel Logo URL</label>
                  <div className="flex gap-3">
                    <input 
                      type="url" 
                      value={formData.logoUrl}
                      onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                      placeholder="https://example.com/logo.png"
                    />
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                      {formData.logoUrl ? (
                        <img src={formData.logoUrl} alt="Preview" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
                      ) : (
                        <ImageIcon size={20} className="text-slate-300" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
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
                    {editingChannel ? "Update Channel" : "Save Channel"}
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
