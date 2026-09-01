"use client";

import { createFormHook } from '@tanstack/react-form';
import {
  CheckboxField,
  DateField,
  DateTimeField,
  EmailField,
  NumberField,
  PasswordField,
  PhoneField,
  RadioGroupField,
  SelectField,
  SwitchField,
  TextareaField,
  TextField,
  TimeField,
  UrlField,
} from '../adapters/fields';
import { fieldContext, formContext } from './contexts';

export const { useAppForm } = createFormHook({
  fieldComponents: {
    CheckboxField,
    DateField,
    DateTimeField,
    EmailField,
    NumberField,
    PasswordField,
    PhoneField,
    RadioGroupField,
    SelectField,
    SwitchField,
    TextareaField,
    TextField,
    TimeField,
    UrlField,
  },
  fieldContext,
  formComponents: {},
  formContext,
});
