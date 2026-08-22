"use client";

import { createFormHook } from '@tanstack/react-form';
import {
  CheckboxField,
  DateField,
  NumberField,
  SelectField,
  SwitchField,
  TextareaField,
  TextField,
  TimeField,
} from '../adapters/fields';
import { fieldContext, formContext } from './contexts';

export const { useAppForm } = createFormHook({
  fieldComponents: {
    CheckboxField,
    DateField,
    NumberField,
    SelectField,
    SwitchField,
    TextareaField,
    TextField,
    TimeField,
  },
  fieldContext,
  formComponents: {},
  formContext,
});
