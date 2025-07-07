import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User as FirebaseUser,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, db } from "./firebase";
import { User } from "@shared/api";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      if (firebaseUser) {
        setFirebaseUser(firebaseUser);

        // Check if user exists in Firestore
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        let userData: User;

        if (userDoc.exists()) {
          // User exists, get their data
          userData = userDoc.data() as User;
        } else {
          // New user, create their document
          userData = {
            id: firebaseUser.uid,
            email: firebaseUser.email || "",
            name: firebaseUser.displayName || "Usuario",
            avatar: firebaseUser.photoURL || undefined,
            dateCreated: new Date().toISOString(),
          };

          await setDoc(userDocRef, {
            ...userData,
            dateCreated: serverTimestamp(),
          });
        }

        setUser(userData);

        // Store in localStorage for offline access
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        setFirebaseUser(null);
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("selectedGroup");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      googleProvider.addScope("email");
      googleProvider.addScope("profile");

      const result = await signInWithPopup(auth, googleProvider);

      // User info is handled in the onAuthStateChanged listener
      console.log("Login successful:", result.user.displayName);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // Cleanup is handled in onAuthStateChanged
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  const value = {
    user,
    firebaseUser,
    loading,
    signInWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
