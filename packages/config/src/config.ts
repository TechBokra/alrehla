declare const process: { env?: Record<string, string | undefined> } | undefined;

const getPublicEnv = (nextKey: string): string | undefined => {
  if (typeof process === "undefined") return undefined;

  switch (nextKey) {
    case "NEXT_PUBLIC_SUPABASE_URL":
      return process.env.NEXT_PUBLIC_SUPABASE_URL;
    case "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY":
      return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    case "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME":
      return process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    case "NEXT_PUBLIC_CLOUDINARY_API_KEY":
      return process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    case "NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET":
      return process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    default:
      return undefined;
  }
};

export const DEFAULT_CONFIG = {
  supabase: {
    projectName: "Alrehla",
    projectId: "mqsmgtparbdpvnbyxokh",
    projectUrl: getPublicEnv("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: getPublicEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  },
  cloudinary: {
    cloudName: getPublicEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"),
    apiKey: getPublicEnv("NEXT_PUBLIC_CLOUDINARY_API_KEY"),
    uploadPreset: getPublicEnv("NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET"),
  },
  storage: {
    bucketName: "receipts",
    allowedMimeTypes: [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "application/pdf",
    ],
  },
  vercel: {
    environment: "production",
  },
};
