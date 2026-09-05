"use client";

import { createFormHook } from "@tanstack/react-form";
import { fieldContext, formContext } from "./context";

import { FormInput } from "./fields/form-input";
import { FormTextarea } from "./fields/form-textarea";
import { FormNumber } from "./fields/form-number";
import { FormSelect } from "./fields/form-select";
import { FormCombobox } from "./fields/form-combobox";
import { FormCheckbox } from "./fields/form-checkbox";
import { FormCheckboxGroup } from "./fields/form-checkbox-group";
import { FormStringList } from "./fields/form-string-list";
import { FormSwitch } from "./fields/form-switch";
import { FormRadioGroup } from "./fields/form-radio-group";
import { FormDate } from "./fields/form-date";
import { FormDateTime } from "./fields/form-date-time";
import { FormDateRange } from "./fields/form-date-range";
import { FormColor } from "./fields/form-color";
import { FormTags } from "./fields/form-tags";
import { FormRichText } from "./fields/form-rich-text";
import { FormSlug } from "./fields/form-slug";
import { FormLink } from "./fields/form-link";
import { FormParentPicker } from "./fields/form-parent-picker";
import { FormOrder, FormRank } from "./fields/form-order";
import { FormImageUpload } from "./fields/form-image-upload";
import { FormMultiImageUpload } from "./fields/form-multi-image-upload";
import { FormFileUpload } from "./fields/form-file-upload";
import { FormTranslation } from "./fields/form-translation";
import { FormMetadata } from "./fields/form-metadata";

import { SubmitButton } from "./components/submit-button";
import { ResetButton } from "./components/reset-button";
import { FormActions } from "./components/form-actions";
import { FormErrorSummary } from "./components/form-error-summary";
import { UnsavedChangesIndicator } from "./components/unsaved-changes-indicator";

/**
 * The base form hook contains only generic controls. Domain packages extend
 * this hook from the application composition root.
 */
export const adminFormHooks = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    Input: FormInput,
    Textarea: FormTextarea,
    Number: FormNumber,
    Order: FormOrder,
    Rank: FormRank,
    Select: FormSelect,
    Combobox: FormCombobox,
    Checkbox: FormCheckbox,
    CheckboxGroup: FormCheckboxGroup,
    StringList: FormStringList,
    Switch: FormSwitch,
    RadioGroup: FormRadioGroup,
    Date: FormDate,
    DateTime: FormDateTime,
    DateRange: FormDateRange,
    Color: FormColor,
    Tags: FormTags,
    RichText: FormRichText,
    Slug: FormSlug,
    Link: FormLink,
    ParentPicker: FormParentPicker,
    ImageUpload: FormImageUpload,
    MultiImageUpload: FormMultiImageUpload,
    FileUpload: FormFileUpload,
    Translation: FormTranslation,
    Metadata: FormMetadata,
  },
  formComponents: {
    SubmitButton,
    ResetButton,
    FormActions,
    FormErrorSummary,
    UnsavedChangesIndicator,
  },
});

export const { useAppForm, withForm, withFieldGroup } = adminFormHooks;
export type AdminFormHooks = typeof adminFormHooks;
