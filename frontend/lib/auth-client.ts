"use client";

import { createAuthClient } from "better-auth/react";
import { backendURL } from "./backend";

export const authClient = createAuthClient({
  baseURL: backendURL,
  basePath: "/api/auth",
  fetchOptions: { credentials: "include" },
});
