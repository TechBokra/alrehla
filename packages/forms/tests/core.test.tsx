import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  CoreForm,
  CoreFormError,
  FormSubmitButton,
  FormResetButton,
  FormSubmitState,
  useCoreForm,
  zodFormOptions,
  type CoreFormOptions,
} from '../src';

type Values = { name: string };

function TestForm({ options, pending = false }: { options?: Partial<CoreFormOptions<Values>>; pending?: boolean }) {
  const form = useCoreForm<Values>({
    defaultValues: { name: '' },
    onSubmit: async () => undefined,
    ...(options ?? {}),
  });

  return (
    <CoreForm form={form} pending={pending}>
      <form.AppField name="name">
        {(field) => <field.TextField label="Name" description="Your display name" required />}
      </form.AppField>
      <FormSubmitState form={form} pending={pending}>{(state) => <output data-testid="state">{state.status}:{String(state.isPending)}</output>}</FormSubmitState>
      <FormSubmitButton pending={pending} pendingText="Saving...">Save</FormSubmitButton>
      <CoreFormError form={form} />
    </CoreForm>
  );
}

function SyncedForm({ name }: { name: string }) {
  const form = useCoreForm<Values>({
    defaultValues: { name },
    onSubmit: async () => undefined,
    syncInitialValues: true,
  });

  return (
    <CoreForm form={form}>
      <form.AppField name="name">
        {(field) => <field.TextField label="Name" />}
      </form.AppField>
    </CoreForm>
  );
}

describe('CoreForm lifecycle', () => {
  afterEach(() => cleanup());

  it('submits valid values through the existing AppField registry', async () => {
    const onSubmit = vi.fn();
    render(<TestForm options={{ onSubmit }} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Alrehla' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: 'Alrehla' }));
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'name-description');
  });

  it('reports invalid submits without invoking the mutation callback', async () => {
    const onSubmit = vi.fn();
    const onSubmitInvalid = vi.fn();
    render(<TestForm options={{ onSubmit, onSubmitInvalid, validators: { onSubmit: ({ value }) => value.name ? undefined : 'Name is required' } }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSubmitInvalid).toHaveBeenCalled());
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    expect(screen.getByTestId('state')).toHaveTextContent('invalid:false');
  });

  it('runs the shared Zod schema adapter through CoreForm validation', async () => {
    const onSubmit = vi.fn();
    const onSubmitInvalid = vi.fn();
    const schema = z.object({ name: z.string().min(3, 'Use at least three characters') });
    render(<TestForm options={{ ...zodFormOptions(schema), onSubmit, onSubmitInvalid }} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSubmitInvalid).toHaveBeenCalled());
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
  });

  it('prevents submit while an external mutation is pending', () => {
    const onSubmit = vi.fn();
    render(<TestForm options={{ onSubmit }} pending />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Blocked' } });
    fireEvent.click(screen.getByRole('button', { name: 'Saving...' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId('state')).toHaveTextContent('pending:true');
  });

  it('resets configured create forms after success', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<TestForm options={{ onSubmit, resetOnSuccess: true }} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Created' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(input).toHaveValue(''));
    expect(screen.getByTestId('state')).toHaveTextContent('success:false');
  });

  it('exposes an error lifecycle state and callback when submission fails', async () => {
    const onSubmitError = vi.fn();
    render(<TestForm options={{
      onSubmit: vi.fn().mockRejectedValue(new Error('Save failed')),
      onSubmitError,
    }} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Broken' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSubmitError).toHaveBeenCalled());
    expect(screen.getByTestId('state')).toHaveTextContent('error:false');
  });

  it('synchronizes pristine async initial values but preserves dirty edits', async () => {
    const { rerender } = render(<SyncedForm name="First record" />);
    expect(screen.getByRole('textbox')).toHaveValue('First record');
    rerender(<SyncedForm name="Loaded record" />);
    await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue('Loaded record'));

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Local edit' } });
    rerender(<SyncedForm name="Remote update" />);
    expect(screen.getByRole('textbox')).toHaveValue('Local edit');
  });

  it('exposes a headless reset action through the canonical form engine', () => {
    function ResettableForm() {
      const form = useCoreForm<Values>({ defaultValues: { name: 'Initial' }, onSubmit: async () => undefined });
      return (
        <CoreForm form={form}>
          <form.AppField name="name">{(field) => <field.TextField label="Name" />}</form.AppField>
          <FormResetButton>Reset form</FormResetButton>
        </CoreForm>
      );
    }

    render(<ResettableForm />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Edited' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset form' }));
    expect(input).toHaveValue('Initial');
  });
});
