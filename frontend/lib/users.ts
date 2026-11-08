import { backendFetch } from "./backend";

export type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
};

export type UsersPage = {
  users: User[];
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export function getUsers(page: number, signal?: AbortSignal) {
  return backendFetch<UsersPage>(`/users?page=${page}`, { signal });
}
