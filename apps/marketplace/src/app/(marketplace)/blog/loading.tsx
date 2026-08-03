const BlogCardSkeleton = () => (
  <div className="overflow-hidden rounded-xl bg-white shadow-sm">
    <div className="h-48 animate-pulse bg-gray-200" />
    <div className="space-y-4 p-6">
      <div className="h-6 w-4/5 animate-pulse rounded bg-gray-200" />
      <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
    </div>
  </div>
);

export default function Loading() {
  return (
    <div
      className="bg-gray-50 py-16 sm:py-20"
      role="status"
      aria-live="polite"
      aria-label="جاري تحميل مقالات المدونة"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <div className="mx-auto mb-4 h-12 w-1/3 animate-pulse rounded bg-gray-200" />
          <div className="mx-auto h-6 w-1/2 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <BlogCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
