import { CalendarDays, Table2 } from 'lucide-react';
import { ResourceTableView } from '../resource/resource-table-view';
import { CalendarRenderer } from './calendar-renderer';
import { createDataViewRegistry, type DataViewRendererDefinition } from './registry';

const tableRenderer = ResourceTableView as DataViewRendererDefinition['renderer'];
const calendarRenderer = CalendarRenderer as DataViewRendererDefinition['renderer'];

export const defaultDataViewRegistry = createDataViewRegistry({
  table: {
    id: 'table',
    renderer: tableRenderer,
    label: 'جدول',
    icon: Table2,
    capabilities: {
      pagination: true,
      columns: true,
      density: true,
      selection: true,
      sorting: true,
    },
  },
  calendar: {
    id: 'calendar',
    renderer: calendarRenderer,
    label: 'تقويم',
    icon: CalendarDays,
    capabilities: {
      pagination: false,
      columns: false,
      density: false,
      selection: false,
      sorting: false,
    },
  },
});
