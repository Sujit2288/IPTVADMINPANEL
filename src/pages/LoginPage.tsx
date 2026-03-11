import React, { useState } from "react";
import { auth, db } from "../lib/firebase";
import { signInWithEmailAndPassword, signInAnonymously } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { LogIn, ShieldCheck, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../lib/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Hardcoded check as requested
      if (username === "Sujit@123" && password === "Sujit@123") {
      try {
        // We still sign in anonymously to Firebase so Firestore rules (auth != null) work
        try {
          await signInAnonymously(auth);
        } catch (authErr: any) {
          console.error("Firebase Auth failed:", authErr);
          // If auth fails, we show a warning but might still try to proceed 
          // though most Firestore features will likely fail.
          if (authErr.code === 'auth/unauthorized-domain') {
            throw new Error("This domain is not authorized in Firebase. Please add this URL to the 'Authorized Domains' list in your Firebase Auth settings.");
          }
        }
        
        // Try to ensure this user is recognized as an admin in Firestore, but don't block if it fails
        // since we now handle admin status in AuthContext session storage.
        if (auth.currentUser) {
          try {
            await setDoc(doc(db, "admins", auth.currentUser.uid), {
              uid: auth.currentUser.uid,
              email: "admin@sujit.com",
              role: "admin"
            });
          } catch (firestoreErr: any) {
            console.warn("Could not register admin in Firestore (likely permission denied), but proceeding with session auth.");
          }
        }

        login(); // Set session flag and admin flag in AuthContext
        navigate("/");
      } catch (err: any) {
        setError(`System initialization failed: ${err.message || "Unknown error"}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else {
      setError("Invalid username or password.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 p-8"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-200">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Portal</h1>
          <p className="text-slate-500 text-center mt-2">
            Enter credentials to manage your IPTV network
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3 text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
              placeholder="Enter username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "Verifying..." : (
              <>
                <LogIn size={20} />
                Sign In
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
