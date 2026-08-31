import * as React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { defineResource, ResourceProvider, useResource } from '../src/resource';
import { useDataViewUrlState } from '../src/data-view/url-state';
import { AdminNavigationProvider } from '../src/navigation';
import { ResourceAuthorizationProvider, createResourceAuthorization } from '../src/resource/authorization';
import { ResourceExecutionContextProvider } from '../src/resource/execution-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

type Row = { id: string; name: string };

function createWrapper(
  definition: ReturnType<typeof defineResource<Row>>,
  scopeId?: string,
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const navigation = {
    pathname: '/users',
    searchParams: new URLSearchParams(),
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  };
  return {
    queryClient,
    navigation,
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <ResourceExecutionContextProvider value={scopeId ? { scopeId } : undefined}>
          <ResourceAuthorizationProvider value={createResourceAuthorization({ authorized: true })}>
            <AdminNavigationProvider navigation={navigation} location={navigation}>
              <ResourceProvider definition={definition}>{children}</ResourceProvider>
            </AdminNavigationProvider>
          </ResourceAuthorizationProvider>
        </ResourceExecutionContextProvider>
      </QueryClientProvider>
    ),
  };
}

function resource(queryFn: () => Promise<{ rows: Row[]; count: number }>) {
  return defineResource<Row>({
    metadata: { name: 'users', label: 'Users', singularLabel: 'User' },
    query: {
      queryKey: ({ state }) => ['users', state.search],
      queryFn,
      normalize: (response) => response,
    },
    dataView: { columns: [], getRowId: (row) => row.id, processingMode: 'server' },
  });
}

