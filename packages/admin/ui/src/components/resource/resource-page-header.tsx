"use client";

import * as React from "react";
import {
  ResourcePageHeader as ResourcePageHeaderLayout,
  type ResourcePageHeaderProps as ResourcePageHeaderLayoutProps,
} from "../layouts/resource-page";
import { useResource } from "@eng-mohamedelsayed/admin-core/resource";

export interface ResourcePageHeaderProps
  extends Omit<ResourcePageHeaderLayoutProps, "title" | "description" | "icon"> {
  title?: string;
  description?: string;
  icon?: React.ElementType<{ className?: string }>;
}

export function ResourcePageHeader({
  title,
  description,
  icon,
  ...props
}: ResourcePageHeaderProps) {
  const { definition } = useResource();
  const metadata = definition.metadata;
  const resolvedIcon = icon ?? metadata.icon;

  return (
    <ResourcePageHeaderLayout
      {...props}
      title={title ?? metadata.label}
      {...(description ?? metadata.description
        ? { description: description ?? metadata.description }
        : {})}
      {...(resolvedIcon ? { icon: resolvedIcon } : {})}
    />
  );
}
