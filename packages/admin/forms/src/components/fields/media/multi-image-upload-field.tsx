import { useState, useRef } from "react";
import type { ChangeEvent } from "react";
import { Button } from "@eng-mohamedelsayed/admin-ui/components/ui/button";
import { Badge } from "@eng-mohamedelsayed/admin-ui/components/ui/badge";
import type { ImageAsset } from "@eng-mohamedelsayed/admin-ui/components/media";
import { UploadCloud, Star, Trash2, Loader2 } from "lucide-react";
import { cn } from "@eng-mohamedelsayed/admin-ui/lib/utils";

export interface MultiImageUploadFieldProps {
  id?: string | undefined;
  maxFiles?: number | undefined;
  accept?: string | undefined;
  maxSizeBytes?: number | undefined;
  onUpload?: ((files: File[]) => Promise<ImageAsset[]>) | undefined;
  value?: ImageAsset[] | undefined;
  onChange?: ((val: ImageAsset[]) => void) | undefined;
  onBlur?: (() => void) | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  className?: string | undefined;
}

export function MultiImageUploadField({
  id,
  maxFiles = 10,
  accept = "image/png,image/jpeg,image/webp,image/gif",
  maxSizeBytes = 10 * 1024 * 1024,
  onUpload,
  value = [],
  onChange,
  onBlur,
  disabled,
  readOnly,
  className,
}: MultiImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: File[]) => {
    if (value.length + files.length > maxFiles) {
      setLocalError(`You can upload a maximum of ${maxFiles} images.`);
      return;
    }
    setLocalError(null);
    setUploading(true);

    try {
      let newAssets: ImageAsset[] = [];
      if (onUpload) {
        newAssets = await onUpload(files);
      } else {
        newAssets = files.map((file, idx) => ({
          id: `temp-${Date.now()}-${idx}`,
          url: URL.createObjectURL(file),
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
          file,
          sortOrder: value.length + idx,
          isPrimary: value.length === 0 && idx === 0,
        }));
      }

      const combined = [...value, ...newAssets];
      onChange?.(combined);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = (index: number) => {
    const updated = value.map((asset, i) => ({
      ...asset,
      isPrimary: i === index,
    }));
    onChange?.(updated);
  };

  const handleRemove = (index: number) => {
    const updated = value.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some((a) => a.isPrimary) && updated[0]) {
      updated[0].isPrimary = true;
    }
    onChange?.(updated);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) processFiles(files);
  };

  return (
    <div className={cn("space-y-3 w-full", className)}>
      <input
        ref={fileInputRef}
        id={id}
        type="file"
        multiple
        accept={accept}
        onChange={handleFileSelect}
        onBlur={onBlur}
        disabled={Boolean(disabled || readOnly || uploading)}
        className="hidden"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {value.map((asset, idx) => (
          <div
            key={asset.id || asset.url || idx}
            className="relative group rounded-lg border bg-muted aspect-square overflow-hidden shadow-xs"
          >
            <img src={asset.url} alt={asset.fileName || `Product image ${idx + 1}`} className="object-cover w-full h-full" />
            {asset.isPrimary && (
              <Badge className="absolute top-1.5 start-1.5 text-[10px] py-0 px-1.5 bg-primary text-primary-foreground">
                Primary
              </Badge>
            )}
            {!disabled && !readOnly && (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                {!asset.isPrimary && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleSetPrimary(idx)}
                    title="Set as Primary"
                  >
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleRemove(idx)}
                  title="Remove Image"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        ))}

        {value.length < maxFiles && !disabled && !readOnly && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "border-2 border-dashed rounded-lg aspect-square flex flex-col items-center justify-center text-center p-2 transition-colors bg-muted/30 hover:bg-muted/60 cursor-pointer",
              localError && "border-destructive"
            )}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <>
                <UploadCloud className="h-5 w-5 text-muted-foreground mb-1" />
                <span className="text-[11px] font-medium text-muted-foreground">Add Image</span>
              </>
            )}
          </button>
        )}
      </div>
      {localError && <p className="text-xs font-medium text-destructive mt-1">{localError}</p>}
    </div>
  );
}
