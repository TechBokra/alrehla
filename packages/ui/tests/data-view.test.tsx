import * as React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AdminNavigationProvider,
  defineResource,
  ResourceProvider,
  useResource,
  type AdminLocationAdapter,
  type AdminNavigationAdapter,
  type ResourceDefinition,
} from '@alrehla/admin-core';
import {
  DataViewRegistryProvider,
  DataViewSwitcher,
  ResourceBulkActionBar,
  ResourceDataView,
  ResourceDensityMenu,
  ResourcePage,
  ResourcePagination,
  ResourceSearch,
  ResourceToolbar,
  createDataViewRegistry,
  defaultDataViewRegistry,
  useDataViewPresentation,
  type DataViewRendererDefinition,
} from '../src';

type DemoRow = { id: string; title: string; startAt: string; endAt: string };

const rows: DemoRow[] = Array.from({ length: 20 }, (_, index) => ({
  id: String.fromCharCode(65 + index),
  title: `Event ${index + 1}`,
  startAt: `2026-01-${String(index + 1).padStart(2, '0')}T09:00:00Z`,
  endAt: `2026-01-${String(index + 1).padStart(2, '0')}T10:00:00Z`,
}));

function createFixtureDefinition(
  queryFn: ReturnType<typeof vi.fn> = vi.fn(async () => ({ rows, count: 100 })),
  getEvent: (row: DemoRow) => { id: string; title: string; start: string; end: string } = (row) => ({
    id: row.id,
    title: row.title,
    start: row.startAt,
    end: row.endAt,
  }),
) {
  return defineResource<DemoRow>({
    metadata: { name: 'demo-events', label: 'Events', singularLabel: 'Event' },
    query: {
      queryKey: ({ state }) => ['demo-events', state.search, state.filters, state.sorting, state.pagination],
      queryFn,
      normalize: (response) => response,
    },
    pagination: { enabled: true, pageSizeOptions: [20] },
    dataView: {
      views: { default: 'table', available: ['table', 'calendar'] },
      columns: [
        { id: 'id', accessorKey: 'id', header: 'ID' },
        { id: 'title', accessorKey: 'title', header: 'Title' },
      ],
      getRowId: (row) => row.id,
      checkbox: true,
      selection: { enabled: true, mode: 'multiple' },
      bulkActions: [{ id: 'archive', label: 'Archive', executeIds: vi.fn() }],
      calendar: {
        getEvent,
      },
      processingMode: 'server',
      urlState: { allowedSortIds: ['id', 'title'] },
    },
  });
}

function parseLocation(url: string): AdminLocationAdapter {
  const [pathname, query = ''] = url.split('?');
  return { pathname, searchParams: new URLSearchParams(query) };
}

function FixtureHarness({
  definition,
  queryClient,
  children,
  registry,
}: {
  definition: ResourceDefinition<DemoRow>;
  queryClient: QueryClient;
  children: React.ReactNode;
  registry?: ReturnType<typeof createDataViewRegistry>;
}) {
  const [location, setLocation] = React.useState<AdminLocationAdapter>(() => parseLocation('/events?page=3&pageSize=20'));
  const navigate = React.useCallback((url: string) => setLocation(parseLocation(url)), []);
  const navigation = React.useMemo<AdminNavigationAdapter>(() => ({
    push: navigate,
    replace: navigate,
    back: vi.fn(),
  }), [navigate]);
  const content = (
    <QueryClientProvider client={queryClient}>
      <AdminNavigationProvider navigation={navigation} location={location}>
        <ResourcePage resource={definition} defaultDensity="comfortable">
          {children}
        </ResourcePage>
      </AdminNavigationProvider>
    </QueryClientProvider>
  );
  return registry ? (
    <DataViewRegistryProvider registry={registry}>{content}</DataViewRegistryProvider>
  ) : content;
}

function PresentationConsumer() {
  const presentation = useDataViewPresentation();
  const { dataView, dataTable, density } = useResource<DemoRow>();
  return (
    <output data-testid="presentation-state">
      {JSON.stringify({
        activeView: presentation.activeView,
        usableViews: presentation.usableViews,
        rendererAvailable: presentation.rendererAvailable,
        effectiveCapabilities: presentation.effectiveCapabilities,
        resourceControlCapabilities: dataView.controlCapabilities,
        pageIndex: dataView.state.pagination.pageIndex,
        selectedIds: dataView.selectionState.selectedIds,
        density,
        columnVisibility: dataView.state.columnVisibility,
        columnOrder: dataView.state.columnOrder,
        expanded: dataView.state.expanded,
        hasDataTable: Boolean(dataTable),
      })}
    </output>
  );
}

