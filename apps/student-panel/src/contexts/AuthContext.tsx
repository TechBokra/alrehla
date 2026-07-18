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
import { setToken, clearToken } from "../lib/tokenManager";
import {
  clearSupabaseAccessTokenProvider,
  setSupabaseAccessTokenProvider,
} from "../lib/supabaseClient";

export type { UserProfile, ChildProfile, UserRole };

const CLERK_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
const CLERK_CALLBACK_PATH = "/sso-callback";

const USER_ROLES: UserRole[] = [
  "user",
  "parent",
  "student",
  "instructor",
  "super_admin",
  "general_supervisor",
  "enha_lak_supervisor",
  "creative_writing_supervisor",
  "content_editor",
  "support_agent",
  "publisher",
];

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
  verifySignUpEmail: (code: string) => Promise<UserProfile | null>;
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

const normalizeRole = (role: unknown, fallback: UserRole = "user"): UserRole => {
  return typeof role === "string" && USER_ROLES.includes(role as UserRole)
    ? (role as UserRole)
    : fallback;
};

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

const getClerkRole = (clerkUser: any, fallback: UserRole = "user") => {
  return normalizeRole(
    clerkUser?.publicMetadata?.role || clerkUser?.unsafeMetadata?.role,
    fallback,
  );
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

  const syncClerkProfile = useCallback(async (activeClerkUser: any, fallbackRole: UserRole = "user") => {
    const email = getClerkEmail(activeClerkUser);
    if (!email) throw new Error("لم نتمكن من قراءة البريد الإلكتروني من Clerk.");

    const accessToken = await getClerkAccessToken();
    if (!accessToken) {
      throw new Error(
        "تم تسجيل الدخول في Clerk، لكن رمز الجلسة لم يجهز بعد. أعد المحاولة بعد لحظة.",
      );
    }

    const user = await authService.getOrCreateClerkUserProfile({
      clerkUserId: activeClerkUser.id,
      email,
      name: getClerkName(activeClerkUser, email),
      role: getClerkRole(activeClerkUser, fallbackRole),
    });

    setCurrentUser(user);
    await fetchUserData(user);
    return user;
  }, [fetchUserData, getClerkAccessToken]);

  const syncActiveClerkUser = useCallback(async (fallbackRole: UserRole = "student") => {
    await (clerk as any)?.load?.();
    const activeClerkUser = (clerk as any)?.user || clerkUser;
    if (!activeClerkUser) throw new Error("تم تسجيل الدخول، لكن جلسة Clerk لم تجهز بعد.");
    return syncClerkProfile(activeClerkUser, fallbackRole);
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

        const user = await syncClerkProfile(clerkUser, "student");
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

    let cancelled = false;

    const validateSession = async () => {
      try {
        const response = await authService.getCurrentUser();
        if (!cancelled && response && response.user) {
          setCurrentUser(response.user);
          fetchUserData(response.user);
        }
      } catch (e) {
        if (!cancelled) console.error("Session sync error", e);
      } finally {
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
  }, [fetchUserData]);

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
    setPendingEmailVerification(false);

    try {
      if (CLERK_ENABLED) {
        if (!clerkSignUp) throw new Error("Clerk لم يجهز بعد. حاول مرة أخرى.");

        const { error: clerkError } = await clerkSignUp.password({
          emailAddress: email.toLowerCase().trim(),
          password,
          firstName: name,
          unsafeMetadata: { name, role },
        });

        if (clerkError) throw new Error(getClerkErrorMessage(clerkError));

        if (clerkSignUp.status === "complete") {
          const { error: finalizeError } = await clerkSignUp.finalize();
          if (finalizeError) throw new Error(getClerkErrorMessage(finalizeError));
          const user = await syncActiveClerkUser(role);
          addToast("تم إنشاء الحساب بنجاح!", "success");
          return user;
        }

        if (clerkSignUp.unverifiedFields.includes("email_address" as any)) {
          const { error: sendError } = await clerkSignUp.verifications.sendEmailCode();
          if (sendError) throw new Error(getClerkErrorMessage(sendError));
          setPendingEmailVerification(true);
          addToast("تم إرسال رمز التحقق إلى بريدك الإلكتروني.", "info");
          return null;
        }

        throw new Error("لم يكتمل إنشاء الحساب. تحقق من إعدادات Clerk المطلوبة.");
      }

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

  const verifySignUpEmail = async (code: string): Promise<UserProfile | null> => {
    if (!CLERK_ENABLED || !clerkSignUp) return null;

    setLoading(true);
    setError(null);

    try {
      const { error: verifyError } = await clerkSignUp.verifications.verifyEmailCode({
        code: code.trim(),
      });

      if (verifyError) throw new Error(getClerkErrorMessage(verifyError));

      if (clerkSignUp.status !== "complete") {
        throw new Error("رمز التحقق صحيح لكن الحساب لم يكتمل بعد.");
      }

      const { error: finalizeError } = await clerkSignUp.finalize();
      if (finalizeError) throw new Error(getClerkErrorMessage(finalizeError));

      setPendingEmailVerification(false);
      const user = await syncActiveClerkUser(getClerkRole((clerk as any)?.user));
      addToast("تم تأكيد البريد وإنشاء الحساب بنجاح!", "success");
      return user;
    } catch (e: any) {
      const msg = e.message || "فشل التحقق من الرمز.";
      setError(msg);
      addToast(msg, "error");
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
      await authService.logout();
    } finally {
      setCurrentUser(null);
      resetSecondaryUserData();
      clearToken();
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
      verifySignUpEmail,
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
