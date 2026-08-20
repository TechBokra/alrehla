"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useRef,
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
import { canAccessInstructorPanel, getPermissions, type Permissions, type UserRole } from "../lib/roles";
import type { UserProfile } from "../lib/database.types";
import { useToast } from "./ToastContext";
import { useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/authService";
import {
  clearSupabaseAccessTokenProvider,
  setSupabaseAccessTokenProvider,
} from "../lib/supabaseClient";

export type { UserProfile, UserRole };

const CLERK_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
const CLERK_CALLBACK_PATH = "/sso-callback";
const AUTH_SYNC_TIMEOUT_MS = 15_000;

export type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "error";

async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

interface AuthContextType {
  currentUser: UserProfile | null;
  isLoggedIn: boolean;
  isInstructor: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<UserProfile | null>;
  signUp: (
    email: string,
    password: string,
    name: string,
    role?: UserRole,
  ) => Promise<UserProfile | null>;
  signInWithGoogle: (redirectUrl?: string) => Promise<void>;
  updateCurrentUser: (updatedData: Partial<UserProfile>) => void;
  loading: boolean;
  authStatus: AuthStatus;
  retryAuthSync: () => void;
  error: string | null;
  hasInstructorAccess: boolean;
  permissions: Permissions;
  isClerkEnabled: boolean;
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

  return parts || email.split("@")[0] || "مدرب الرحلة";
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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [syncNonce, setSyncNonce] = useState(0);

  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const clerk = useClerk();
  const { session, isLoaded: clerkSessionLoaded } = useSession();
  const { isLoaded: clerkUserLoaded, user: clerkUser } = useClerkUser();
  const { signIn: clerkSignIn } = useClerkSignIn();
  const { signUp: clerkSignUp } = useClerkSignUp();

  const profileSyncRef = useRef<{ clerkUserId: string; promise: Promise<UserProfile | null> } | null>(null);

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

  const syncClerkProfile = useCallback(async (activeClerkUser: any) => {
    const email = getClerkEmail(activeClerkUser);
    if (!email) throw new Error("لم نتمكن من قراءة البريد الإلكتروني من Clerk.");

    const clerkUserId = activeClerkUser?.id || email;
    const existingSync = profileSyncRef.current;
    if (existingSync?.clerkUserId === clerkUserId) {
      return existingSync.promise;
    }

    const operation = (async () => {
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

      if (!user) {
        throw new Error("تعذر جلب ملف المستخدم أو إنشاؤه في قاعدة البيانات.");
      }

      return user;
    })();

    profileSyncRef.current = { clerkUserId, promise: operation };

    try {
      return await operation;
    } finally {
      if (profileSyncRef.current?.clerkUserId === clerkUserId) {
        profileSyncRef.current = null;
      }
    }
  }, [getClerkAccessToken]);

  const syncActiveClerkUser = useCallback(async () => {
    const activeUser = clerk.user || (clerk as any).client?.user;
    if (!activeUser) {
      throw new Error("لم نتمكن من العثور على المستخدم النشط في Clerk.");
    }
    const profile = await syncClerkProfile(activeUser);
    if (!profile) {
      throw new Error("تعذر مزامنة الملف الشخصي مع قاعدة البيانات.");
    }
    setCurrentUser(profile);
    setAuthStatus("authenticated");
    return profile;
  }, [clerk, syncClerkProfile]);

  useEffect(() => {
    let isCancelled = false;

    if (!CLERK_ENABLED) {
      setLoading(false);
      setAuthStatus("unauthenticated");
      return;
    }

    if (!clerkUserLoaded || !clerkSessionLoaded) {
      setLoading(true);
      setAuthStatus("loading");
      return;
    }

    if (!clerkUser) {
      profileSyncRef.current = null;
      setCurrentUser(null);
      setError(null);
      setLoading(false);
      setAuthStatus("unauthenticated");
      return;
    }

    setLoading(true);
    setAuthStatus("loading");

    withTimeout(
      syncClerkProfile(clerkUser),
      AUTH_SYNC_TIMEOUT_MS,
      "استغرقت مزامنة حساب المدرب وقتاً أطول من المتوقع.",
    )
      .then((profile) => {
        if (isCancelled) return;
        setCurrentUser(profile);
        setError(null);
        setAuthStatus("authenticated");
      })
      .catch((err: any) => {
        if (isCancelled) return;
        console.error("Instructor auth sync error:", err);
        const message = err?.message || "فشلت مزامنة بيانات حساب المدرب.";
        setError(message);
        setAuthStatus("error");
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [
    clerkSessionLoaded,
    clerkUser,
    clerkUserLoaded,
    syncClerkProfile,
    syncNonce,
  ]);

  const retryAuthSync = useCallback(() => {
    profileSyncRef.current = null;
    setError(null);
    setLoading(true);
    setAuthStatus("loading");
    setSyncNonce((prev) => prev + 1);
  }, []);

  const signOut = useCallback(async () => {
    try {
      if (CLERK_ENABLED) {
        await clerk.signOut();
      }
      profileSyncRef.current = null;
      setCurrentUser(null);
      setError(null);
      setAuthStatus("unauthenticated");
      queryClient.clear();
      addToast("تم تسجيل الخروج بنجاح.", "info");
    } catch (err: any) {
      console.error("Sign out error:", err);
      addToast("حدث خطأ أثناء تسجيل الخروج.", "error");
    }
  }, [addToast, clerk, queryClient]);

  const signIn = useCallback(
    async (email: string, pass: string): Promise<UserProfile | null> => {
      if (!CLERK_ENABLED) return null;
      if (!clerkSignIn) {
        throw new Error("خدمة تسجيل الدخول قيد التهيئة...");
      }

      setError(null);
      setLoading(true);
      try {
        const { error: clerkError } = await (clerkSignIn as any).password({
          emailAddress: email.trim().toLowerCase(),
          password: pass,
        });

        if (clerkError) throw new Error(getClerkErrorMessage(clerkError));

        if ((clerkSignIn as any).status !== "complete") {
          throw new Error("يتطلب الحساب خطوات تحقق إضافية.");
        }

        const { error: finalizeError } = await (clerkSignIn as any).finalize();
        if (finalizeError) throw new Error(getClerkErrorMessage(finalizeError));

        const profile = await syncActiveClerkUser();
        addToast(`مرحباً بك، ${profile.name}!`, "success");
        return profile;
      } catch (err: any) {
        const msg = getClerkErrorMessage(err);
        setError(msg);
        addToast(msg, "error");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [addToast, clerkSignIn, syncActiveClerkUser],
  );

  const signUp = useCallback(
    async (
      email: string,
      pass: string,
      name: string,
      role: UserRole = "instructor",
    ): Promise<UserProfile | null> => {
      void role;
      if (!CLERK_ENABLED) return null;
      if (!clerkSignUp) {
        throw new Error("خدمة إنشاء الحساب قيد التهيئة...");
      }

      setError(null);
      setLoading(true);
      try {
        const { error: clerkError } = await (clerkSignUp as any).password({
          emailAddress: email.trim().toLowerCase(),
          password: pass,
          firstName: name.trim(),
          unsafeMetadata: { name: name.trim() },
        });

        if (clerkError) throw new Error(getClerkErrorMessage(clerkError));

        if ((clerkSignUp as any).status === "complete") {
          const { error: finalizeError } = await (clerkSignUp as any).finalize();
          if (finalizeError) throw new Error(getClerkErrorMessage(finalizeError));

          const profile = await syncActiveClerkUser();
          addToast("تم إنشاء الحساب بنجاح!", "success");
          return profile;
        }

        throw new Error("تم إرسال رابط التحقق إلى بريدك الإلكتروني.");
      } catch (err: any) {
        const msg = getClerkErrorMessage(err);
        setError(msg);
        addToast(msg, "error");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [addToast, clerkSignUp, syncActiveClerkUser],
  );

  const signInWithGoogle = useCallback(
    async (redirectUrl = "/auth/redirect"): Promise<void> => {
      if (!CLERK_ENABLED || !clerkSignIn) {
        throw new Error("خدمة تسجيل الدخول قيد التهيئة...");
      }

      const callbackUrl = `${CLERK_CALLBACK_PATH}?redirect_url=${encodeURIComponent(redirectUrl)}`;

      const { error: oauthError } = await (clerkSignIn as any).sso({
        strategy: "oauth_google",
        redirectCallbackUrl: callbackUrl,
        redirectUrl,
      });

      if (oauthError) throw new Error(getClerkErrorMessage(oauthError));
    },
    [clerkSignIn],
  );

  const updateCurrentUser = useCallback(
    (updatedData: Partial<UserProfile>) => {
      setCurrentUser((prev) => {
        if (!prev) return null;
        const next = { ...prev, ...updatedData };
        queryClient.setQueryData(["userProfile", next.id], next);
        return next;
      });
    },
    [queryClient],
  );

  const value = useMemo(() => {
    const userRole = currentUser?.role || "user";
    const currentPermissions = getPermissions(userRole);
    const hasInstructorAccess = canAccessInstructorPanel(userRole);

    return {
      currentUser,
      isLoggedIn: !!currentUser,
      isInstructor: userRole === "instructor",
      signOut,
      signIn,
      signUp,
      signInWithGoogle,
      updateCurrentUser,
      loading,
      authStatus,
      retryAuthSync,
      error,
      hasInstructorAccess,
      permissions: currentPermissions,
      isClerkEnabled: CLERK_ENABLED,
    };
  }, [
    currentUser,
    signOut,
    signIn,
    signUp,
    signInWithGoogle,
    updateCurrentUser,
    loading,
    authStatus,
    retryAuthSync,
    error,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
