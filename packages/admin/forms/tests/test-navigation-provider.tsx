import * as React from "react";
import {
  AdminNavigationProvider,
  type AdminNavigationAdapter,
} from "@eng-mohamedelsayed/admin-core/navigation";

interface NavigationFixture {
  pathname?: string;
  searchParams:
    | { entries: () => IterableIterator<[string, string]> }
    | URLSearchParams;
  router: {
    push: AdminNavigationAdapter["push"];
    replace: AdminNavigationAdapter["replace"];
    back?: AdminNavigationAdapter["back"];
  };
}

export function TestNavigationProvider({
  navigation,
  children,
}: {
  navigation: NavigationFixture;
  children: React.ReactNode;
}) {
  const adapter = React.useMemo<AdminNavigationAdapter>(
    () => ({
      push: navigation.router.push,
      replace: navigation.router.replace,
      back: navigation.router.back ?? (() => undefined),
    }),
    [navigation]
  );
  const searchParams =
    navigation.searchParams instanceof URLSearchParams
      ? new URLSearchParams(navigation.searchParams.toString())
      : new URLSearchParams(Array.from(navigation.searchParams.entries()));

  return (
    <AdminNavigationProvider
      navigation={adapter}
      location={{
        pathname: navigation.pathname ?? "/widgets",
        searchParams,
      }}
    >
      {children}
    </AdminNavigationProvider>
  );
}
