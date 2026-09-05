"use client";

import * as React from "react";
import { withFieldGroup } from "../hooks";
import { FieldSet, FieldLegend } from "@eng-mohamedelsayed/admin-ui/components/ui/field";

export interface SeoFieldsValue {
  slug: string;
  seo_title?: string | undefined;
  seo_description?: string | undefined;
  canonical_url?: string | undefined;
  indexable?: boolean | undefined;
}

export interface SeoFieldsOptions {
  prefix?: string | undefined;
  sourceValue?: string | undefined;
  initialSlug?: string | undefined;
  onCheckAvailability?:
    | ((slug: string) => Promise<boolean> | boolean)
    | undefined;
}

export const SeoFields = withFieldGroup<
  SeoFieldsValue,
  unknown,
  SeoFieldsOptions
>({
  render: ({
    group,
    prefix = "/products/",
    sourceValue,
    initialSlug,
    onCheckAvailability,
  }) => (
    <FieldSet className="space-y-4 rounded-lg border p-4 bg-card shadow-2xs">
      <FieldLegend>Search Engine Optimization (SEO)</FieldLegend>

      <div className="space-y-3">
        <group.AppField name="slug">
          {(field) => (
            <field.Slug
              label="URL Slug"
              prefix={prefix}
              sourceValue={sourceValue}
              initialSlug={initialSlug}
              onCheckAvailability={onCheckAvailability}
              required
            />
          )}
        </group.AppField>

        <group.AppField name="seo_title">
          {(field) => <field.Input label="SEO Title" placeholder="Custom page title for search engines" />}
        </group.AppField>

        <group.AppField name="seo_description">
          {(field) => <field.Textarea label="SEO Meta Description" rows={2} placeholder="Brief summary displayed in search snippets..." />}
        </group.AppField>

        <group.AppField name="canonical_url">
          {(field) => <field.Link label="Canonical URL" placeholder="https://example.com/products/original" />}
        </group.AppField>

        <group.AppField name="indexable">
          {(field) => <field.Switch label="Allow Search Engine Indexing" description="Include this page in sitemaps and search results" />}
        </group.AppField>
      </div>
    </FieldSet>
  ),
});
