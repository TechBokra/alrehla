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
