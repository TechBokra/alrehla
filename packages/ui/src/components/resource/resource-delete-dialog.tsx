'use client';

import { Trash2 } from 'lucide-react';
import { useResource } from '@alrehla/admin-core/resource';
import { Button } from '../ui/button';
import Modal from '../../Modal';

export function ResourceDeleteDialog<TData = unknown>() {
  const { definition, deleteRecord, closeDelete, actions, pending } = useResource<TData>();
  if (!deleteRecord) return null;

  const deleteDefinition = definition.mutations?.delete;
  const label = deleteDefinition?.getLabel?.(deleteRecord) ?? definition.metadata.singularLabel;

  return (
    <Modal
      isOpen
      onClose={closeDelete}
      title={`حذف ${definition.metadata.singularLabel}`}
      footer={<>
        <Button variant="ghost" onClick={closeDelete} disabled={pending.delete || pending.deleteMany}>إلغاء</Button>
        <Button
          variant="destructive"
          loading={pending.delete || pending.deleteMany}
          icon={<Trash2 size={16} />}
          onClick={async () => { try { await actions.delete(deleteRecord); closeDelete(); } catch { /* mutation feedback is handled by the shared mutation core. */ } }}
        >
          تأكيد الحذف
        </Button>
      </>}
    >
      <p className="text-sm text-muted-foreground">
        هل أنت متأكد من حذف {label}؟ لا يمكن التراجع عن هذا الإجراء.
      </p>
    </Modal>
  );
}
