import { describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
  createDataViewState,
  createResourceSelection,
  collectDataViewPages,
  selectDataViewQueryState,
  toDataViewQueryParams,
  normalizeDataViewFilters,
  normalizeDataViewState,
  resolveResourceSelectionExecution,
} from '../src/data-view/state';
import { resolveDataViewViewsConfig } from '../src/data-view/views';
import type { DataViewHierarchyConfig } from '../src/data-view/contracts';
import { createResourceAuthorization, resolveResourceAccess, authorizationPermissions } from '../src/resource/authorization';
import { createResourceCacheTools } from '../src/resource/cache';
import { ResourceContextError, resolveResourceError } from '../src/resource/errors';
import { defineResource, resolveResourceCapabilities } from '../src/resource/contracts';
import { MISSING_SCOPE_KEY, scopeResourceKey } from '../src/resource/scope';
import { getResourceFormOwnership } from '../src/resource/contracts/resource-form';

type Row = { id: string; name: string };

const baseDefinition = defineResource<Row>({
  metadata: { name: 'users', label: 'Users', singularLabel: 'User' },
  query: {
    queryKey: ({ state }) => ['users', state.search],
    queryFn: async () => ({ rows: [], count: 0 }),
    normalize: (response) => response,
  },
  dataView: {
    columns: [],
    getRowId: (row) => row.id,
    selection: { enabled: true, preserveAcrossPages: true },
  },
});

describe('Resource scope and cache contracts', () => {
  it('uses independent global and scoped key namespaces', () => {
    expect(scopeResourceKey('global', ['users'])).toEqual(['global', 'users']);
    expect(scopeResourceKey('scoped', ['users'], 'scope-a')).toEqual(['scope', 'scope-a', 'users']);
    expect(scopeResourceKey('scoped', ['users'], 'scope-b')).toEqual(['scope', 'scope-b', 'users']);
    expect(scopeResourceKey('scoped', ['users'])).toEqual([...MISSING_SCOPE_KEY, 'users']);
  });

  it('keeps cache reads, writes, and invalidation isolated by scope', async () => {
    const client = new QueryClient();
    const global = createResourceCacheTools<Row>({ client, scope: 'global', listQueryKey: ['users'] });
    const scopeA = createResourceCacheTools<Row>({ client, scope: 'scoped', scopeId: 'a', listQueryKey: ['users'] });
    const scopeB = createResourceCacheTools<Row>({ client, scope: 'scoped', scopeId: 'b', listQueryKey: ['users'] });

    global.setListData({ rows: [{ id: 'global', name: 'Global' }], count: 1 });
    scopeA.setListData({ rows: [{ id: 'a', name: 'A' }], count: 1 });
    scopeB.setListData({ rows: [{ id: 'b', name: 'B' }], count: 1 });

    expect(global.getListData()?.rows[0]?.id).toBe('global');
    expect(scopeA.getListData()?.rows[0]?.id).toBe('a');
    expect(scopeB.getListData()?.rows[0]?.id).toBe('b');

    await scopeA.invalidateList();
    expect(client.getQueryState(['scope', 'a', 'users'])?.isInvalidated).toBe(true);
    expect(client.getQueryState(['scope', 'b', 'users'])?.isInvalidated).not.toBe(true);
    expect(client.getQueryState(['global', 'users'])?.isInvalidated).not.toBe(true);
  });

  it('prevents late A responses and mutation callbacks from touching B', () => {
    const client = new QueryClient();
    const scopeA = createResourceCacheTools<Row>({ client, scope: 'scoped', scopeId: 'a', listQueryKey: ['users'] });
    const scopeB = createResourceCacheTools<Row>({ client, scope: 'scoped', scopeId: 'b', listQueryKey: ['users'] });

    scopeA.setListData({ rows: [{ id: 'late-a', name: 'A' }], count: 1 });
    expect(scopeB.getListData()).toBeUndefined();
    scopeB.setListData({ rows: [{ id: 'b', name: 'B' }], count: 1 });
    scopeA.updateListData((current) => ({
      ...(current ?? { rows: [], count: 0 }),
      rows: [{ id: 'late-a-2', name: 'A callback' }],
    }));
    expect(scopeB.getListData()?.rows[0]?.id).toBe('b');
  });

  it('fails closed when a scoped execution context is missing', async () => {
    const client = new QueryClient();
    const missing = createResourceCacheTools({ client, scope: 'scoped', listQueryKey: ['users'] });
    expect(missing.available).toBe(false);
    expect(missing.getListData()).toBeUndefined();
    expect(missing.setListData({ rows: [], count: 0 })).toBeUndefined();
    await missing.invalidateList();
    expect(client.getQueryCache().findAll()).toHaveLength(0);

    const error = new ResourceContextError('scope is required');
    expect(error.type).toBe('execution_context');
    expect(error.code).toBe('RESOURCE_SCOPE_CONTEXT_REQUIRED');
  });
});

