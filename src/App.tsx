import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { auth } from "./lib/firebase";
import { signOut } from "firebase/auth";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Tv, 
  ListTree, 
  LogOut, 
  Menu,
  ShieldCheck
} from "lucide-react";
import { cn } from "./lib/utils";
import { motion, AnimatePresence } from "motion/react";

// Import real pages
import Dashboard from "./pages/Dashboard";
import UsersPage from "./pages/UsersPage";
import PackagesPage from "./pages/PackagesPage";
import ChannelsPage from "./pages/ChannelsPage";
import CategoriesPage from "./pages/CategoriesPage";
import LoginPage from "./pages/LoginPage";
import { ErrorBoundary } from "./components/ErrorBoundary";

const SidebarItem: React.FC<{ to: string, icon: any, label: string, active: boolean }> = ({ to, icon: Icon, label, active }) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
      active 
        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
    )}
  >
    <Icon size={20} className={cn(active ? "text-white" : "text-slate-400 group-hover:text-slate-900")} />
    <span className="font-medium">{label}</span>
    {active && <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
  </Link>
);

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, displayName, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout(); // Clear session flag
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const menuItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/users", icon: Users, label: "Users" },
    { to: "/packages", icon: Package, label: "Packages" },
    { to: "/channels", icon: Tv, label: "Channels" },
    { to: "/categories", icon: ListTree, label: "Categories" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center gap-3 px-2 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">
              <ShieldCheck size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">IPTV Admin</h1>
          </div>

          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => (
              <SidebarItem 
                key={item.to} 
                to={item.to}
                icon={item.icon}
                label={item.label}
                active={location.pathname === item.to} 
              />
            ))}
          </nav>

          <div className="pt-4 border-t border-slate-100">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors group"
            >
              <LogOut size={20} className="group-hover:translate-x-0.5 transition-transform" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">{displayName || user?.email || "Admin User"}</p>
              <p className="text-xs text-slate-500 font-medium">Administrator</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'Admin'}`} alt="Avatar" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Initializing Admin Panel...</p>
      </div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  
  return <Layout>{children}</Layout>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
            <Route path="/packages" element={<ProtectedRoute><PackagesPage /></ProtectedRoute>} />
            <Route path="/channels" element={<ProtectedRoute><ChannelsPage /></ProtectedRoute>} />
            <Route path="/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </ErrorBoundary>
      </Router>
    </AuthProvider>
  );
}
