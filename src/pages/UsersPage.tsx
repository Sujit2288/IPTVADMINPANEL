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
  where 
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

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    mac: "",
    status: UserStatus.PENDING,
    expiryDate: format(new Date(), "yyyy-MM-dd"),
    packageId: ""
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
        await updateDoc(doc(db, "users", editingUser.id), formData);
      } else {
        await addDoc(collection(db, "users"), formData);
      }
      setIsModalOpen(false);
      setEditingUser(null);
      setFormData({
        name: "",
        mac: "",
        status: UserStatus.PENDING,
        expiryDate: format(new Date(), "yyyy-MM-dd"),
        packageId: ""
      });
    } catch (err) {
      console.error("Error adding user:", err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      await deleteDoc(doc(db, "users", id));
    }
  };

  const handleStatusChange = async (id: string, newStatus: UserStatus) => {
    await updateDoc(doc(db, "users", id), { status: newStatus });
    setActiveMenu(null);
  };

  const handleSwapMAC = async (targetUser: User) => {
    if (!pendingUserToSwap) return;
    
    if (window.confirm(`Are you sure you want to swap MAC ${pendingUserToSwap.mac} to user ${targetUser.name}?`)) {
      try {
        // Update existing user with new MAC
        await updateDoc(doc(db, "users", targetUser.id), {
          mac: pendingUserToSwap.mac
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
    user.mac.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE: return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case UserStatus.EXPIRED: return "text-rose-600 bg-rose-50 border-rose-100";
      case UserStatus.PENDING: return "text-amber-600 bg-amber-50 border-amber-100";
      case UserStatus.DENIED: return "text-slate-600 bg-slate-50 border-slate-100";
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
              mac: "",
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
                      <span className="font-semibold text-slate-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-slate-600">{user.mac}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold border",
                      getStatusColor(user.status)
                    )}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {format(new Date(user.expiryDate), "MMM dd, yyyy")}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {packages.find(p => p.id === user.packageId)?.name || "N/A"}
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
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setActiveMenu(null)} 
                          />
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-6 top-12 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-20 py-2"
                          >
                            {user.status === UserStatus.PENDING && (
                              <>
                                <button 
                                  onClick={() => handleStatusChange(user.id, UserStatus.ACTIVE)}
                                  className="flex items-center gap-3 px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 w-full text-left"
                                >
                                  <CheckCircle2 size={16} />
                                  Add User (Activate)
                                </button>
                                <button 
                                  onClick={() => {
                                    setPendingUserToSwap(user);
                                    setIsSwapModalOpen(true);
                                    setActiveMenu(null);
                                  }}
                                  className="flex items-center gap-3 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 w-full text-left"
                                >
                                  <ArrowLeftRight size={16} />
                                  Swap MAC
                                </button>
                                <button 
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="flex items-center gap-3 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 w-full text-left"
                                >
                                  <Trash2 size={16} />
                                  Delete User
                                </button>
                              </>
                            )}

                            {user.status === UserStatus.EXPIRED && (
                              <>
                                <button 
                                  onClick={() => {
                                    setEditingUser(user);
                                    setFormData({
                                      name: user.name,
                                      mac: user.mac,
                                      status: user.status,
                                      expiryDate: user.expiryDate,
                                      packageId: user.packageId
                                    });
                                    setIsModalOpen(true);
                                    setActiveMenu(null);
                                  }}
                                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 w-full text-left"
                                >
                                  <Edit2 size={16} />
                                  Edit User
                                </button>
                                <button 
                                  onClick={() => handleStatusChange(user.id, UserStatus.ACTIVE)}
                                  className="flex items-center gap-3 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 w-full text-left"
                                >
                                  <RefreshCw size={16} />
                                  Recharge User
                                </button>
                                <button 
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="flex items-center gap-3 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 w-full text-left"
                                >
                                  <Trash2 size={16} />
                                  Delete User
                                </button>
                              </>
                            )}

                            {user.status === UserStatus.ACTIVE && (
                              <>
                                <button 
                                  onClick={() => {
                                    setEditingUser(user);
                                    setFormData({
                                      name: user.name,
                                      mac: user.mac,
                                      status: user.status,
                                      expiryDate: user.expiryDate,
                                      packageId: user.packageId
                                    });
                                    setIsModalOpen(true);
                                    setActiveMenu(null);
                                  }}
                                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 w-full text-left"
                                >
                                  <Edit2 size={16} />
                                  Edit User
                                </button>
                                <button 
                                  onClick={() => handleStatusChange(user.id, UserStatus.DENIED)}
                                  className="flex items-center gap-3 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 w-full text-left"
                                >
                                  <Ban size={16} />
                                  Deny User
                                </button>
                                <button 
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="flex items-center gap-3 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 w-full text-left"
                                >
                                  <Trash2 size={16} />
                                  Delete User
                                </button>
                              </>
                            )}

                            {user.status === UserStatus.DENIED && (
                              <>
                                <button 
                                  onClick={() => {
                                    setEditingUser(user);
                                    setFormData({
                                      name: user.name,
                                      mac: user.mac,
                                      status: user.status,
                                      expiryDate: user.expiryDate,
                                      packageId: user.packageId
                                    });
                                    setIsModalOpen(true);
                                    setActiveMenu(null);
                                  }}
                                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 w-full text-left"
                                >
                                  <Edit2 size={16} />
                                  Edit User
                                </button>
                                <button 
                                  onClick={() => handleStatusChange(user.id, UserStatus.ACTIVE)}
                                  className="flex items-center gap-3 px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 w-full text-left"
                                >
                                  <CheckCircle2 size={16} />
                                  Undeny User
                                </button>
                              </>
                            )}
                          </motion.div>
                        </>
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
                    value={formData.mac}
                    onChange={(e) => setFormData({ ...formData, mac: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono"
                    placeholder="00:1A:2B:3C:4D:5E"
                  />
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
                    onChange={(e) => setFormData({ ...formData, packageId: e.target.value })}
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
                    Select an existing user to receive MAC: <span className="font-mono font-bold text-indigo-600">{pendingUserToSwap?.mac}</span>
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
                  .filter(u => u.status !== UserStatus.PENDING)
                  .filter(u => 
                    u.name.toLowerCase().includes(swapSearchTerm.toLowerCase()) || 
                    u.mac.toLowerCase().includes(swapSearchTerm.toLowerCase())
                  )
                  .map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleSwapMAC(user)}
                      className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all text-left group"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">Current MAC: {user.mac}</p>
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
      </AnimatePresence>
    </div>
  );
}
