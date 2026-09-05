import { useState, useRef } from "react";
import type { ChangeEvent } from "react";
import { Button } from "@eng-mohamedelsayed/admin-ui/components/ui/button";
import type { UploadedAsset } from "@eng-mohamedelsayed/admin-ui/components/media";
import { FileText, UploadCloud, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@eng-mohamedelsayed/admin-ui/lib/utils";

export interface FileUploadFieldProps {
  id?: string | undefined;
  accept?: string | undefined;
  maxSizeBytes?: number | undefined;
  onUpload?: ((file: File) => Promise<UploadedAsset>) | undefined;
  value?: UploadedAsset | string | undefined;
  onChange?: ((val: UploadedAsset | string | undefined) => void) | undefined;
  onBlur?: (() => void) | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  className?: string | undefined;
}

export function FileUploadField({
  id,
  accept = ".pdf,.csv,.xlsx,.docx,.zip",
  maxSizeBytes = 10 * 1024 * 1024,
  onUpload,
  value,
  onChange,
  onBlur,
  disabled,
  readOnly,
  className,
}: FileUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (file.size > maxSizeBytes) {
      setLocalError(`File size exceeds ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB limit.`);
      return;
    }
    setLocalError(null);
    setUploading(true);

    try {
      if (onUpload) {
        const asset = await onUpload(file);
        onChange?.(asset);
      } else {
        const previewUrl = URL.createObjectURL(file);
        const asset: UploadedAsset = {
          id: `doc-${Date.now()}`,
          url: previewUrl,
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
        };
        onChange?.(asset);
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const asset = typeof value === "string" ? { url: value, fileName: value } : value;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="space-y-2 w-full">
      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        onBlur={onBlur}
        disabled={Boolean(disabled || readOnly || uploading)}
        className="hidden"
      />

      {asset?.url ? (
        <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
          <div className="flex items-center space-x-3 truncate">
            <div className="p-2 bg-muted rounded-md shrink-0">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="truncate space-y-0.5">
              <p className="text-xs font-medium truncate">{asset.fileName || "Uploaded document"}</p>
              {asset.size && (
                <p className="text-[10px] text-muted-foreground">
                  {(asset.size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1 shrink-0 ms-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => window.open(asset.url, "_blank")}
              title="View document"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            {!disabled && !readOnly && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onChange?.(undefined)}
                title="Remove document"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div
          onClick={() => !disabled && !readOnly && !uploading && fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-muted/30 hover:bg-muted/60",
            localError && "border-destructive",
            (disabled || readOnly) && "cursor-not-allowed opacity-60",
            className
          )}
        >
          {uploading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Uploading document...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <UploadCloud className="h-5 w-5 text-muted-foreground" />
              <div className="text-start">
                <p className="text-xs font-semibold">Upload document</p>
                <p className="text-[10px] text-muted-foreground">PDF, CSV, XLSX or ZIP (max 10MB)</p>
              </div>
            </div>
          )}
        </div>
      )}
      {localError && <p className="text-xs font-medium text-destructive mt-1">{localError}</p>}
    </div>
  );
}
