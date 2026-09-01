'use client';

import * as React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import interactionPlugin from '@fullcalendar/react/interaction';
import listPlugin from '@fullcalendar/react/list';
import timeGridPlugin from '@fullcalendar/react/timegrid';
import arabicLocale from '@fullcalendar/react/locales/ar';
import { useResource } from '@alrehla/admin-core/resource';
import type {
  DataViewCalendarEvent,
  DataViewCalendarMode,
  DataViewCalendarRange,
} from '@alrehla/admin-core/data-view';
import { EmptyState } from '../layout/empty-state';
import { ResourceErrorState } from '../resource/resource-error-state';
import type { DataViewRendererProps } from './registry';

const viewNames: Record<DataViewCalendarMode, string> = {
  month: 'dayGridMonth',
  week: 'timeGridWeek',
  day: 'timeGridDay',
  agenda: 'listWeek',
};

function getEnvironmentDefaults() {
  if (typeof document === 'undefined') return { locale: 'en' as const, direction: 'ltr' as const };
  const locale = document.documentElement.lang.toLowerCase().startsWith('ar') ? 'ar' as const : 'en' as const;
  const direction = document.documentElement.dir === 'rtl' || locale === 'ar' ? 'rtl' as const : 'ltr' as const;
  return { locale, direction };
}

/** Calendar v1 presents the loaded Resource dataset, not the Table's visible page. */
export function CalendarView<TData = unknown>({
  dataView,
  emptyState,
}: DataViewRendererProps<TData>) {
  const { definition } = useResource<TData>();
  const calendar = definition.dataView.calendar;
  const environment = React.useMemo(getEnvironmentDefaults, []);
  const mappedEvents = React.useMemo(() => {
    if (!calendar) return { events: [], records: new Map<string, { event: DataViewCalendarEvent; record: TData }>() };
    const records = new Map<string, { event: DataViewCalendarEvent; record: TData }>();
    const events = dataView.data.map((record) => {
      const event = calendar.getEvent(record);
      records.set(event.id, { event, record });
      return event;
    });
    return { events, records };
  }, [calendar, dataView.data]);

  if (dataView.errorState && dataView.data.length === 0) {
    return (
      <div className="rounded-xl border p-6">
        <ResourceErrorState
          message={dataView.errorState.description || dataView.errorState.error.message}
          onRetry={dataView.errorState.retryable ? dataView.onRetry : undefined}
        />
      </div>
    );
  }
  if (dataView.loading && dataView.data.length === 0) {
    return <div className="rounded-xl border p-10 text-center text-muted-foreground">جارٍ تحميل البيانات...</div>;
  }
  if (!calendar) {
    return <EmptyState title="إعداد التقويم غير متاح" className="border" />;
  }
  if (dataView.data.length === 0) {
    return emptyState ?? <EmptyState title={dataView.emptyTitle ?? 'لا توجد نتائج'} description={dataView.emptyDescription} className="border" />;
  }

  const locale = calendar.locale ?? environment.locale;
  const direction = calendar.direction ?? environment.direction;
  const initialMode = calendar.initialMode ?? 'month';
  return (
    <div data-testid="calendar-view" className="alrehla-calendar min-w-0 overflow-hidden rounded-xl border bg-background p-2 shadow-sm" dir={direction}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView={viewNames[initialMode]}
        events={mappedEvents.events}
        locale={locale === 'ar' ? arabicLocale : undefined}
        direction={direction}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
        }}
        height="auto"
        eventClick={(info) => {
          const mapped = mappedEvents.records.get(info.event.id);
          if (mapped) calendar.onEventClick?.(mapped.event, mapped.record);
        }}
        dateClick={(info) => calendar.onDateClick?.(info.date)}
        datesSet={(info) => {
          const range: DataViewCalendarRange = { start: info.start, end: info.end };
          calendar.onRangeChange?.(range);
        }}
      />
      {dataView.partialErrorState ? (
        <div className="border-t bg-amber-50 px-4 py-2 text-sm text-amber-900" role="status">
          {dataView.partialErrorState.description || dataView.partialErrorState.error.message}
          {dataView.partialErrorState.retryable ? (
            <button type="button" className="ms-2 underline" onClick={dataView.onRetry}>إعادة المحاولة</button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