describe('DataView contracts', () => {
  it('normalizes configured views once and never stores an invalid URL view', () => {
    const views = resolveDataViewViewsConfig({
      default: 'calendar',
      available: ['table', 'calendar', 'calendar'],
    });
    expect(views.available).toEqual(['table', 'calendar']);
    expect(views.default).toBe('calendar');
    expect(views.normalize('banana')).toBe('calendar');
    expect(views.normalize('table')).toBe('table');
    expect(views.isConfigured('banana')).toBe(false);
  });

  it('normalizes filters, state, sorting, and semantic selection deterministically', () => {
    expect(normalizeDataViewFilters({ z: '  ', roles: ['b', 'a', 'a'], score: 2 })).toEqual({
      roles: ['a', 'b'],
      score: 2,
    });
    expect(normalizeDataViewState({
      ...createDataViewState(),
      search: '  users ',
      pagination: { pageIndex: -2, pageSize: 0 },
      sorting: [{ id: 'name', desc: 1 as unknown as boolean }, { id: 'ignored', desc: false }],
      rowSelection: { b: true, a: true, c: false },
    })).toMatchObject({
      search: 'users',
      pagination: { pageIndex: 0, pageSize: 1 },
      sorting: [{ id: 'name', desc: true }],
      rowSelection: { a: true, b: true },
    });
    expect(createResourceSelection({ b: true, a: true, c: false })).toEqual({
      mode: 'explicit',
      selectedIds: ['a', 'b'],
      executeIds: ['a', 'b'],
    });
    expect(resolveResourceSelectionExecution({ successIds: ['a'], failedIds: ['b'] }, ['a', 'b', 'c'])).toEqual({
      successIds: ['a'],
      failedIds: ['b'],
    });
    expect(toDataViewQueryParams(createDataViewState({
      search: ' users ',
      filters: { roles: ['b', 'a'] },
      sorting: [{ id: 'name', desc: true }],
    }))).toEqual({
      page: 1,
      pageSize: 20,
      search: 'users',
      filters: { roles: ['a', 'b'] },
      sort: { field: 'name', order: 'desc' },
    });
  });

  it('projects only query state and serializes only backend query parameters', () => {
    const state = createDataViewState({
      search: ' users ',
      filters: { roles: ['b', 'a'] },
      sorting: [{ id: 'name', desc: true }],
      pagination: { pageIndex: 2, pageSize: 10 },
      view: 'calendar',
      columnVisibility: { name: false },
      columnOrder: ['name'],
      rowSelection: { user: true },
      expanded: { user: true },
    });

    expect(selectDataViewQueryState(state)).toEqual({
      search: 'users',
      filters: { roles: ['a', 'b'] },
      sorting: [{ id: 'name', desc: true }],
      pagination: { pageIndex: 2, pageSize: 10 },
    });
    expect(Object.keys(selectDataViewQueryState(state)).sort()).toEqual([
      'filters',
      'pagination',
      'search',
      'sorting',
    ]);

    const params = toDataViewQueryParams(state);
    expect(params).toEqual({
      page: 3,
      pageSize: 10,
      search: 'users',
      filters: { roles: ['a', 'b'] },
      sort: { field: 'name', order: 'desc' },
    });
    expect(Object.keys(params).sort()).toEqual(['filters', 'page', 'pageSize', 'search', 'sort']);
  });

  it('prevents presentation fields from entering Resource query callbacks by type', () => {
    const definition = defineResource<Row>({
      metadata: { name: 'query-only', label: 'Query-only', singularLabel: 'Query-only' },
      query: {
        queryKey: ({ state }) => {
          // @ts-expect-error Resource query callbacks receive query state only.
          state.view;
          // @ts-expect-error Resource query callbacks receive query state only.
          state.rowSelection;
          // @ts-expect-error Resource query callbacks receive query state only.
          state.columnVisibility;
          // @ts-expect-error Resource query callbacks receive query state only.
          state.expanded;
          return ['query-only', state.search];
        },
        queryFn: async () => ({ rows: [], count: 0 }),
        normalize: (response) => response,
      },
      dataView: { columns: [], getRowId: (row) => row.id },
    });

    expect(definition.query).toBeDefined();
  });

  it('supports partial bulk outcomes without claiming unloaded rows succeeded', () => {
    expect(resolveResourceSelectionExecution({ failures: [{ id: 'b' }] }, ['a', 'b'])).toEqual({
      successIds: ['a'],
      failedIds: ['b'],
    });
  });

  it('collects bounded export pages and retains hierarchy/form ownership metadata', async () => {
    const fetchPage = vi.fn(async (page: number, pageSize: number) => ({
      page,
      pageSize,
      count: 3,
      rows: page === 1 ? [{ id: '1' }, { id: '2' }] : [{ id: '3' }],
    }));
    await expect(collectDataViewPages({ fetchPage, pageSize: 2 })).resolves.toEqual([
      { id: '1' },
      { id: '2' },
      { id: '3' },
    ]);
    expect(fetchPage).toHaveBeenCalledTimes(2);

    const hierarchy: DataViewHierarchyConfig<Row> = {
      enabled: true,
      getRowId: (row) => row.id,
      getParentId: () => null,
      getOrder: () => 0,
    };
    expect(hierarchy.enabled).toBe(true);
    expect(getResourceFormOwnership([{ id: 'identity', fields: [{ field: 'Text', name: 'name' }] }])).toEqual([
      { id: 'identity', fields: ['name'] },
    ]);
  });
});

