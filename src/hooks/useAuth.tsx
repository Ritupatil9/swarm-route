import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "firebase/auth";
import { signUp, signIn, logout, onAuthChange, getUserProfile, updateUserProfile, UserProfile } from "@/lib/auth";

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, profile?: Partial<UserProfile>) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (authUser) => {
      setUser(authUser);
      if (authUser) {
        const userProfile = await getUserProfile(authUser.uid);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error("No user logged in");
    await updateUserProfile(user.uid, updates);
    const updatedProfile = await getUserProfile(user.uid);
    setProfile(updatedProfile);
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    logout,
    updateProfile: handleUpdateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
