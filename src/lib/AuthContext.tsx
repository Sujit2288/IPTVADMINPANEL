import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  displayName: string | null;
  isAdmin: boolean;
  loading: boolean;
  login: (name: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  displayName: null,
  isAdmin: false,
  loading: true,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionAuth, setSessionAuth] = useState(false);

  useEffect(() => {
    // Check session storage for authentication
    const isAuth = sessionStorage.getItem("admin_auth") === "true";
    const storedName = sessionStorage.getItem("admin_name");
    setSessionAuth(isAuth);
    setDisplayName(storedName);

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

  const login = (name: string) => {
    sessionStorage.setItem("admin_auth", "true");
    sessionStorage.setItem("admin_name", name);
    setSessionAuth(true);
    setDisplayName(name);
  };

  const logout = () => {
    sessionStorage.removeItem("admin_auth");
    sessionStorage.removeItem("admin_name");
    setSessionAuth(false);
    setDisplayName(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user: sessionAuth ? user : null, 
      displayName: sessionAuth ? displayName : null,
      isAdmin: sessionAuth ? isAdmin : false, 
      loading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};
