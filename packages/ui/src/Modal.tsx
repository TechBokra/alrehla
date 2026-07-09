import * as React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './components/ui/dialog';
import { cn } from './lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
  '3xl': 'sm:max-w-3xl',
};

export default function Modal({ isOpen, onClose, title, children, footer, size = 'lg' }: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className={cn('max-h-[90vh] overflow-hidden p-0', sizeClasses[size])}>
        <DialogHeader className="border-b px-6 py-4 text-start">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto px-6 py-4">{children}</div>
        {footer && <DialogFooter className="border-t bg-muted/30 px-6 py-4">{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
