import * as React from 'react';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AdminNavigationProvider,
  defineResource,
  useResource,
  type AdminLocationAdapter,
  type AdminNavigationAdapter,
  type ResourceDefinition,
} from '@alrehla/admin-core';
import { ResourceDataView, ResourcePage } from '../src';

interface MockCalendarProps {
  events?: readonly { id: string; title: string }[];
  initialView?: string;
  direction?: string;
  eventClick?: (info: { event: { id: string } }) => void;
  dateClick?: (info: { date: Date }) => void;
  datesSet?: (info: { start: Date; end: Date }) => void;
}

vi.mock('@fullcalendar/react', () => ({
  default: function MockFullCalendar({
    events = [],
    initialView,
    direction,
    eventClick,
    dateClick,
    datesSet,
  }: MockCalendarProps) {
    return (
      <div
        data-testid="mock-full-calendar"
        data-initial-view={initialView}
        data-direction={direction}
      >
        {events.map((event) => (
          <button
            key={event.id}
            type="button"
            onClick={() => eventClick?.({ event: { id: event.id } })}
          >
            event-{event.id}
          </button>
        ))}
        <button
          type="button"
          data-testid="mock-calendar-date"
          onClick={() => dateClick?.({ date: new Date('2026-02-03T00:00:00.000Z') })}
        >
          date
        </button>
        <button
          type="button"
          data-testid="mock-calendar-range"
          onClick={() => datesSet?.({
            start: new Date('2026-02-01T00:00:00.000Z'),
            end: new Date('2026-03-01T00:00:00.000Z'),
          })}
        >
          range
        </button>
      </div>
    );
  },
}));

vi.mock('@fullcalendar/react/daygrid', () => ({ default: 'daygrid' }));
vi.mock('@fullcalendar/react/interaction', () => ({ default: 'interaction' }));
vi.mock('@fullcalendar/react/list', () => ({ default: 'list' }));
vi.mock('@fullcalendar/react/timegrid', () => ({ default: 'timegrid' }));
vi.mock('@fullcalendar/react/locales/ar', () => ({ default: 'ar' }));

type CalendarRow = { id: string; title: string; startAt: string; endAt: string };

const rows: CalendarRow[] = [
  {
    id: 'A',
    title: 'Event A',
    startAt: '2026-01-01T09:00:00Z',
    endAt: '2026-01-01T10:00:00Z',
  },
];

function createDefinition({
  queryFn = vi.fn(async () => ({ rows, count: rows.length })),
  loadedRows = rows,
  count = loadedRows.length,
  processingMode = 'server',
  initialMode = 'month',
  getEvent,
  onEventClick,
  onDateClick,
  onRangeChange,
  locale,
  direction,
}: {
  queryFn?: ReturnType<typeof vi.fn>;
  loadedRows?: readonly CalendarRow[];
  count?: number;
  processingMode?: 'server' | 'client';
  initialMode?: 'month' | 'week' | 'day' | 'agenda';
  getEvent?: (record: CalendarRow) => { id: string; title: string; start: string; end: string };
  onEventClick?: (event: unknown, record: CalendarRow) => void;
  onDateClick?: (date: Date) => void;
  onRangeChange?: (range: { start: Date; end: Date }) => void;
  locale?: 'ar' | 'en';
  direction?: 'rtl' | 'ltr';
} = {}): ResourceDefinition<CalendarRow> {
  return defineResource<CalendarRow>({
    metadata: { name: 'calendar-test', label: 'Calendar test', singularLabel: 'Event' },
    query: {
      queryKey: ({ state }) => [
        'calendar-test',
        state.search,
        state.filters,
        state.sorting,
        state.pagination,
      ],
      queryFn,
      normalize: (response) => response,
    },
    pagination: { enabled: true, pageSizeOptions: [20] },
    dataView: {
      views: { default: 'calendar', available: ['calendar'] },
      columns: [{ id: 'title', accessorKey: 'title', header: 'Title' }],
      getRowId: (row) => row.id,
      processingMode,
      calendar: {
        getEvent: getEvent ?? ((record) => ({
          id: record.id,
          title: record.title,
          start: record.startAt,
          end: record.endAt,
        })),
        initialMode,
        ...(onEventClick ? { onEventClick } : {}),
        ...(onDateClick ? { onDateClick } : {}),
        ...(onRangeChange ? { onRangeChange } : {}),
        ...(locale ? { locale } : {}),
        ...(direction ? { direction } : {}),
      },
    },
  });
}

