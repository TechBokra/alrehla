"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useMemo,
} from "react";
import { getPermissions, Permissions, type UserRole } from "../lib/roles";
import type { ChildProfile, UserProfile } from "../lib/database.types";
import { useToast } from "./ToastContext";
import { useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/authService";
import { setToken, clearToken } from "../lib/tokenManager";

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
  updateCurrentUser: (updatedData: Partial<UserProfile>) => void;
  loading: boolean;
  error: string | null;
  hasAdminAccess: boolean;
  permissions: Permissions;
  childProfiles: ChildProfile[];
  isParent: boolean;
  // New Profile Completion Helpers
  isProfileComplete: boolean;
  profileModalOpen: boolean;
  isProfileMandatory: boolean;
  triggerProfileUpdate: (mandatory?: boolean) => void;
  closeProfileModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentChildProfile, setCurrentChildProfile] =
    useState<ChildProfile | null>(null);
  const [childProfiles, setChildProfiles] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profile Completion State
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [isProfileMandatory, setIsProfileMandatory] = useState(false);

  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const fetchUserData = async (user: UserProfile) => {
    try {
      if (user.role === "student") {
        const profile = await authService.getStudentProfile(user.id);
        setCurrentChildProfile(profile);
      } else if (
        [
          "user",
          "parent",
          "super_admin",
          "general_supervisor",
          "instructor",
          "publisher",
        ].includes(user.role)
      ) {
        const children = await authService.getUserChildren(user.id);
        setChildProfiles(children || []);
      }
    } catch (e) {
      console.warn("Could not fetch secondary user data, continuing...");
    }
  };

  useEffect(() => {
    let cancelled = false;

    const validateSession = async () => {
      try {
        const response = await authService.getCurrentUser();
        if (!cancelled && response && response.user) {
          setCurrentUser(response.user);
          // لا ننتظر تحميل بقية البيانات لفتح الواجهة
          fetchUserData(response.user);
        }
      } catch (e) {
        if (!cancelled) console.error("Session sync error", e);
      } finally {
        // نضمن إنهاء وضع التحميل مهما كانت النتيجة
        if (!cancelled) setLoading(false);
      }
    };

    const win = window as any;
    if (typeof win.requestIdleCallback === "function") {
      const idleId = win.requestIdleCallback(validateSession, { timeout: 1200 });
      return () => {
        cancelled = true;
        win.cancelIdleCallback?.(idleId);
      };
    }

    const timer = window.setTimeout(validateSession, 500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  const signIn = async (
    email: string,
    password: string,
  ): Promise<UserProfile | null> => {
    setLoading(true);
    setError(null);
    try {
      const { user, accessToken } = await authService.login(email, password);
      if (accessToken) setToken(accessToken);
      setCurrentUser(user);
      await fetchUserData(user);
      addToast(`مرحباً بك، ${user.name}!`, "success");
      return user;
    } catch (e: any) {
      const msg = e.message || "بيانات الدخول غير صحيحة";
      setError(msg);
      addToast(msg, "error");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: UserRole,
  ): Promise<UserProfile | null> => {
    setLoading(true);
    setError(null);
    try {
      const { user, accessToken } = await authService.register(
        email,
        password,
        name,
        role,
      );
      if (accessToken) setToken(accessToken);
      setCurrentUser(user);
      addToast("تم إنشاء الحساب بنجاح!", "success");
      return user;
    } catch (e: any) {
      setError(e.message);
      addToast(e.message, "error");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await authService.logout();
    setCurrentUser(null);
    setChildProfiles([]);
    setCurrentChildProfile(null);
    clearToken();
    queryClient.clear();
    addToast("تم تسجيل الخروج بنجاح.", "info");
  };

  const updateCurrentUser = (updatedData: Partial<UserProfile>) => {
    setCurrentUser((prev) => (prev ? { ...prev, ...updatedData } : null));
  };

  // Helper to check profile completion status
  const isProfileComplete = useMemo(() => {
    if (!currentUser) return false;

    // Students and Publishers are exempt from profile completion checks (phone/address) for initial access
    if (currentUser.role === "student" || currentUser.role === "publisher")
      return true;

    // For others, check core fields: Country, City, Phone
    return !!(currentUser.country && currentUser.city && currentUser.phone);
  }, [currentUser]);

  const triggerProfileUpdate = (mandatory: boolean = false) => {
    // Double check: if it's a student, never trigger mandatory update
    if (currentUser?.role === "student") return;

    setIsProfileMandatory(mandatory);
    setProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setProfileModalOpen(false);
    setIsProfileMandatory(false);
  };

  const value = useMemo(() => {
    const userRole = currentUser?.role || "user";
    const currentPermissions = getPermissions(userRole);

    // القائمة المسموح لها بدخول لوحة التحكم (تمت إضافة publisher هنا لإصلاح المشكلة)
    const allowedAdminRoles = [
      "super_admin",
      "general_supervisor",
      "instructor",
      "enha_lak_supervisor",
      "creative_writing_supervisor",
      "publisher", // <--- Added here
      "content_editor",
      "support_agent",
    ];

    return {
      currentUser,
      currentChildProfile,
      isLoggedIn: !!currentUser,
      signOut,
      signIn,
      signUp,
      updateCurrentUser,
      loading,
      error,
      hasAdminAccess: allowedAdminRoles.includes(userRole),
      permissions: currentPermissions,
      childProfiles,
      isParent: childProfiles.length > 0,
      isProfileComplete,
      profileModalOpen,
      isProfileMandatory,
      triggerProfileUpdate,
      closeProfileModal,
    };
  }, [
    currentUser,
    currentChildProfile,
    loading,
    error,
    childProfiles,
    isProfileComplete,
    profileModalOpen,
    isProfileMandatory,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined)
    throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
