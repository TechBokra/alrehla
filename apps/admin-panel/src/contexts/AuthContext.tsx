"use client";

import React, { createContext, useContext, ReactNode, useMemo } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { permissionsByRole, Permissions, type UserRole } from "../lib/roles";
import type { ChildProfile, UserProfile } from "../lib/database.types";

export type { UserProfile, ChildProfile, UserRole };

interface AuthContextType {
  currentUser: UserProfile | null;
  currentChildProfile: ChildProfile | null;
  isLoggedIn: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<UserProfile | null>;
  signUp: (
    email: string,
    password: string,
    name: string,
    role: UserRole,
  ) => Promise<UserProfile | null>;
  signInWithGoogle: (redirectUrl?: string) => Promise<void>;
  updateCurrentUser: (updatedData: Partial<UserProfile>) => void;
  loading: boolean;
  error: string | null;
  hasAdminAccess: boolean;
  permissions: Permissions;
  childProfiles: ChildProfile[];
  isParent: boolean;
  isProfileComplete: boolean;
  profileModalOpen: boolean;
  isProfileMandatory: boolean;
  pendingEmailVerification: boolean;
  isClerkEnabled: boolean;
  triggerProfileUpdate: (mandatory?: boolean) => void;
  closeProfileModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const clerk = useClerk();
  const { user: clerkUser, isLoaded } = useUser();

  const value = useMemo(() => {
    const email =
      clerkUser?.primaryEmailAddress?.emailAddress ||
      clerkUser?.emailAddresses?.[0]?.emailAddress ||
      "";
    const name =
      clerkUser?.fullName ||
      [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
      email.split("@")[0] ||
      "المشرف";

    const role: UserRole =
      (clerkUser?.publicMetadata?.role as UserRole) || "super_admin";

    const currentUser: UserProfile | null = clerkUser
      ? {
          id: clerkUser.id,
          email,
          name,
          role,
          created_at: clerkUser.createdAt
            ? new Date(clerkUser.createdAt).toISOString()
            : new Date().toISOString(),
        }
      : null;

    return {
      currentUser,
      currentChildProfile: null,
      isLoggedIn: !!clerkUser,
      signOut: async () => {
        await clerk.signOut();
      },
      signIn: async () => null,
      signUp: async () => null,
      signInWithGoogle: async () => {},
      updateCurrentUser: () => {},
      loading: !isLoaded,
      error: null,
      hasAdminAccess: !!clerkUser,
      permissions: permissionsByRole.super_admin,
      childProfiles: [],
      isParent: false,
      isProfileComplete: true,
      profileModalOpen: false,
      isProfileMandatory: false,
      pendingEmailVerification: false,
      isClerkEnabled: true,
      triggerProfileUpdate: () => {},
      closeProfileModal: () => {},
    };
  }, [clerkUser, isLoaded, clerk]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
