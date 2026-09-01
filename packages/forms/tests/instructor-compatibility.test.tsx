import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  FormDialog,
  FormPage,
} from '@alrehla/ui/components/forms';
import {
  CoreForm,
  FormSubmitButton,
  useCoreForm,
} from '../src';

type InstructorAvailabilityValues = {
  availabilityNote: string;
};

function InstructorAvailabilityFixture({ onSubmit }: { onSubmit: (values: InstructorAvailabilityValues) => void | Promise<void> }) {
  const form = useCoreForm({
    defaultValues: { availabilityNote: '' },
    onSubmit,
  });

  return (
    <>
      <FormPage title="Instructor availability" description="Update availability details">
        <CoreForm form={form}>
          <form.AppField name="availabilityNote">
            {(field) => <field.TextField label="Availability note" required />}
          </form.AppField>
          <FormSubmitButton>Save availability</FormSubmitButton>
        </CoreForm>
      </FormPage>
      <FormDialog defaultOpen title="Preview availability">
        <p>Instructor-only preview</p>
      </FormDialog>
    </>
  );
}

describe('Instructor-style Form Core compatibility', () => {
  afterEach(() => cleanup());

  it('renders CoreForm and generic FormPage/FormDialog without Admin providers', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<InstructorAvailabilityFixture onSubmit={onSubmit} />);

    expect(screen.getByRole('dialog', { name: 'Preview availability' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.getByRole('heading', { name: 'Instructor availability' })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Available on Tuesdays' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save availability' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ availabilityNote: 'Available on Tuesdays' }));
  });
});
