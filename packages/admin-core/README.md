# `@alrehla/admin-core`

Shared admin application primitives for the Alrehla workspace.

The package owns backend-agnostic resource metadata, DataView state, query/mutation coordination, permission-aware resource access, and adapters for the existing mutation core. Domain operations remain in `@alrehla/api` and server actions so Clerk and Supabase credentials do not cross into reusable client code. Feature forms continue to use `@alrehla/forms` directly.

```tsx
import {
  adminQueryKeys,
  useAdminMutation,
} from '@alrehla/admin-core';

const updateProduct = useAdminMutation({
  resource: 'products',
  mutationFn: saveProduct,
  invalidate: [adminQueryKeys.personalizedProducts()],
});
```

Use `@alrehla/admin-core/resource` for resource definitions and runtime coordination, `@alrehla/admin-core/data-view` for reusable list state, and `@alrehla/forms` for feature form schemas and fields.

DataView query state is projected through `selectDataViewQueryState()` before it reaches Resource query definitions. Presentation state such as the selected renderer, column visibility, density, and expanded rows does not change Resource query identity or backend query parameters. Calendar contracts in Core are renderer-neutral: the UI CalendarView presents the currently loaded Resource dataset, not the Table's visible page, and visible date ranges are notification-only until a later date-window query wave. Registry entries, FullCalendar, and Calendar CSS are UI-owned; applications opt into `@alrehla/ui/calendar.css` only when they adopt CalendarView.
