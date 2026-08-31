'use client';

import { Plus } from 'lucide-react';
import { useResource } from '@alrehla/admin-core/resource';
import { Button, type ButtonProps } from '../ui/button';

export function ResourceCreate({ label, ...props }: ButtonProps & { label?: string }) {
  const { capabilities, definition, openCreate } = useResource();
  if (!capabilities.create || !definition.forms?.create) return null;
  return <Button {...props} onClick={openCreate}><Plus className="me-2 h-4 w-4" />{label ?? `إضافة ${definition.metadata.singularLabel}`}</Button>;
}