function StateSeeder() {
  const { dataView, density, setDensity } = useResource<DemoRow>();
  const seeded = React.useRef(false);
  React.useEffect(() => {
    if (!dataView.data.length || seeded.current) return;
    seeded.current = true;
    dataView.setSelectedIds(['A', 'B']);
    dataView.onColumnVisibilityChange({ title: false });
    dataView.onColumnOrderChange(['title', 'id']);
    dataView.onExpandedChange({ A: true });
    if (density !== 'compact') setDensity('compact');
  }, [dataView, density, setDensity]);
  return null;
}

function QueryStateChanger() {
  const { dataView } = useResource<DemoRow>();
  const changed = React.useRef(false);
  React.useEffect(() => {
    if (changed.current) return;
    changed.current = true;
    dataView.onSearchChange('query');
    dataView.onSortingChange([{ id: 'title', desc: false }]);
    dataView.onPaginationChange({ pageIndex: 1, pageSize: 20 });
  }, [dataView]);
  return null;
}

describe('DataView presentation provider and ResourcePage integration', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('fails fast when presentation state is consumed outside its provider', () => {
    class ErrorBoundary extends React.Component<
      { children: React.ReactNode },
      { error: Error | null }
    > {
      state = { error: null };
      static getDerivedStateFromError(error: Error) {
        return { error };
      }
      render() {
        return this.state.error
          ? <output data-testid="presentation-error">{this.state.error.message}</output>
          : this.props.children;
      }
    }
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<ErrorBoundary><PresentationConsumer /></ErrorBoundary>);
    expect(screen.getByTestId('presentation-error')).toHaveTextContent(
      'DataView presentation components must be rendered inside DataViewPresentationProvider.',
    );
  });

  it('keeps registry extension immutable and local', () => {
    const mapRenderer = (() => null) as DataViewRendererDefinition['renderer'];
    const extended = defaultDataViewRegistry.extend({
      map: {
        id: 'map',
        renderer: mapRenderer,
        label: 'Map',
        capabilities: {
          pagination: false,
          columns: false,
          density: false,
          selection: false,
          sorting: false,
        },
      },
    });
    expect(defaultDataViewRegistry.get('map')).toBeUndefined();
    expect(extended.get('map')?.label).toBe('Map');
    expect(defaultDataViewRegistry.entries()).toHaveLength(2);
  });

  it('keeps automatic switching hidden when only one configured renderer is usable', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const definition = createFixtureDefinition();
    const singleViewDefinition = {
      ...definition,
      dataView: { ...definition.dataView, views: { default: 'table', available: ['table'] } },
    } as ResourceDefinition<DemoRow>;
    render(
      <FixtureHarness definition={singleViewDefinition} queryClient={queryClient}>
        <DataViewSwitcher />
      </FixtureHarness>,
    );
    await waitFor(() => expect(screen.queryByRole('group', { name: 'طريقة العرض' })).not.toBeInTheDocument());
  });

  it('automatically mounts the provider and shares effective capabilities with ResourcePage children', async () => {
    const queryFn = vi.fn(async () => ({ rows, count: 100 }));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <FixtureHarness definition={createFixtureDefinition(queryFn)} queryClient={queryClient}>
        <PresentationConsumer />
      </FixtureHarness>,
    );
    await waitFor(() => expect(screen.getByTestId('presentation-state')).toBeInTheDocument());
    expect(JSON.parse(screen.getByTestId('presentation-state').textContent ?? '')).toMatchObject({
      activeView: 'table',
      usableViews: ['table', 'calendar'],
      rendererAvailable: true,
      effectiveCapabilities: {
        pagination: true,
        selection: true,
        density: true,
        columns: true,
        sorting: true,
      },
    });
  });

  it('keeps Resource capability restrictions authoritative over renderer capabilities', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const base = createFixtureDefinition();
    const restrictedDefinition = {
      ...base,
      capabilities: { selection: false },
      pagination: { enabled: false, pageSizeOptions: [20] },
    } as ResourceDefinition<DemoRow>;
    render(
      <FixtureHarness definition={restrictedDefinition} queryClient={queryClient}>
        <PresentationConsumer />
      </FixtureHarness>,
    );
    await waitFor(() => expect(screen.getByTestId('presentation-state')).toBeInTheDocument());
    expect(JSON.parse(screen.getByTestId('presentation-state').textContent ?? '')).toMatchObject({
      resourceControlCapabilities: {
        pagination: false,
        selection: false,
      },
      effectiveCapabilities: {
        pagination: false,
        selection: false,
      },
    });
  });

  it('verifies visible controls, preserved presentation state, and one query identity across table/calendar/table', async () => {
    const queryFn = vi.fn(async () => ({ rows, count: 100 }));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const definition = createFixtureDefinition(queryFn);
    render(
      <FixtureHarness definition={definition} queryClient={queryClient}>
        <ResourceToolbar>
          <ResourceSearch />
          <ResourceBulkActionBar />
          <ResourceDensityMenu />
        </ResourceToolbar>
        <ResourceDataView />
        <ResourcePagination />
        <StateSeeder />
        <PresentationConsumer />
      </FixtureHarness>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('resource-table-view')).toBeInTheDocument();
      expect(screen.getByTestId('resource-pagination')).toBeInTheDocument();
      expect(screen.getByTestId('resource-bulk-action-bar')).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: 'كثافة الصفوف' })).toHaveValue('compact');
      expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0);
      expect(JSON.parse(screen.getByTestId('presentation-state').textContent ?? '')).toMatchObject({
        hasDataTable: true,
      });
    });

    const initialQuery = queryClient.getQueryCache().getAll();
    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(initialQuery).toHaveLength(1);
    const queryKey = initialQuery[0]!.queryKey;
    const cached = queryClient.getQueryData(queryKey);
    const initialState = JSON.parse(screen.getByTestId('presentation-state').textContent ?? '');
    expect(initialState).toMatchObject({
      pageIndex: 2,
      selectedIds: ['A', 'B'],
      density: 'compact',
      columnVisibility: { title: false },
      columnOrder: ['title', 'id'],
      expanded: { A: true },
      hasDataTable: true,
    });

    fireEvent.click(screen.getByRole('button', { name: 'تقويم' }));
    await waitFor(() => expect(screen.getByTestId('calendar-view')).toBeInTheDocument(), { timeout: 10000 });
    expect(screen.queryByTestId('resource-pagination')).not.toBeInTheDocument();
    expect(screen.queryByTestId('resource-bulk-action-bar')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'كثافة الصفوف' })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryCache().getAll()).toHaveLength(1);
    expect(queryClient.getQueryCache().getAll()[0]!.queryKey).toEqual(queryKey);
    expect(queryClient.getQueryData(queryKey)).toEqual(cached);
    expect(queryClient.getQueryState(queryKey)?.isInvalidated).not.toBe(true);
    expect(JSON.parse(screen.getByTestId('presentation-state').textContent ?? '')).toMatchObject({
      pageIndex: initialState.pageIndex,
      selectedIds: initialState.selectedIds,
      density: initialState.density,
      columnVisibility: initialState.columnVisibility,
      columnOrder: initialState.columnOrder,
      expanded: initialState.expanded,
      hasDataTable: false,
    });

    fireEvent.click(screen.getByRole('button', { name: 'جدول' }));
    await waitFor(() => expect(screen.getByTestId('resource-table-view')).toBeInTheDocument());
    expect(screen.getByTestId('resource-pagination')).toBeInTheDocument();
    expect(screen.getByTestId('resource-bulk-action-bar')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'كثافة الصفوف' })).toHaveValue('compact');
    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryCache().getAll()[0]!.queryKey).toEqual(queryKey);
    expect(queryClient.getQueryData(queryKey)).toEqual(cached);
    expect(JSON.parse(screen.getByTestId('presentation-state').textContent ?? '')).toMatchObject({
      ...initialState,
      hasDataTable: true,
    });
  });

  it('keeps ResourceProvider headless without presentation infrastructure', async () => {
    const queryFn = vi.fn(async () => ({ rows: [{ id: 'A', name: 'A' }], count: 1 }));
    const definition = defineResource<{ id: string; name: string }>({
      metadata: { name: 'headless', label: 'Headless', singularLabel: 'Headless' },
      query: { queryKey: () => ['headless'], queryFn, normalize: (response) => response },
      dataView: { columns: [], getRowId: (row) => row.id },
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const navigation = {
      pathname: '/headless',
      searchParams: new URLSearchParams(),
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
    };
    function HeadlessConsumer() {
      const { dataView } = useResource<{ id: string; name: string }>();
      return <output data-testid="headless-rows">{dataView.data.length}</output>;
    }
    render(
      <QueryClientProvider client={queryClient}>
        <AdminNavigationProvider navigation={navigation} location={navigation}>
          <ResourceProvider definition={definition}>
            <HeadlessConsumer />
          </ResourceProvider>
        </AdminNavigationProvider>
      </QueryClientProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('headless-rows')).toHaveTextContent('1'));
    expect(queryFn).toHaveBeenCalledOnce();
  });

  it('maps every currently loaded Resource row once without using table rows', async () => {
    const queryFn = vi.fn(async () => ({ rows, count: 100 }));
    const getEvent = vi.fn((row: DemoRow) => ({
      id: row.id,
      title: row.title,
      start: row.startAt,
      end: row.endAt,
    }));
    const onRangeChange = vi.fn();
    const base = createFixtureDefinition(queryFn, getEvent);
    const definition = {
      ...base,
      dataView: {
        ...base.dataView,
        views: { default: 'calendar', available: ['table', 'calendar'] },
        calendar: { ...base.dataView.calendar!, onRangeChange },
      },
    } as ResourceDefinition<DemoRow>;
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <FixtureHarness definition={definition} queryClient={queryClient}>
        <ResourceDataView />
      </FixtureHarness>,
    );
    await waitFor(() => expect(screen.getByTestId('calendar-view')).toBeInTheDocument());
    expect(getEvent).toHaveBeenCalledTimes(rows.length);
    expect(getEvent.mock.calls.map(([row]) => row.id)).toEqual(rows.map((row) => row.id));
    expect(onRangeChange).toHaveBeenCalled();
    expect(queryFn).toHaveBeenCalledOnce();
  });

  it('honors neutral Arabic and RTL Calendar configuration without changing Resource loading', async () => {
    const queryFn = vi.fn(async () => ({ rows, count: 100 }));
    const base = createFixtureDefinition(queryFn);
    const definition = {
      ...base,
      dataView: {
        ...base.dataView,
        views: { default: 'calendar', available: ['table', 'calendar'] },
        calendar: { ...base.dataView.calendar!, locale: 'ar', direction: 'rtl' },
      },
    } as ResourceDefinition<DemoRow>;
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <FixtureHarness definition={definition} queryClient={queryClient}>
        <ResourceDataView />
      </FixtureHarness>,
    );
    await waitFor(() => expect(screen.getByTestId('calendar-view')).toBeInTheDocument());
    expect(screen.getByTestId('calendar-view')).toHaveAttribute('dir', 'rtl');
    expect(queryFn).toHaveBeenCalledOnce();
  });

  it('keeps Calendar stylesheet opt-in and out of the lazy renderer module', () => {
    const calendarSource = readFileSync(resolve(import.meta.dirname, '../src/components/data-view/calendar-view.tsx'), 'utf8');
    const packageJson = JSON.parse(readFileSync(resolve(import.meta.dirname, '../package.json'), 'utf8')) as {
      exports: Record<string, string>;
      dependencies?: Record<string, string>;
    };
    expect(calendarSource).not.toContain('calendar.css');
    expect(packageJson.exports['./calendar.css']).toBe('./src/calendar.css');
    expect(packageJson.dependencies?.['@fullcalendar/daygrid']).toBeUndefined();
    expect(packageJson.dependencies?.['@fullcalendar/timegrid']).toBeUndefined();
    expect(packageJson.dependencies?.['@fullcalendar/list']).toBeUndefined();
  });

  it('uses the shared provider result for a custom registry without showing unregistered configured views', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const definition = {
      ...createFixtureDefinition(vi.fn(async () => ({ rows, count: 100 }))),
      dataView: {
        ...createFixtureDefinition().dataView,
        views: { default: 'map', available: ['table', 'calendar', 'map'] },
      },
    } as ResourceDefinition<DemoRow>;
    const customRegistry = createDataViewRegistry({
      table: defaultDataViewRegistry.get('table')!,
      calendar: defaultDataViewRegistry.get('calendar')!,
    });
    render(
      <FixtureHarness definition={definition} queryClient={queryClient} registry={customRegistry}>
        <DataViewSwitcher visibility="always" />
        <PresentationConsumer />
      </FixtureHarness>,
    );
    await waitFor(() => expect(screen.getByTestId('presentation-state')).toBeInTheDocument());
    expect(JSON.parse(screen.getByTestId('presentation-state').textContent ?? '')).toMatchObject({
      activeView: 'map',
      usableViews: ['table', 'calendar'],
      rendererAvailable: false,
    });
    expect(screen.queryByRole('button', { name: 'Map' })).not.toBeInTheDocument();
  });

  it('does not let query-state changes alter presentation semantics', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const definition = createFixtureDefinition(vi.fn(async () => ({ rows, count: 100 })));
    const rendered = render(
      <FixtureHarness definition={definition} queryClient={queryClient}>
        <ResourceSearch />
        <PresentationConsumer />
        <QueryStateChanger />
      </FixtureHarness>,
    );
    await waitFor(() => expect(screen.getByTestId('presentation-state')).toBeInTheDocument());
    const before = JSON.parse(screen.getByTestId('presentation-state').textContent ?? '');
    await waitFor(() => expect(queryClient.getQueryCache().getAll().length).toBeGreaterThan(1));
    rendered.rerender(
      <FixtureHarness definition={definition} queryClient={queryClient}>
        <ResourceSearch />
        <PresentationConsumer />
        <QueryStateChanger />
      </FixtureHarness>,
    );
    expect(JSON.parse(screen.getByTestId('presentation-state').textContent ?? '')).toMatchObject({
      activeView: before.activeView,
      usableViews: before.usableViews,
      rendererAvailable: before.rendererAvailable,
      effectiveCapabilities: before.effectiveCapabilities,
    });
  });
});
