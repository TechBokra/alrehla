"use client";

import React, { type ComponentProps } from "react";
import { CldImage } from "next-cloudinary";

import { cn } from "../../lib/utils";

type CldImageProps = ComponentProps<typeof CldImage>;

export type AlhrelaImageProps = Omit<
  CldImageProps,
  "src" | "alt"
> & {
  publicId: string;
  alt: string;
};

export function AlhrelaImage({
  publicId,
  alt,
  className,
  sizes = "(max-width: 768px) 100vw, 50vw",
  crop = "fill",
  ...props
}: AlhrelaImageProps) {
  return (
    <CldImage
      src={publicId}
      alt={alt}
      crop={crop}
      sizes={sizes}
      className={cn("object-cover", className)}
      {...props}
    />
  );
}
