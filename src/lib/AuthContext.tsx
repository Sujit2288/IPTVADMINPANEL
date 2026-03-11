import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionAuth, setSessionAuth] = useState(false);

  useEffect(() => {
    // Check session storage for authentication
    const isAuth = sessionStorage.getItem("admin_auth") === "true";
    const isStoredAdmin = sessionStorage.getItem("is_admin") === "true";
    setSessionAuth(isAuth);
    if (isStoredAdmin) setIsAdmin(true);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser && !isStoredAdmin) {
        // Check if user is admin in Firestore
        try {
          const adminDoc = await getDoc(doc(db, "admins", firebaseUser.uid));
          setIsAdmin(adminDoc.exists());
        } catch (err) {
          console.error("Error checking admin status:", err);
        }
      } else if (!firebaseUser && !isStoredAdmin) {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = () => {
    sessionStorage.setItem("admin_auth", "true");
    sessionStorage.setItem("is_admin", "true");
    setSessionAuth(true);
    setIsAdmin(true);
  };

  const logout = () => {
    sessionStorage.removeItem("admin_auth");
    sessionStorage.removeItem("is_admin");
    setSessionAuth(false);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user: sessionAuth ? user : null, 
      isAdmin: sessionAuth ? isAdmin : false, 
      loading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};
