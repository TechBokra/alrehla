"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import {
  useClerk,
  useSession,
  useSignIn as useClerkSignIn,
  useSignUp as useClerkSignUp,
  useUser as useClerkUser,
} from "@clerk/nextjs";
import { getPermissions, Permissions, type UserRole } from "../lib/roles";
import type { ChildProfile, UserProfile } from "../lib/database.types";
import { useToast } from "./ToastContext";
import { useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/authService";
import {
  clearSupabaseAccessTokenProvider,
  setSupabaseAccessTokenProvider,
} from "../lib/supabaseClient";

export type { UserProfile, ChildProfile, UserRole };

const CLERK_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
const CLERK_CALLBACK_PATH = "/sso-callback";

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

const getClerkEmail = (clerkUser: any) => {
  return (
    clerkUser?.primaryEmailAddress?.emailAddress ||
    clerkUser?.emailAddresses?.[0]?.emailAddress ||
    ""
  ).toLowerCase();
};

const getClerkName = (clerkUser: any, email: string) => {
  const fullName = clerkUser?.fullName?.trim();
  if (fullName) return fullName;

  const parts = [clerkUser?.firstName, clerkUser?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return parts || email.split("@")[0] || "مستخدم الرحلة";
};

const getClerkErrorMessage = (error: any) => {
  return (
    error?.errors?.[0]?.longMessage ||
    error?.errors?.[0]?.message ||
    error?.longMessage ||
    error?.message ||
    "حدث خطأ أثناء المصادقة. حاول مرة أخرى."
  );
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentChildProfile, setCurrentChildProfile] =
    useState<ChildProfile | null>(null);
  const [childProfiles, setChildProfiles] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingEmailVerification, setPendingEmailVerification] = useState(false);

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [isProfileMandatory, setIsProfileMandatory] = useState(false);

  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const clerk = useClerk();
  const { user: clerkUser, isLoaded: clerkUserLoaded } = useClerkUser();
  const { session, isLoaded: clerkSessionLoaded } = useSession();
  const { signIn: clerkSignIn, fetchStatus: clerkSignInFetchStatus } = useClerkSignIn();
  const { signUp: clerkSignUp, fetchStatus: clerkSignUpFetchStatus } = useClerkSignUp();

  const getClerkAccessToken = useCallback(async () => {
    const activeSession =
      session ||
      (clerk as any)?.session ||
      (clerk as any)?.client?.activeSessions?.[0];

    return (await activeSession?.getToken?.()) || null;
  }, [clerk, session]);

  useEffect(() => {
    if (!CLERK_ENABLED) return;

    setSupabaseAccessTokenProvider(getClerkAccessToken);

    return () => clearSupabaseAccessTokenProvider();
  }, [getClerkAccessToken]);

  const resetSecondaryUserData = useCallback(() => {
    setCurrentChildProfile(null);
    setChildProfiles([]);
  }, []);

  const fetchUserData = useCallback(async (user: UserProfile) => {
    try {
      resetSecondaryUserData();

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
  }, [resetSecondaryUserData]);

  const syncClerkProfile = useCallback(async (activeClerkUser: any) => {
    const email = getClerkEmail(activeClerkUser);
    if (!email) throw new Error("لم نتمكن من قراءة البريد الإلكتروني من Clerk.");

    const accessToken = await getClerkAccessToken();
    if (!accessToken) {
      throw new Error(
        "تم تسجيل الدخول في Clerk، لكن رمز الجلسة لم يجهز بعد. أعد المحاولة بعد لحظة.",
      );
    }

    const user = await authService.getOrCreateClerkUserProfile({
      email,
      name: getClerkName(activeClerkUser, email),
    });

    const clerkRole =
      activeClerkUser?.publicMetadata?.role ||
      activeClerkUser?.publicMetadata?.appRole ||
      activeClerkUser?.publicMetadata?.accountType;

    if (clerkRole === 'student' && user.role !== 'student') {
      user.role = 'student';
    }

    setCurrentUser(user);
    await fetchUserData(user);
    return user;
  }, [fetchUserData, getClerkAccessToken]);

  const syncActiveClerkUser = useCallback(async () => {
    await (clerk as any)?.load?.();
    const activeClerkUser = (clerk as any)?.user || clerkUser;
    if (!activeClerkUser) throw new Error("تم تسجيل الدخول، لكن جلسة Clerk لم تجهز بعد.");
    return syncClerkProfile(activeClerkUser);
  }, [clerk, clerkUser, syncClerkProfile]);

  useEffect(() => {
    if (!CLERK_ENABLED) return;
    if (!clerkUserLoaded || !clerkSessionLoaded) return;

    let cancelled = false;

    const syncSession = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!clerkUser) {
          setCurrentUser(null);
          resetSecondaryUserData();
          return;
        }

        const user = await syncClerkProfile(clerkUser);
        if (cancelled) return;
        setCurrentUser(user);
      } catch (e: any) {
        if (!cancelled) {
          const msg = e.message || "تعذر مزامنة جلسة المستخدم.";
          setError(msg);
          console.error("Clerk session sync error", e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    syncSession();

    return () => {
      cancelled = true;
    };
  }, [clerkSessionLoaded, clerkUser, clerkUserLoaded, resetSecondaryUserData, syncClerkProfile]);

  useEffect(() => {
    if (CLERK_ENABLED) return;

    setCurrentUser(null);
    resetSecondaryUserData();
    setError("Clerk هو مزود المصادقة الوحيد حالياً. أضف NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY لتفعيل تسجيل الدخول.");
    setLoading(false);
  }, [resetSecondaryUserData]);

  const signIn = async (
    email: string,
    password: string,
  ): Promise<UserProfile | null> => {
    setLoading(true);
    setError(null);

    try {
      if (CLERK_ENABLED) {
        if (!clerkSignIn) throw new Error("Clerk لم يجهز بعد. حاول مرة أخرى.");

        const { error: clerkError } = await clerkSignIn.password({
          emailAddress: email.toLowerCase().trim(),
          password,
        });

        if (clerkError) throw new Error(getClerkErrorMessage(clerkError));

        if (clerkSignIn.status !== "complete") {
          throw new Error("يتطلب هذا الحساب خطوة تحقق إضافية غير مفعلة حالياً في هذه الواجهة.");
        }

        const { error: finalizeError } = await clerkSignIn.finalize();
        if (finalizeError) throw new Error(getClerkErrorMessage(finalizeError));

        const user = await syncActiveClerkUser();
        addToast(`مرحباً بك، ${user.name}!`, "success");
        return user;
      }
      throw new Error("Clerk هو مزود تسجيل الدخول الوحيد حالياً. تحقق من إعداد NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.");
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
    void role;
    setLoading(true);
    setError(null);
    setPendingEmailVerification(false);

    try {
      if (CLERK_ENABLED) {
        if (!clerkSignUp) throw new Error("Clerk لم يجهز بعد. حاول مرة أخرى.");

        const { error: clerkError } = await clerkSignUp.password({
          emailAddress: email.toLowerCase().trim(),
          password,
          firstName: name,
          unsafeMetadata: { name },
        });

        if (clerkError) throw new Error(getClerkErrorMessage(clerkError));

        if (clerkSignUp.status === "complete") {
          const { error: finalizeError } = await clerkSignUp.finalize();
          if (finalizeError) throw new Error(getClerkErrorMessage(finalizeError));
          const user = await syncActiveClerkUser();
          addToast("تم إنشاء الحساب بنجاح!", "success");
          return user;
        }

        if (clerkSignUp.unverifiedFields.includes("email_address" as any)) {
          const { error: sendError } = await clerkSignUp.verifications.sendEmailLink({
            verificationUrl: `${window.location.origin}/auth/verify-email`,
          });
          if (sendError) throw new Error(getClerkErrorMessage(sendError));
          setPendingEmailVerification(true);
          addToast("تم إرسال رابط التحقق إلى بريدك الإلكتروني.", "info");
          return null;
        }

        throw new Error("لم يكتمل إنشاء الحساب. تحقق من إعدادات Clerk المطلوبة.");
      }
      throw new Error("Clerk هو مزود إنشاء الحسابات الوحيد حالياً. تحقق من إعداد NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.");
    } catch (e: any) {
      setError(e.message);
      addToast(e.message, "error");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (redirectUrl: string = "/dashboard") => {
    setError(null);

    if (!CLERK_ENABLED || !clerkSignIn) {
      const msg = "تسجيل الدخول عبر Google يحتاج إعداد Clerk أولاً.";
      setError(msg);
      addToast(msg, "error");
      return;
    }

    try {
      const callbackUrl = `${CLERK_CALLBACK_PATH}?redirect_url=${encodeURIComponent(redirectUrl)}`;
      const { error: oauthError } = await clerkSignIn.sso({
        strategy: "oauth_google",
        redirectCallbackUrl: callbackUrl,
        redirectUrl,
      });

      if (oauthError) throw new Error(getClerkErrorMessage(oauthError));
    } catch (e: any) {
      const msg = getClerkErrorMessage(e);
      setError(msg);
      addToast(msg, "error");
      throw e;
    }
  };

  const signOut = async () => {
    try {
      if (CLERK_ENABLED) await clerk.signOut();
    } finally {
      setCurrentUser(null);
      resetSecondaryUserData();
      clearSupabaseAccessTokenProvider();
      queryClient.clear();
      addToast("تم تسجيل الخروج بنجاح.", "info");
    }
  };

  const updateCurrentUser = (updatedData: Partial<UserProfile>) => {
    setCurrentUser((prev) => (prev ? { ...prev, ...updatedData } : null));
  };

  const isProfileComplete = useMemo(() => {
    if (!currentUser) return false;

    if (currentUser.role === "student" || currentUser.role === "publisher")
      return true;

    return !!(currentUser.country && currentUser.city && currentUser.phone);
  }, [currentUser]);

  const triggerProfileUpdate = (mandatory: boolean = false) => {
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

    const allowedAdminRoles = [
      "super_admin",
      "general_supervisor",
      "instructor",
      "enha_lak_supervisor",
      "creative_writing_supervisor",
      "publisher",
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
      signInWithGoogle,
      updateCurrentUser,
      loading: loading || clerkSignInFetchStatus === "fetching" || clerkSignUpFetchStatus === "fetching",
      error,
      hasAdminAccess: allowedAdminRoles.includes(userRole),
      permissions: currentPermissions,
      childProfiles,
      isParent: childProfiles.length > 0,
      isProfileComplete,
      profileModalOpen,
      isProfileMandatory,
      pendingEmailVerification,
      isClerkEnabled: CLERK_ENABLED,
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
    pendingEmailVerification,
    clerkSignInFetchStatus,
    clerkSignUpFetchStatus,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined)
    throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
