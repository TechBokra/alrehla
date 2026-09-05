"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { Plus } from "lucide-react";
import { Button, type ButtonProps } from "../ui/button";
import { useResource } from "@eng-mohamedelsayed/admin-core/resource";
import { cn } from "./../../lib/utils";

export interface ResourceCreateProps extends Omit<
  ButtonProps,
  "children" | "onClick"
> {
  asChild?: boolean;
  children?: React.ReactElement;
  label?: string;
}

export function ResourceCreate({
  asChild = false,
  children,
  label,
  ...buttonProps
}: ResourceCreateProps) {
  const { definition, capabilities, openCreate } = useResource();
  const { forms, metadata } = definition;

  if (!capabilities.create || !forms?.create) return null;

  const onClick = () => openCreate();
  if (asChild) {
    if (!children) return null;
    return <Slot onClick={onClick}>{children}</Slot>;
  }

  const Icon = metadata.icon ?? Plus;
  return (
    <Button
      {...buttonProps}
      onClick={onClick}
      className={cn("h-7 text-xs", buttonProps.className)}
    >
      <Icon data-icon="inline-start" aria-hidden="true" />
      {label ?? `Create ${metadata.singularLabel}`}
    </Button>
  );
}
