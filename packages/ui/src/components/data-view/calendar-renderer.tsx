import * as React from 'react';

export const CalendarRenderer = React.lazy(async () => {
  const module = await import('./calendar-view');
  return { default: module.CalendarView };
});