describe('authorization, capabilities, and errors', () => {
  it('resolves UX capabilities without replacing backend authorization', () => {
    const definition = defineResource<Row, { name: string }, { name: string }>({
      metadata: { name: 'users', label: 'Users', singularLabel: 'User' },
      query: baseDefinition.query,
      dataView: baseDefinition.dataView,
      authorization: { read: 'users.read', create: 'users.create' },
      forms: {
        create: { mode: 'page', href: () => '/users/new' },
      },
      mutations: { create: { mutationFn: async () => undefined } },
    });
    const authorization = createResourceAuthorization({ permissions: ['users.read', 'users.create'] });
    expect(resolveResourceCapabilities(definition, {}, authorization).create).toBe(true);
    expect(resolveResourceAccess(definition, authorization)).toMatchObject({ protected: true, ready: true, read: true });
    expect(authorizationPermissions(definition.authorization)).toEqual(['users.read', 'users.create']);
  });

  it('exposes typed blocking and partial error states', () => {
    const queryError = resolveResourceError(new Error('database failed'), 'query');
    expect(queryError?.blocking).toBe(true);
    expect(queryError?.retryable).toBe(true);
    const partial = resolveResourceError({ type: 'database', code: 'PARTIAL', message: 'partial' }, 'partial', {
      partial: { succeededIds: ['a'], failedIds: ['b'] },
    });
    expect(partial?.severity).toBe('warning');
    expect(partial?.partial).toEqual({ succeededIds: ['a'], failedIds: ['b'] });
  });
});

describe('mutation cache callbacks', () => {
  it('does not expose a missing scoped cache to late callbacks', () => {
    const client = new QueryClient();
    const cache = createResourceCacheTools({ client, scope: 'scoped', listQueryKey: ['users'] });
    const update = vi.fn(() => cache.setListData({ rows: [], count: 0 }));
    update();
    expect(update).toHaveBeenCalledOnce();
    expect(client.getQueryCache().findAll()).toHaveLength(0);
  });
});
