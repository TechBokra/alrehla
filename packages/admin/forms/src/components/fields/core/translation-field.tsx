"use client";

import * as React from "react";
import { cn } from "@eng-mohamedelsayed/admin-ui/lib/utils";
import { Input } from "@eng-mohamedelsayed/admin-ui/components/ui/input";
import { Textarea } from "@eng-mohamedelsayed/admin-ui/components/ui/textarea";
import { RichTextField } from "./rich-text-field";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@eng-mohamedelsayed/admin-ui/components/ui/tabs";
import { FieldLabel, FieldDescription } from "@eng-mohamedelsayed/admin-ui/components/ui/field";
import { Globe } from "lucide-react";

export interface LanguageOption {
  code: string;
  label: string;
  dir?: "ltr" | "rtl" | undefined;
}

export type TranslationValue = Record<string, string>;

export interface TranslationFieldProps {
  id?: string | undefined;
  label?: string | undefined;
  description?: string | undefined;
  languages?: LanguageOption[] | undefined;
  type?: "input" | "textarea" | "richText" | undefined;
  value?: TranslationValue | undefined;
  onChange?: ((val: TranslationValue) => void) | undefined;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  className?: string | undefined;
}

const DEFAULT_LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
];

export function TranslationField({
  id,
  label,
  description,
  languages = DEFAULT_LANGUAGES,
  type = "input",
  value = {},
  onChange,
  placeholder,
  disabled,
  readOnly,
  className,
}: TranslationFieldProps) {
  const [activeLang, setActiveLang] = React.useState(languages[0]?.code || "en");

  const handleChange = (code: string, text: string) => {
    if (disabled || readOnly) return;
    onChange?.({
      ...value,
      [code]: text,
    });
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <FieldLabel htmlFor={id} className="flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          {label}
        </FieldLabel>
      )}

      <Tabs value={activeLang} onValueChange={setActiveLang} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[200px] h-8">
          {languages.map((lang) => (
            <TabsTrigger key={lang.code} value={lang.code} className="text-xs h-7">
              {lang.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {languages.map((lang) => {
          const currentVal = value[lang.code] || "";
          const langDir = lang.dir || (lang.code === "ar" ? "rtl" : "ltr");

          return (
            <TabsContent key={lang.code} value={lang.code} className="mt-2 space-y-1">
              {type === "input" && (
                <Input
                  id={id ? `${id}-${lang.code}` : undefined}
                  dir={langDir}
                  value={currentVal}
                  placeholder={placeholder || `Enter ${lang.label}...`}
                  onChange={(e) => handleChange(lang.code, e.target.value)}
                  disabled={disabled}
                  readOnly={readOnly}
                />
              )}
              {type === "textarea" && (
                <Textarea
                  id={id ? `${id}-${lang.code}` : undefined}
                  dir={langDir}
                  value={currentVal}
                  placeholder={placeholder || `Enter ${lang.label}...`}
                  onChange={(e) => handleChange(lang.code, e.target.value)}
                  disabled={disabled}
                  readOnly={readOnly}
                  rows={3}
                />
              )}
              {type === "richText" && (
                <RichTextField
                  value={currentVal}
                  onChange={(val) => handleChange(lang.code, val)}
                  placeholder={placeholder || `Enter ${lang.label}...`}
                  disabled={disabled}
                  readOnly={readOnly}
                />
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {description && <FieldDescription>{description}</FieldDescription>}
    </div>
  );
}
