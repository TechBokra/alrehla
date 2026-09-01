import * as React from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

export function UnsavedChangesAlert({ children = 'You have unsaved changes.', className }: { children?: React.ReactNode; className?: string }) { return <Alert className={className}><AlertTitle>Unsaved changes</AlertTitle><AlertDescription>{children}</AlertDescription></Alert>; }
export interface UnsavedChangesDialogProps { open: boolean; onOpenChange: (open: boolean) => void; onKeepEditing: () => void; onDiscard: () => void; title?: React.ReactNode; description?: React.ReactNode; }
export function UnsavedChangesDialog({ open, onOpenChange, onKeepEditing, onDiscard, title = 'Discard unsaved changes?', description = 'Your changes will be lost.' }: UnsavedChangesDialogProps) { return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader><DialogFooter><Button type="button" variant="outline" onClick={onKeepEditing}>Keep editing</Button><Button type="button" variant="destructive" onClick={onDiscard}>Discard changes</Button></DialogFooter></DialogContent></Dialog>; }
export function DiscardChangesAction({ onDiscard, children = 'Discard changes' }: { onDiscard: () => void; children?: React.ReactNode }) { return <Button type="button" variant="destructive" onClick={onDiscard}>{children}</Button>; }
