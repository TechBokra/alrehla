import * as React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { useDataViewUrlState } from '../src/data-view/url-state';
import { createResourceTestEnvironment } from '../src/testing';
import { defineResource, ResourceProvider, useResource, useResourceMutations } from '../src/resource';
import { ResourceExecutionContextProvider } from '../src/resource/execution-context';
import { ResourceAuthorizationProvider, createResourceAuthorization } from '../src/resource/authorization';
import { AdminNavigationProvider } from '../src/navigation';

type Row = { id: string; name: string };

function navigationWrapper(
  navigation: {
    pathname: string;
    searchParams: URLSearchParams;
    push: ReturnType<typeof vi.fn>;
    replace: ReturnType<typeof vi.fn>;
    back: ReturnType<typeof vi.fn>;
  },
) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={new QueryClient()}>
      <AdminNavigationProvider navigation={navigation} location={navigation}>
        {children}
      </AdminNavigationProvider>
    </QueryClientProvider>
  );
}

describe('Admin Core parity contracts', () => {
  it('provides a reusable test environment with trusted scope and navigation fixtures', async () => {
    const environment = createResourceTestEnvironment({
      scopeId: 'scope-a',
      authorization: { permissions: ['users.read'] },
    });
    const queryFn = vi.fn(async () => ({ rows: [{ id: '1', name: 'One' }], count: 1 }));
    const definition = defineResource<Row>({
      scope: 'scoped',
      metadata: { name: 'users', label: 'Users', singularLabel: 'User' },
      query: {
        queryKey: () => ['users'],
        queryFn,
        normalize: (response) => response,
      },
      dataView: { columns: [], getRowId: (row) => row.id },
    });
    const rendered = renderHook(() => useResource<Row>(), {
      wrapper: ({ children }) => (
        <environment.Resource definition={definition}>{children}</environment.Resource>
      ),
    });
    await waitFor(() => expect(rendered.result.current.dataView.data).toHaveLength(1));
    expect(environment.execution).toEqual({ scopeId: 'scope-a' });
    expect(environment.navigation.pushes).toEqual([]);
    expect(queryFn).toHaveBeenCalledOnce();
  });

  it('preserves cross-page selection only when explicitly enabled', () => {
    const createNavigation = () => ({
      pathname: '/users',
      searchParams: new URLSearchParams(),
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
    });
    const local = renderHook(
      () => useDataViewUrlState({ preserveSelectionAcrossPages: false }),
      { wrapper: navigationWrapper(createNavigation()) },
    );
    act(() => local.result.current.setSelectedIds(['a']));
    act(() => local.result.current.setPagination({ pageIndex: 1, pageSize: 20 }));
    expect(local.result.current.selection.executeIds).toEqual([]);

    const crossPage = renderHook(
      () => useDataViewUrlState({ preserveSelectionAcrossPages: true }),
      { wrapper: navigationWrapper(createNavigation()) },
    );
    act(() => crossPage.result.current.setSelectedIds(['a']));
    act(() => crossPage.result.current.setPagination({ pageIndex: 1, pageSize: 20 }));
    expect(crossPage.result.current.selection.executeIds).toEqual(['a']);
  });

  it('keeps a late scoped query response in its original scope', async () => {
    let activeScope = 'scope-a';
    let resolveA: ((value: { rows: Row[]; count: number }) => void) | undefined;
    const queryFn = vi.fn(({ execution }: { execution?: { scopeId?: string } }) => {
      if (execution?.scopeId === 'scope-a') {
        return new Promise<{ rows: Row[]; count: number }>((resolve) => {
          resolveA = resolve;
        });
      }
      return Promise.resolve({ rows: [{ id: 'b', name: 'B' }], count: 1 });
    });
    const definition = defineResource<Row>({
      scope: 'scoped',
      metadata: { name: 'users', label: 'Users', singularLabel: 'User' },
      query: {
        queryKey: () => ['users'],
        queryFn,
        normalize: (response) => response,
      },
      dataView: { columns: [], getRowId: (row) => row.id },
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const navigation = {
      pathname: '/users',
      searchParams: new URLSearchParams(),
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
    };
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <ResourceExecutionContextProvider value={{ scopeId: activeScope }}>
          <ResourceAuthorizationProvider value={createResourceAuthorization({ authorized: true })}>
            <AdminNavigationProvider navigation={navigation} location={navigation}>
              <ResourceProvider definition={definition}>{children}</ResourceProvider>
            </AdminNavigationProvider>
          </ResourceAuthorizationProvider>
        </ResourceExecutionContextProvider>
      </QueryClientProvider>
    );
    const rendered = renderHook(() => useResource<Row>(), { wrapper });
    await waitFor(() => expect(queryFn).toHaveBeenCalledOnce());
    activeScope = 'scope-b';
    rendered.rerender();
    await waitFor(() => expect(rendered.result.current.dataView.data).toEqual([{ id: 'b', name: 'B' }]));
    await act(async () => {
      resolveA?.({ rows: [{ id: 'a', name: 'A' }], count: 1 });
    });
    expect(queryClient.getQueryData(['scope', 'scope-b', 'users'])).toEqual({
      rows: [{ id: 'b', name: 'B' }],
      count: 1,
    });
    expect(queryClient.getQueryData(['scope', 'scope-a', 'users'])).toBeUndefined();
  });

  it('binds a late scoped mutation cache callback to its original scope', async () => {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    let resolveCreate: ((value: Row) => void) | undefined;
    let switchScope: ((scopeId: string) => void) | undefined;
    const definition = defineResource<Row, { name: string }>({
      scope: 'scoped',
      metadata: { name: 'users', label: 'Users', singularLabel: 'User' },
      mutations: {
        create: {
          mutationFn: () => new Promise<Row>((resolve) => { resolveCreate = resolve; }),
          updateCache: ({ cache, result }) => {
            cache.setListData({ rows: [result], count: 1 }, ['catalog', 'users']);
          },
        },
      },
      dataView: { columns: [], getRowId: (row) => row.id },
    });
    function SwitchingWrapper({ children }: { children: React.ReactNode }) {
      const [scopeId, setScopeId] = React.useState('scope-a');
      switchScope = setScopeId;
      return (
        <QueryClientProvider client={queryClient}>
          <ResourceExecutionContextProvider value={{ scopeId }}>
            <ResourceAuthorizationProvider value={createResourceAuthorization({ authorized: true })}>
              {children}
            </ResourceAuthorizationProvider>
          </ResourceExecutionContextProvider>
        </QueryClientProvider>
      );
    }
    const mutation = renderHook(() => useResourceMutations(definition), { wrapper: SwitchingWrapper });
    act(() => { void mutation.result.current.createMutation.mutate({ name: 'A' }); });
    await waitFor(() => expect(mutation.result.current.createMutation.isPending).toBe(true));
    act(() => switchScope?.('scope-b'));
    act(() => resolveCreate?.({ id: 'a', name: 'A' }));
    await waitFor(() => expect(queryClient.getQueryData(['scope', 'scope-a', 'catalog', 'users'])).toEqual({
      rows: [{ id: 'a', name: 'A' }],
      count: 1,
    }));
    expect(queryClient.getQueryData(['scope', 'scope-b', 'catalog', 'users'])).toBeUndefined();
  });

  it('keeps preview and density state in the generic Resource runtime', async () => {
    const definition = defineResource<Row>({
      metadata: { name: 'users', label: 'Users', singularLabel: 'User' },
      query: {
        queryKey: () => ['users'],
        queryFn: async () => ({ rows: [{ id: '1', name: 'One' }], count: 1 }),
        normalize: (response) => response,
      },
      dataView: { columns: [], getRowId: (row) => row.id },
    });
    const environment = createResourceTestEnvironment();
    const rendered = renderHook(() => useResource<Row>(), {
      wrapper: ({ children }) => (
        <environment.Resource definition={definition}>{children}</environment.Resource>
      ),
    });
    await waitFor(() => expect(rendered.result.current.dataView.data).toHaveLength(1));
    act(() => {
      rendered.result.current.openPreview({ id: '1', name: 'One' });
      rendered.result.current.setDensity('spacious');
    });
    expect(rendered.result.current.previewRecord?.id).toBe('1');
    expect(rendered.result.current.density).toBe('spacious');
  });

  it('exposes import and hierarchy/reorder capabilities through the Resource adapter', async () => {
    const importMutation = vi.fn(async (file: File) => ({ file, total: 1 }));
    const reorderMutation = vi.fn(async (input: { id: string; parentId: string | null; rank: number }) => input);
    const definition = defineResource<Row, never, never, never, unknown, Record<string, string>>({
      metadata: { name: 'users', label: 'Users', singularLabel: 'User' },
      capabilities: { create: false, update: false, delete: false, import: true, export: false },
      mutations: {
        import: { mutationFn: importMutation },
        reorder: { mutationFn: reorderMutation },
      },
      import: { config: { accept: 'text/csv' } },
      dataView: {
        columns: [],
        getRowId: (row) => row.id,
        reorder: {
          getPayload: ({ updatedItem }) => ({
            id: String(updatedItem.id),
            parentId: updatedItem.parentId === null ? null : String(updatedItem.parentId),
            rank: updatedItem.index,
          }),
        },
      },
    });
    const environment = createResourceTestEnvironment({ authorization: { authorized: true } });
    const rendered = renderHook(() => useResource<Row>(), {
      wrapper: ({ children }) => (
        <environment.Resource definition={definition}>{children}</environment.Resource>
      ),
    });
    await waitFor(() => expect(rendered.result.current.dataView.importConfig).toBeDefined());
    const file = new File(['name'], 'users.csv', { type: 'text/csv' });
    await act(async () => {
      await rendered.result.current.dataView.importConfig?.execute({
        file,
        headers: ['name'],
        rows: [],
        validRows: [],
      });
      await rendered.result.current.dataView.reorder?.onReorder(
        [{ id: '1', name: 'One' }],
        { activeId: '1', overId: '1' },
      );
    });
    expect(importMutation).toHaveBeenCalledWith(file, expect.anything());
    expect(reorderMutation).toHaveBeenCalledWith({ id: '1', parentId: null, rank: 0 }, expect.anything());
  });
});
