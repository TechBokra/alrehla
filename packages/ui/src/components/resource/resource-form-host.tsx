'use client';

import { useResource } from '@alrehla/admin-core/resource';

export function ResourceFormHost() {
  const { definition, formState, closeForm, actions, pending } = useResource<unknown, unknown, unknown>();
  if (formState.mode === 'closed') return null;
  const form = definition.forms?.[formState.mode];
  if (!form || form.mode === 'page' || !form.component) return null;
  const Component = form.component;
  const record = formState.mode === 'update' ? formState.record : undefined;
  const title = typeof form.title === 'function' ? form.title({ mode: formState.mode, record }) : form.title ?? `${formState.mode === 'create' ? 'إضافة' : 'تعديل'} ${definition.metadata.singularLabel}`;
  return <Component mode={formState.mode} record={record} open title={title} onOpenChange={(open) => { if (!open) closeForm(); }} onClose={closeForm} onSubmit={(values) => (formState.mode === 'create' ? actions.create(values) : actions.update(record, values)).then(closeForm)} isPending={formState.mode === 'create' ? pending.create : pending.update} />;
}
