"use client";

import * as React from "react";
import { cn } from "@eng-mohamedelsayed/admin-ui/lib/utils";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "@eng-mohamedelsayed/admin-ui/components/ui/input-group";
import { ExternalLink, Copy, Check, Link as LinkIcon } from "lucide-react";

export interface LinkFieldProps {
  id?: string | undefined;
  value?: string | undefined;
  onChange?: ((val: string) => void) | undefined;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  className?: string | undefined;
}

export function LinkField({
  id,
  value = "",
  onChange,
  placeholder = "https://example.com",
  disabled,
  readOnly,
  className,
}: LinkFieldProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpen = () => {
    if (!value) return;
    const url = value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <InputGroup className={cn("w-full ltr-input", className)} dir="ltr">
      <InputGroupAddon align="inline-start">
        <LinkIcon className="h-3.5 w-3.5 text-muted-foreground ml-2" />
      </InputGroupAddon>

      <InputGroupInput
        id={id}
        type="url"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
      />

      <InputGroupAddon align="inline-end" className="flex items-center space-x-1">
        <InputGroupButton
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={handleOpen}
          disabled={!value}
          title="Open URL in new tab"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </InputGroupButton>

        <InputGroupButton
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={handleCopy}
          disabled={!value}
          title="Copy URL"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