describe('Resource runtime and navigation adapter', () => {
  it('loads normalized rows through the injected navigation/runtime boundary', async () => {
    const queryFn = vi.fn(async () => ({ rows: [{ id: '1', name: 'One' }], count: 1 }));
    const { wrapper } = createWrapper(resource(queryFn));
    const { result } = renderHook(() => useResource<Row>(), { wrapper });
    await waitFor(() => expect(result.current.dataView.data).toEqual([{ id: '1', name: 'One' }]));
    expect(queryFn).toHaveBeenCalledOnce();
    expect(result.current.dataView.processingMode).toBe('server');
    expect(result.current.density).toBe('comfortable');
  });

  it('does not execute a scoped query without scopeId', async () => {
    const queryFn = vi.fn(async () => ({ rows: [{ id: '1', name: 'One' }], count: 1 }));
    const definition = { ...resource(queryFn), scope: 'scoped' as const };
    const { wrapper } = createWrapper(definition);
    const { result } = renderHook(() => useResource<Row>(), { wrapper });
    await act(async () => undefined);
    expect(queryFn).not.toHaveBeenCalled();
    expect(result.current.dataView.data).toEqual([]);
    expect(result.current.dataView.errorState?.context).toBe('execution_context');
    expect(result.current.dataView.errorState?.error.code).toBe('RESOURCE_SCOPE_CONTEXT_REQUIRED');
  });

  it('rejects scoped mutations without scopeId and never calls the domain adapter', async () => {
    const mutationFn = vi.fn(async () => undefined);
    const definition = {
      ...resource(vi.fn(async () => ({ rows: [], count: 0 }))),
      scope: 'scoped' as const,
      mutations: {
        delete: {
          mutationFn,
          getInput: (row: Row) => row.id,
        },
      },
    };
    const { wrapper } = createWrapper(definition);
    const { result } = renderHook(() => useResource<Row>(), { wrapper });
    await expect(result.current.actions.delete({ id: '1', name: 'One' })).rejects.toMatchObject({
      code: 'RESOURCE_SCOPE_CONTEXT_REQUIRED',
      type: 'execution_context',
    });
    expect(mutationFn).not.toHaveBeenCalled();
  });

  it('applies mutation cache updates within the captured scope only', async () => {
    const definition = {
      ...resource(vi.fn(async () => ({ rows: [], count: 0 }))),
      scope: 'scoped' as const,
      mutations: {
        create: {
          mutationFn: async () => ({ id: 'created' }),
          invalidate: [['users'] as const],
          updateCache: ({ cache }: { cache: { setListData(value: { rows: Row[]; count: number }): unknown } }) => {
            cache.setListData({ rows: [{ id: 'created', name: 'Created' }], count: 1 });
          },
        },
      },
    };
    const { wrapper, queryClient } = createWrapper(definition, 'scope-a');
    const { result } = renderHook(() => useResource<Row, void>(), { wrapper });
    await act(async () => { await result.current.actions.create(undefined); });
    expect(queryClient.getQueryData(['scope', 'scope-a', 'users'])).toEqual({
      rows: [{ id: 'created', name: 'Created' }],
      count: 1,
    });
    expect(queryClient.getQueryData(['scope', 'scope-b', 'users'])).toBeUndefined();
  });

  it('uses the navigation adapter for URL-backed state and safely ignores invalid sorting', () => {
    const queryClient = new QueryClient();
    const navigation = {
      pathname: '/users',
      searchParams: new URLSearchParams('sort=invalid&page=0'),
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
    };
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <AdminNavigationProvider navigation={navigation} location={navigation}>
          {children}
        </AdminNavigationProvider>
      </QueryClientProvider>
    );
    const { result } = renderHook(() => useDataViewUrlState({ allowedSortIds: ['name'] }), { wrapper });
    expect(result.current.state.pagination.pageIndex).toBe(0);
    expect(result.current.state.sorting).toEqual([]);
    act(() => result.current.setSorting([{ id: 'name', desc: true }]));
    expect(navigation.replace).toHaveBeenCalledWith('/users?sort=-name&page=1', { scroll: false });
  });

  it('exposes blocking and partial query errors without dropping retained rows', async () => {
    const queryFn = vi.fn()
      .mockResolvedValueOnce({ rows: [{ id: '1', name: 'One' }], count: 1 })
      .mockRejectedValueOnce(new Error('refresh failed'));
    const { wrapper } = createWrapper(resource(queryFn));
    const { result } = renderHook(() => useResource<Row>(), { wrapper });
    await waitFor(() => expect(result.current.dataView.data).toHaveLength(1));
    await act(async () => { result.current.dataView.onRetry(); });
    await waitFor(() => expect(result.current.dataView.partialErrorState?.context).toBe('partial'));
    expect(result.current.dataView.partialError).toBeTruthy();
    expect(result.current.dataView.data).toEqual([{ id: '1', name: 'One' }]);
  });

  it('propagates TanStack cancellation to the feature query adapter', async () => {
    let capturedSignal: AbortSignal | undefined;
    let resolveRequest: ((value: { rows: Row[]; count: number }) => void) | undefined;
    const definition = defineResource<Row>({
      metadata: { name: 'users', label: 'Users', singularLabel: 'User' },
      query: {
        queryKey: () => ['users'],
        queryFn: ({ signal }) => {
          capturedSignal = signal;
          return new Promise((resolve) => { resolveRequest = resolve; });
        },
        normalize: (response) => response,
      },
      dataView: { columns: [], getRowId: (row) => row.id },
    });
    const { wrapper } = createWrapper(definition);
    const rendered = renderHook(() => useResource<Row>(), { wrapper });
    await waitFor(() => expect(capturedSignal).toBeDefined());
    rendered.unmount();
    await waitFor(() => expect(capturedSignal?.aborted).toBe(true));
    resolveRequest?.({ rows: [], count: 0 });
  });

  it('resets selection on query-boundary changes and preserves local column preferences', async () => {
    window.localStorage.setItem('resource-columns', JSON.stringify({ columnVisibility: { name: false }, columnOrder: ['name'] }));
    const queryClient = new QueryClient();
    const navigation = {
      pathname: '/users',
      searchParams: new URLSearchParams(),
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
    };
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <AdminNavigationProvider navigation={navigation} location={navigation}>
          {children}
        </AdminNavigationProvider>
      </QueryClientProvider>
    );
    const { result } = renderHook(() => useDataViewUrlState({ persistenceKey: 'resource-columns' }), { wrapper });
    await waitFor(() => expect(result.current.state.columnVisibility).toEqual({ name: false }));
    act(() => result.current.setSelectedIds(['a', 'b']));
    expect(result.current.selection.executeIds).toEqual(['a', 'b']);
    act(() => result.current.setPagination({ pageIndex: 1, pageSize: 20 }));
    expect(result.current.selection.executeIds).toEqual([]);
  });
});
