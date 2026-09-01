import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  FormDialog,
  FormPage,
  FormSection,
  FormSheet,
  FormWizard,
  FormWizardDialog,
  UnsavedChangesAlert,
  UnsavedChangesDialog,
} from '../src/components/forms';

describe('form presentation', () => {
  afterEach(() => cleanup());

  it('renders a controlled dialog and reports close events', () => {
    const onOpenChange = vi.fn();
    render(<FormDialog open title="Create record" onOpenChange={onOpenChange}><p>Form content</p></FormDialog>);
    expect(screen.getByRole('dialog', { name: 'Create record' })).toBeInTheDocument();
    expect(screen.getByText('Form content')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders sheet/page errors and layout sections', () => {
    render(<><FormSheet open title="Edit record" error="Save failed"><p>Sheet body</p></FormSheet><FormPage title="Edit page" error="Page failed"><FormSection title="Details"><p>Page body</p></FormSection></FormPage></>);
    expect(screen.getByRole('dialog', { name: 'Edit record' })).toBeInTheDocument();
    expect(screen.getByText('Save failed')).toBeInTheDocument();
    expect(screen.getByText('Page failed')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
  });

  it('supports controlled wizard progression and completion', async () => {
    const onStepChange = vi.fn();
    const onComplete = vi.fn();
    render(<FormWizard activeStep={0} onStepChange={onStepChange} onComplete={onComplete} steps={[{ id: 'one', title: 'One', content: <p>One content</p> }, { id: 'two', title: 'Two', content: <p>Two content</p> }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(onStepChange).toHaveBeenCalledWith(1));
  });

  it('renders wizard dialog step metadata and submit action', () => {
    const onSubmit = vi.fn();
    render(<FormWizardDialog open onOpenChange={vi.fn()} title="Wizard" activeStep="one" onStepChange={vi.fn()} onSubmit={onSubmit} steps={[{ id: 'one', label: 'One', errorCount: 2 }, { id: 'two', label: 'Two' }]}><p>Current step</p></FormWizardDialog>);
    expect(screen.getByRole('tab', { name: 'One (2)' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('keeps discard decisions outside the presentation component', () => {
    const onDiscard = vi.fn();
    render(<><UnsavedChangesAlert /><UnsavedChangesDialog open onOpenChange={vi.fn()} onKeepEditing={vi.fn()} onDiscard={onDiscard} /></>);
    expect(screen.getByText('You have unsaved changes.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }));
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });
});
