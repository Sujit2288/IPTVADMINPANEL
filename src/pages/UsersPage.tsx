import React, { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  serverTimestamp
} from "firebase/firestore";
import { 
  MoreVertical, 
  Plus, 
  Search, 
  Filter, 
  UserPlus, 
  Trash2, 
  Edit2, 
  Ban, 
  CheckCircle2, 
  RefreshCw,
  X,
  ArrowLeftRight
} from "lucide-react";
import { User, UserStatus, Package } from "../types";
import { cn } from "../lib/utils";
import { format } from "date-fns";
import { motion, AnimatePresence } from "motion/react";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [pendingUserToSwap, setPendingUserToSwap] = useState<User | null>(null);
  const [swapSearchTerm, setSwapSearchTerm] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [rechargeUser, setRechargeUser] = useState<User | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    macAddress: "",
    status: UserStatus.PENDING,
    expiryDate: format(new Date(), "yyyy-MM-dd"),
    packageId: "",
    packageName: ""
  });

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usersData);
      setLoading(false);
    });

    const unsubPackages = onSnapshot(collection(db, "packages"), (snapshot) => {
      const packagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Package));
      setPackages(packagesData);
    });

    return () => {
      unsubUsers();
      unsubPackages();
    };
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await updateDoc(doc(db, "users", editingUser.id), {
          ...formData,
          lastActive: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, "users"), {
          ...formData,
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      setEditingUser(null);
      setFormData({
        name: "",
        macAddress: "",
        status: UserStatus.PENDING,
        expiryDate: format(new Date(), "yyyy-MM-dd"),
        packageId: "",
        packageName: ""
      });
    } catch (err) {
      console.error("Error adding user:", err);
    }
  };

  const handleDeleteUser = (id: string) => {
    setDeleteConfirmId(id);
    setActiveMenu(null);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteDoc(doc(db, "users", deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user. Please try again.");
    }
  };

  const handleRecharge = async (user: User, pkg: Package) => {
    try {
      const currentExpiry = user.expiryDate ? new Date(user.expiryDate) : new Date();
      const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
      const newExpiry = new Date(baseDate);
      newExpiry.setDate(newExpiry.getDate() + pkg.validityDays);
      
      await updateDoc(doc(db, "users", user.id), {
        packageId: pkg.id,
        packageName: pkg.name,
        expiryDate: format(newExpiry, "yyyy-MM-dd"),
        status: UserStatus.ACTIVE,
        lastActive: serverTimestamp()
      });
      
      setRechargeUser(null);
      setActiveMenu(null);
    } catch (err) {
      console.error("Error recharging user:", err);
      alert("Failed to recharge user.");
    }
  };

  const handleStatusChange = async (id: string, newStatus: UserStatus) => {
    await updateDoc(doc(db, "users", id), { status: newStatus });
    setActiveMenu(null);
  };

  const handleSwapMAC = async (targetUser: User) => {
    if (!pendingUserToSwap) return;
    
    if (window.confirm(`Are you sure you want to swap MAC ${pendingUserToSwap.macAddress} to user ${targetUser.name}?`)) {
      try {
        // Update existing user with new MAC
        await updateDoc(doc(db, "users", targetUser.id), {
          macAddress: pendingUserToSwap.macAddress
        });
        
        // Delete the pending request
        await deleteDoc(doc(db, "users", pendingUserToSwap.id));
        
        setIsSwapModalOpen(false);
        setPendingUserToSwap(null);
        setActiveMenu(null);
      } catch (err) {
        console.error("Error swapping MAC:", err);
      }
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.macAddress || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const s = status?.toUpperCase();
    switch (s) {
      case "ACTIVE": return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case "EXPIRED": return "text-rose-600 bg-rose-50 border-rose-100";
      case "PENDING": return "text-amber-600 bg-amber-50 border-amber-100";
      case "DENIED": return "text-slate-600 bg-slate-50 border-slate-100";
      default: return "text-slate-600 bg-slate-50 border-slate-100";
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
          <p className="text-slate-500">Manage your IPTV users and their subscriptions.</p>
        </div>
        <button 
          onClick={() => {
            setEditingUser(null);
            setFormData({
              name: "",
              macAddress: "",
              status: UserStatus.PENDING,
              expiryDate: format(new Date(), "yyyy-MM-dd"),
              packageId: ""
            });
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          Add User
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or MAC address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter size={18} />
            <span>Filter</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">MAC Address</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Expiry Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Package</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{user.name}</span>
                        <span className="text-[10px] font-mono text-indigo-600/60">{user.macAddress}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-slate-600">{user.macAddress}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold border",
                      getStatusColor(user.status)
                    )}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {user.expiryDate ? format(new Date(user.expiryDate), "MMM dd, yyyy") : "No Expiry"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {user.packageName || packages.find(p => p.id === user.packageId)?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <button 
                      onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)}
                      className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                    >
                      <MoreVertical size={20} />
                    </button>

                    <AnimatePresence>
                      {activeMenu === user.id && (
                        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
                            onClick={() => setActiveMenu(null)} 
                          />
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-[280px] bg-white rounded-[32px] shadow-2xl border border-slate-100 z-[71] py-6 overflow-hidden"
                          >
                            <div className="px-6 pb-4 mb-4 border-b border-slate-50">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">User Actions</p>
                              <p className="text-base font-bold text-slate-900 truncate">{user.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Device MAC:</span>
                                <span className="text-xs font-mono font-bold text-indigo-600">{user.macAddress}</span>
                              </div>
                            </div>

                            <div className="px-3 space-y-1">
                              {user.status?.toUpperCase() === "PENDING" && (
                                <>
                                  <button 
                                    onClick={() => {
                                      setEditingUser(user);
                                      setFormData({
                                        name: user.name,
                                        macAddress: user.macAddress,
                                        status: user.status,
                                        expiryDate: user.expiryDate || format(new Date(), "yyyy-MM-dd"),
                                        packageId: user.packageId,
                                        packageName: user.packageName || ""
                                      });
                                      setIsModalOpen(true);
                                      setActiveMenu(null);
                                    }}
                                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 w-full text-left rounded-2xl transition-colors"
                                  >
                                    <Edit2 size={18} />
                                    Edit User
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setRechargeUser(user);
                                      setActiveMenu(null);
                                    }}
                                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 w-full text-left rounded-2xl transition-colors"
                                  >
                                    <RefreshCw size={18} />
                                    Recharge User
                                  </button>
                                  <button 
                                    onClick={() => handleStatusChange(user.id, UserStatus.ACTIVE)}
                                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 w-full text-left rounded-2xl transition-colors"
                                  >
                                    <CheckCircle2 size={18} />
                                    Activate User
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setPendingUserToSwap(user);
                                      setIsSwapModalOpen(true);
                                      setActiveMenu(null);
                                    }}
                                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 w-full text-left rounded-2xl transition-colors"
                                  >
                                    <ArrowLeftRight size={18} />
                                    Swap MAC
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 w-full text-left rounded-2xl transition-colors"
                                  >
                                    <Trash2 size={18} />
                                    Delete User
                                  </button>
                                </>
                              )}

                              {user.status?.toUpperCase() === "EXPIRED" && (
                                <>
                                  <button 
                                    onClick={() => {
                                      setEditingUser(user);
                                      setFormData({
                                        name: user.name,
                                        macAddress: user.macAddress,
                                        status: user.status,
                                        expiryDate: user.expiryDate || format(new Date(), "yyyy-MM-dd"),
                                        packageId: user.packageId,
                                        packageName: user.packageName || ""
                                      });
                                      setIsModalOpen(true);
                                      setActiveMenu(null);
                                    }}
                                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 w-full text-left rounded-2xl transition-colors"
                                  >
                                    <Edit2 size={18} />
                                    Edit User
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setRechargeUser(user);
                                      setActiveMenu(null);
                                    }}
                                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 w-full text-left rounded-2xl transition-colors"
                                  >
                                    <RefreshCw size={18} />
                                    Recharge User
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 w-full text-left rounded-2xl transition-colors"
                                  >
                                    <Trash2 size={18} />
                                    Delete User
                                  </button>
                                </>
                              )}

                              {user.status?.toUpperCase() === "ACTIVE" && (
                                <>
                                  <button 
                                    onClick={() => {
                                      setEditingUser(user);
                                      setFormData({
                                        name: user.name,
                                        macAddress: user.macAddress,
                                        status: user.status,
                                        expiryDate: user.expiryDate || format(new Date(), "yyyy-MM-dd"),
                                        packageId: user.packageId,
                                        packageName: user.packageName || ""
                                      });
                                      setIsModalOpen(true);
                                      setActiveMenu(null);
                                    }}
                                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 w-full text-left rounded-2xl transition-colors"
                                  >
                                    <Edit2 size={18} />
                                    Edit User
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setRechargeUser(user);
                                      setActiveMenu(null);
                                    }}
                                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 w-full text-left rounded-2xl transition-colors"
                                  >
                                    <RefreshCw size={18} />
                                    Recharge User
                                  </button>
                                  <button 
                                    onClick={() => handleStatusChange(user.id, UserStatus.DENIED)}
                                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-amber-600 hover:bg-amber-50 w-full text-left rounded-2xl transition-colors"
                                  >
                                    <Ban size={18} />
                                    Deny User
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 w-full text-left rounded-2xl transition-colors"
                                  >
                                    <Trash2 size={18} />
                                    Delete User
                                  </button>
                                </>
                              )}

                              {user.status?.toUpperCase() === "DENIED" && (
                                <>
                                  <button 
                                    onClick={() => {
                                      setEditingUser(user);
                                      setFormData({
                                        name: user.name,
                                        macAddress: user.macAddress,
                                        status: user.status,
                                        expiryDate: user.expiryDate || format(new Date(), "yyyy-MM-dd"),
                                        packageId: user.packageId,
                                        packageName: user.packageName || ""
                                      });
                                      setIsModalOpen(true);
                                      setActiveMenu(null);
                                    }}
                                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 w-full text-left rounded-2xl transition-colors"
                                  >
                                    <Edit2 size={18} />
                                    Edit User
                                  </button>
                                  <button 
                                    onClick={() => handleStatusChange(user.id, UserStatus.ACTIVE)}
                                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 w-full text-left rounded-2xl transition-colors"
                                  >
                                    <CheckCircle2 size={18} />
                                    Undeny User
                                  </button>
                                </>
                              )}

                              {!["PENDING", "ACTIVE", "EXPIRED", "DENIED"].includes(user.status?.toUpperCase() || "") && (
                                <>
                                  <button 
                                    onClick={() => {
                                      setEditingUser(user);
                                      setFormData({
                                        name: user.name,
                                        macAddress: user.macAddress,
                                        status: user.status,
                                        expiryDate: user.expiryDate || format(new Date(), "yyyy-MM-dd"),
                                        packageId: user.packageId,
                                        packageName: user.packageName || ""
                                      });
                                      setIsModalOpen(true);
                                      setActiveMenu(null);
                                    }}
                                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 w-full text-left rounded-2xl transition-colors"
                                  >
                                    <Edit2 size={18} />
                                    Edit User
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 w-full text-left rounded-2xl transition-colors"
                                  >
                                    <Trash2 size={18} />
                                    Delete User
                                  </button>
                                </>
                              )}
                            </div>

                            <div className="mt-6 px-6 pt-4 border-t border-slate-50">
                              <button 
                                onClick={() => setActiveMenu(null)}
                                className="w-full py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors text-sm"
                              >
                                Close
                              </button>
                            </div>
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal */}
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
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingUser ? "Edit User" : "Add New User"}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="Enter user's full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">MAC Address</label>
                  <input 
                    type="text" 
                    required
                    disabled={!!editingUser}
                    value={formData.macAddress}
                    onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono",
                      editingUser && "bg-slate-50 text-slate-500 cursor-not-allowed"
                    )}
                    placeholder="00:1A:2B:3C:4D:5E"
                  />
                  {editingUser && <p className="text-[10px] text-slate-400 mt-1">MAC address cannot be changed after creation.</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      {Object.values(UserStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Expiry Date</label>
                    <input 
                      type="date" 
                      required
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Package</label>
                  <select 
                    required
                    value={formData.packageId}
                    onChange={(e) => {
                      const pkg = packages.find(p => p.id === e.target.value);
                      setFormData({ 
                        ...formData, 
                        packageId: e.target.value,
                        packageName: pkg ? pkg.name : "" 
                      });
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    <option value="">Select a package</option>
                    {packages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>{pkg.name} (${pkg.price})</option>
                    ))}
                  </select>
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
                    {editingUser ? "Update User" : "Save User"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Swap MAC Modal */}
      <AnimatePresence>
        {isSwapModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setIsSwapModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Swap MAC Address</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Select an existing user to receive MAC: <span className="font-mono font-bold text-indigo-600">{pendingUserToSwap?.macAddress}</span>
                  </p>
                </div>
                <button onClick={() => setIsSwapModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search existing users..."
                  value={swapSearchTerm}
                  onChange={(e) => setSwapSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {users
                  .filter(u => u.status?.toUpperCase() !== "PENDING")
                  .filter(u => 
                    u.name.toLowerCase().includes(swapSearchTerm.toLowerCase()) || 
                    (u.macAddress || "").toLowerCase().includes(swapSearchTerm.toLowerCase())
                  )
                  .map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleSwapMAC(user)}
                      className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all text-left group"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">Current MAC: {user.macAddress}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold border mb-2",
                          getStatusColor(user.status)
                        )}>
                          {user.status}
                        </span>
                        <ArrowLeftRight size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                      </div>
                    </button>
                  ))}
                {users.filter(u => u.status !== UserStatus.PENDING).length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    No existing users available to swap.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Recharge Modal */}
        {rechargeUser && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setRechargeUser(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Recharge User</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Select a package to recharge <span className="font-bold text-indigo-600">{rechargeUser.name}</span>
                  </p>
                </div>
                <button onClick={() => setRechargeUser(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {packages.map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => handleRecharge(rechargeUser, pkg)}
                    className="w-full flex items-center justify-between p-5 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all text-left group"
                  >
                    <div>
                      <p className="font-bold text-slate-900 text-lg">{pkg.name}</p>
                      <p className="text-sm text-slate-500 mt-1">Validity: {pkg.validityDays} Days</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-indigo-600">${pkg.price}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-1">Select Package</p>
                    </div>
                  </button>
                ))}
                {packages.length === 0 && (
                  <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400">No packages available.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[32px] shadow-2xl p-8 text-center overflow-hidden"
            >
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={40} className="text-rose-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Delete User?</h3>
              <p className="text-slate-500 mb-8">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  className="py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="py-4 rounded-2xl bg-rose-500 text-white font-bold hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all active:scale-95"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
