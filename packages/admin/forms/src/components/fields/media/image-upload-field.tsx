import { useState, useRef } from "react";
import type { ChangeEvent, DragEvent, KeyboardEvent } from "react";
import { Button } from "@eng-mohamedelsayed/admin-ui/components/ui/button";
import type { ImageAsset } from "@eng-mohamedelsayed/admin-ui/components/media";
import { Image as ImageIcon, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@eng-mohamedelsayed/admin-ui/lib/utils";

export interface ImageUploadFieldProps {
  id?: string | undefined;
  aspectRatio?: string | undefined;
  accept?: string | undefined;
  maxSizeBytes?: number | undefined;
  onUpload?: ((file: File) => Promise<ImageAsset>) | undefined;
  value?: ImageAsset | string | undefined;
  onChange?: ((val: ImageAsset | string | undefined) => void) | undefined;
  onBlur?: (() => void) | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  className?: string | undefined;
}

export function ImageUploadField({
  id,
  aspectRatio = "1/1",
  accept = "image/png,image/jpeg,image/webp,image/gif",
  maxSizeBytes = 10 * 1024 * 1024,
  onUpload,
  value,
  onChange,
  onBlur,
  disabled,
  readOnly,
  className,
}: ImageUploadFieldProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (file.size > maxSizeBytes) {
      setLocalError(
        `File size exceeds ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB limit.`
      );
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
        const asset: ImageAsset = {
          id: `temp-${Date.now()}`,
          url: previewUrl,
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
          file,
        };
        onChange?.(asset);
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const imageUrl = typeof value === "string" ? value : value?.url;

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !readOnly) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || readOnly || uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const openFilePicker = () => {
    if (!disabled && !readOnly && !uploading) fileInputRef.current?.click();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openFilePicker();
    }
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

      {imageUrl ? (
        <div
          className="relative group rounded-lg border overflow-hidden bg-muted flex items-center justify-center"
          style={{ aspectRatio }}
        >
          <img
            src={imageUrl}
            alt="Uploaded preview"
            className="object-cover w-full h-full"
          />
          {!disabled && !readOnly && (
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <RefreshCw className="h-3.5 w-3.5 me-1" /> Replace
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onChange?.(undefined)}
                disabled={uploading}
              >
                <Trash2 className="h-3.5 w-3.5 me-1" /> Remove
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFilePicker}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={disabled || readOnly || uploading ? -1 : 0}
          aria-disabled={Boolean(disabled || readOnly || uploading)}
          style={{ aspectRatio }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-muted/20 p-6 text-center transition-colors hover:bg-muted/60",
            isDragging && "border-primary bg-primary/10",
            localError && "border-destructive",
            (disabled || readOnly) && "cursor-not-allowed opacity-60",
            className
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">
                Uploading image...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-background shadow-sm">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">
                  <span>Click to upload</span>
                  <span className="text-muted-foreground">
                    {" "}
                    or drag &amp; drop
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  JPEG, PNG, WebP, GIF — max{" "}
                  {Math.round(maxSizeBytes / (1024 * 1024))} MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      {localError && (
        <p className="text-xs font-medium text-destructive mt-1">
          {localError}
        </p>
      )}
    </div>
  );
}
