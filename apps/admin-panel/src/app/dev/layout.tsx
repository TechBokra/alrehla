import { FeaturesLayout } from "@/features/layout";
import {
  requireCurrentAdminUser,
  requireMedusaAdmin,
} from "@/lib/auth/medusa-admin";
import { getAdminStoreContext } from "@eng-mohamedelsayed/api-client/resources";
import { normalizeMutationError } from "@eng-mohamedelsayed/mutations/utils";
import { AdminStoreProvider } from "@/providers/admin-store-provider";
import { AdminDashboardNavigationProvider } from "@/providers/admin-navigation-provider";
import { redirect, unstable_rethrow } from "next/navigation";

async function loadAdminLayoutData() {
  try {
    const [currentUser, adminContext] = await Promise.all([
      requireCurrentAdminUser(),
      requireMedusaAdmin(),
    ]);
    const storeContext = await getAdminStoreContext(adminContext.client);

    return { currentUser, storeContext };
  } catch (error: unknown) {
    // Preserve Next.js redirects (including session-expiry redirects) before
    // classifying transport failures for the dedicated backend status page.
    unstable_rethrow(error);

    const normalized = normalizeMutationError(error);
    if (normalized.kind === "unauthorized") {
      redirect("/login?reason=session-expired");
    }

    if (
      normalized.kind === "network" ||
      normalized.kind === "server" ||
      normalized.code === "MEDUSA_BACKEND_URL_MISSING"
    ) {
      const code = normalized.code ?? "MEDUSA_BACKEND_UNAVAILABLE";
      redirect(`/backend-error?code=${encodeURIComponent(code)}`);
    }

    throw error;
  }
}

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { currentUser, storeContext } = await loadAdminLayoutData();

  return (
    <AdminStoreProvider initialContext={storeContext}>
      <AdminDashboardNavigationProvider>
        <FeaturesLayout currentUser={currentUser}>{children}</FeaturesLayout>
      </AdminDashboardNavigationProvider>
    </AdminStoreProvider>
  );
}