function parseLocation(url: string): AdminLocationAdapter {
  const [pathname, query = ''] = url.split('?');
  return { pathname, searchParams: new URLSearchParams(query) };
}

function CalendarHarness({
  definition,
  children = <ResourceDataView />,
}: {
  definition: ResourceDefinition<CalendarRow>;
  children?: React.ReactNode;
}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const navigation: AdminNavigationAdapter = {
    pathname: '/calendar-test',
    searchParams: new URLSearchParams(),
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  };
  return (
    <QueryClientProvider client={queryClient}>
      <AdminNavigationProvider navigation={navigation} location={navigation}>
        <ResourcePage resource={definition}>{children}</ResourcePage>
      </AdminNavigationProvider>
    </QueryClientProvider>
  );
}

describe('CalendarView adapter', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('maps all 100 client-loaded rows rather than the 20-row table page', async () => {
    const loadedRows = Array.from({ length: 100 }, (_, index) => ({
      id: String(index + 1),
      title: `Event ${index + 1}`,
      startAt: '2026-01-01T09:00:00Z',
      endAt: '2026-01-01T10:00:00Z',
    }));
    const getEvent = vi.fn((record: CalendarRow) => ({
      id: record.id,
      title: record.title,
      start: record.startAt,
      end: record.endAt,
    }));
    const queryFn = vi.fn(async () => ({ rows: loadedRows, count: 100 }));
    const definition = createDefinition({
      queryFn,
      loadedRows,
      count: 100,
      processingMode: 'client',
      getEvent,
    });

    render(<CalendarHarness definition={definition} />);

    await waitFor(() => expect(screen.getByTestId('mock-full-calendar')).toBeInTheDocument());
    expect(getEvent).toHaveBeenCalledTimes(100);
    expect(getEvent.mock.calls.map(([record]) => record.id)).toEqual(
      loadedRows.map((record) => record.id),
    );
    expect(screen.getAllByRole('button', { name: /^event-/ })).toHaveLength(100);
    expect(queryFn).toHaveBeenCalledOnce();
  });

  it('translates event clicks to the neutral event and original Resource record', async () => {
    const onEventClick = vi.fn();
    const definition = createDefinition({ onEventClick });
    render(<CalendarHarness definition={definition} />);

    await waitFor(() => expect(screen.getByRole('button', { name: 'event-A' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'event-A' }));

    expect(onEventClick).toHaveBeenCalledWith(
      {
        id: 'A',
        title: 'Event A',
        start: rows[0]!.startAt,
        end: rows[0]!.endAt,
      },
      rows[0],
    );
  });

  it('translates date clicks to a real Date', async () => {
    const onDateClick = vi.fn();
    render(<CalendarHarness definition={createDefinition({ onDateClick })} />);

    await waitFor(() => expect(screen.getByTestId('mock-calendar-date')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('mock-calendar-date'));

    expect(onDateClick).toHaveBeenCalledOnce();
    expect(onDateClick.mock.calls[0]![0]).toBeInstanceOf(Date);
    expect(onDateClick.mock.calls[0]![0].toISOString()).toBe('2026-02-03T00:00:00.000Z');
  });

  it.each([
    ['month', 'dayGridMonth'],
    ['week', 'timeGridWeek'],
    ['day', 'timeGridDay'],
    ['agenda', 'listWeek'],
  ] as const)('maps %s mode to the internal FullCalendar view', async (mode, expectedView) => {
    render(<CalendarHarness definition={createDefinition({ initialMode: mode })} />);

    await waitFor(() => expect(screen.getByTestId('mock-full-calendar')).toBeInTheDocument());
    expect(screen.getByTestId('mock-full-calendar')).toHaveAttribute('data-initial-view', expectedView);
  });

  it('renders the shared loading state while no Resource rows are loaded', async () => {
    const queryFn = vi.fn(() => new Promise<never>(() => undefined));
    render(<CalendarHarness definition={createDefinition({ queryFn })} />);

    await waitFor(() => expect(screen.getByText('جارٍ تحميل البيانات...')).toBeInTheDocument());
    expect(queryFn).toHaveBeenCalledOnce();
  });

  it('renders the shared blocking error state when the Resource query fails', async () => {
    const queryFn = vi.fn(async () => {
      throw new Error('calendar query failed');
    });
    render(<CalendarHarness definition={createDefinition({ queryFn })} />);

    await waitFor(() => expect(
      screen.getByText('تعذر تحميل Calendar test. حاول مرة أخرى.'),
    ).toBeInTheDocument());
    expect(queryFn).toHaveBeenCalledOnce();
  });

  it('keeps loaded events visible while showing a partial error', async () => {
    const queryFn = vi.fn()
      .mockResolvedValueOnce({ rows, count: rows.length })
      .mockRejectedValueOnce(new Error('calendar refresh failed'));

    function RetryAfterLoad() {
      const { dataView } = useResource<CalendarRow>();
      const retried = React.useRef(false);
      React.useEffect(() => {
        if (!dataView.data.length || retried.current) return;
        retried.current = true;
        dataView.onRetry();
      }, [dataView]);
      return null;
    }

    render(
      <CalendarHarness definition={createDefinition({ queryFn })}>
        <RetryAfterLoad />
        <ResourceDataView />
      </CalendarHarness>,
    );

    await waitFor(() => expect(
      screen.getByText('تعذر إكمال العملية. حاول مرة أخرى.'),
    ).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'event-A' })).toBeInTheDocument();
    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it('renders the shared empty state for an empty loaded dataset', async () => {
    const queryFn = vi.fn(async () => ({ rows: [], count: 0 }));
    render(<CalendarHarness definition={createDefinition({ queryFn, loadedRows: [], count: 0 })} />);

    await waitFor(() => expect(screen.getByText('لا توجد نتائج')).toBeInTheDocument());
    expect(queryFn).toHaveBeenCalledOnce();
  });

  it('notifies range changes without changing Resource state or issuing another query', async () => {
    const onRangeChange = vi.fn();
    const queryFn = vi.fn(async () => ({ rows, count: rows.length }));
    function StateObserver() {
      const { dataView } = useResource<CalendarRow>();
      return (
        <output data-testid="calendar-state">
          {JSON.stringify({
            search: dataView.state.search,
            filters: dataView.state.filters,
            pagination: dataView.state.pagination,
          })}
        </output>
      );
    }

    render(
      <CalendarHarness definition={createDefinition({ queryFn, onRangeChange })}>
        <ResourceDataView />
        <StateObserver />
      </CalendarHarness>,
    );

    await waitFor(() => expect(screen.getByTestId('mock-calendar-range')).toBeInTheDocument());
    const stateBefore = screen.getByTestId('calendar-state').textContent;
    fireEvent.click(screen.getByTestId('mock-calendar-range'));

    expect(onRangeChange).toHaveBeenCalledWith({
      start: new Date('2026-02-01T00:00:00.000Z'),
      end: new Date('2026-03-01T00:00:00.000Z'),
    });
    expect(screen.getByTestId('calendar-state').textContent).toBe(stateBefore);
    expect(queryFn).toHaveBeenCalledOnce();
  });
});
