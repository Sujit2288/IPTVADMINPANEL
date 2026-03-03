import React, { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { 
  Users, 
  Package, 
  Tv, 
  DollarSign, 
  UserCheck, 
  UserX, 
  UserPlus, 
  Ban,
  TrendingUp
} from "lucide-react";
import { motion } from "motion/react";
import { UserStatus } from "../types";

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        {trend && (
          <div className="flex items-center gap-1 mt-2 text-emerald-600 text-xs font-semibold">
            <TrendingUp size={14} />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className={cn("p-3 rounded-2xl", color)}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </motion.div>
);

import { cn } from "../lib/utils";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    expiredUsers: 0,
    pendingUsers: 0,
    deniedUsers: 0,
    totalPackages: 0,
    totalChannels: 0,
    revenue: 0
  });

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const users = snapshot.docs.map(doc => doc.data());
      setStats(prev => ({
        ...prev,
        totalUsers: snapshot.size,
        activeUsers: users.filter(u => u.status === UserStatus.ACTIVE).length,
        expiredUsers: users.filter(u => u.status === UserStatus.EXPIRED).length,
        pendingUsers: users.filter(u => u.status === UserStatus.PENDING).length,
        deniedUsers: users.filter(u => u.status === UserStatus.DENIED).length,
      }));
    });

    const unsubPackages = onSnapshot(collection(db, "packages"), (snapshot) => {
      setStats(prev => ({ ...prev, totalPackages: snapshot.size }));
    });

    const unsubChannels = onSnapshot(collection(db, "channels"), (snapshot) => {
      setStats(prev => ({ ...prev, totalChannels: snapshot.size }));
    });

    return () => {
      unsubUsers();
      unsubPackages();
      unsubChannels();
    };
  }, []);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
        <p className="text-slate-500">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Users" 
          value={stats.totalUsers} 
          icon={Users} 
          color="bg-indigo-600 shadow-indigo-200 shadow-lg" 
        />
        <StatCard 
          title="Active Users" 
          value={stats.activeUsers} 
          icon={UserCheck} 
          color="bg-emerald-500 shadow-emerald-200 shadow-lg" 
        />
        <StatCard 
          title="Expired Users" 
          value={stats.expiredUsers} 
          icon={UserX} 
          color="bg-amber-500 shadow-amber-200 shadow-lg" 
        />
        <StatCard 
          title="Denied Users" 
          value={stats.deniedUsers} 
          icon={Ban} 
          color="bg-rose-500 shadow-rose-200 shadow-lg" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Pending Users" 
          value={stats.pendingUsers} 
          icon={UserPlus} 
          color="bg-slate-400 shadow-slate-200 shadow-lg" 
        />
        <StatCard 
          title="Total Packages" 
          value={stats.totalPackages} 
          icon={Package} 
          color="bg-violet-600 shadow-violet-200 shadow-lg" 
        />
        <StatCard 
          title="Total Channels" 
          value={stats.totalChannels} 
          icon={Tv} 
          color="bg-sky-500 shadow-sky-200 shadow-lg" 
        />
        <StatCard 
          title="Monthly Revenue" 
          value={`$${stats.revenue}`} 
          icon={DollarSign} 
          color="bg-indigo-900 shadow-indigo-300 shadow-lg" 
          trend="+12.5% vs last month"
        />
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <UserPlus size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">New user registered</p>
                  <p className="text-xs text-slate-500">User "John Doe" with MAC 00:1A:2B:3C:4D:5E</p>
                  <p className="text-[10px] text-slate-400 mt-1">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">System Status</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-slate-700">Database Connection</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">ONLINE</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-slate-700">Streaming Server</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">ONLINE</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-slate-700">Auth Service</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">ONLINE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
