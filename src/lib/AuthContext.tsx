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
    setSessionAuth(isAuth);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Check if user is admin in Firestore
        const adminDoc = await getDoc(doc(db, "admins", firebaseUser.uid));
        setIsAdmin(adminDoc.exists());
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = () => {
    sessionStorage.setItem("admin_auth", "true");
    setSessionAuth(true);
  };

  const logout = () => {
    sessionStorage.removeItem("admin_auth");
    setSessionAuth(false);
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
