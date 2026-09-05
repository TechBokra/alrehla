import { useState } from "react";
import type { ChangeEvent } from "react";
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from "@eng-mohamedelsayed/admin-ui/components/ui/input-group";
import { Eye, EyeOff, Copy, Check, RefreshCw } from "lucide-react";
import { cn } from "@eng-mohamedelsayed/admin-ui/lib/utils";

export interface SecretFieldProps {
  id?: string | undefined;
  value?: string | undefined;
  onChange?: ((val: string) => void) | undefined;
  onBlur?: (() => void) | undefined;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  className?: string | undefined;
  onRegenerate?: (() => void) | undefined;
}

export function SecretField({
  id,
  value,
  onChange,
  onBlur,
  placeholder = "sk_live_...",
  disabled,
  readOnly,
  className,
  onRegenerate,
}: SecretFieldProps) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <InputGroup className={cn("w-full ltr-input", className)} dir="ltr">
      <InputGroupInput
        id={id}
        type={show ? "text" : "password"}
        value={value ?? ""}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        className="font-mono pe-20"
      />
      <InputGroupAddon align="inline-end" className="flex items-center space-x-1">
        <InputGroupButton
          type="button"
          onClick={() => setShow(!show)}
          title={show ? "Hide Secret" : "Show Secret"}
        >
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </InputGroupButton>
        {value && (
          <InputGroupButton
            type="button"
            onClick={() => copyToClipboard(value)}
            title="Copy Secret"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          </InputGroupButton>
        )}
        {onRegenerate && !disabled && !readOnly && (
          <InputGroupButton
            type="button"
            onClick={onRegenerate}
            title="Regenerate Key"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </InputGroupButton>
        )}
      </InputGroupAddon>
    </InputGroup>
  );
}
