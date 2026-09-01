import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CoreForm, FormSubmitButton, useCoreForm, type CoreFormOptions } from '../src';

type Values = { title: string };

interface ResourceFormMetadata<TValues> {
  mode: 'create' | 'update';
  initialValues: TValues;
  pending?: boolean;
  onSubmit: CoreFormOptions<TValues>['onSubmit'];
}

function ResourceFormAdapter({ metadata }: { metadata: ResourceFormMetadata<Values> }) {
  const form = useCoreForm({
    defaultValues: metadata.initialValues,
    onSubmit: metadata.onSubmit,
    resetOnSuccess: metadata.mode === 'create',
  });

  return (
    <CoreForm form={form} pending={metadata.pending}>
      <form.AppField name="title">
        {(field) => <field.TextField label="Title" required />}
      </form.AppField>
      <FormSubmitButton pending={metadata.pending} pendingText="Saving...">
        Save
      </FormSubmitButton>
    </CoreForm>
  );
}

describe('structural Resource → Form Core composition', () => {
  afterEach(() => cleanup());

  it('adapts resource metadata without making Forms depend on Admin Core', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ResourceFormAdapter metadata={{ mode: 'create', initialValues: { title: '' }, onSubmit }} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Reference form' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ title: 'Reference form' }));
  });
});
