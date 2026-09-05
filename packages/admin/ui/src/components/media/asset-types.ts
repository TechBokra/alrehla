export interface UploadedAsset {
  id?: string | undefined;
  url: string;
  fileName?: string | undefined;
  mimeType?: string | undefined;
  size?: number | undefined;
  file?: File | undefined;
}

export interface ImageAsset extends UploadedAsset {
  width?: number | undefined;
  height?: number | undefined;
  altText?: string | undefined;
  isPrimary?: boolean | undefined;
  sortOrder?: number | undefined;
}
