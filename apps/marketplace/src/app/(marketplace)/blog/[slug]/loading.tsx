export default function Loading() {
  return (
    <div
      className="bg-white py-16 sm:py-20"
      role="status"
      aria-live="polite"
      aria-label="جاري تحميل المقال"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 h-5 w-32 animate-pulse rounded bg-gray-200" />
          <div className="mb-4 h-12 w-5/6 animate-pulse rounded bg-gray-200" />
          <div className="mb-8 h-5 w-1/3 animate-pulse rounded bg-gray-200" />
          <div className="mb-10 h-64 w-full animate-pulse rounded-2xl bg-gray-200 md:h-96" />
          <div className="space-y-4">
            <div className="h-5 w-full animate-pulse rounded bg-gray-200" />
            <div className="h-5 w-full animate-pulse rounded bg-gray-200" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
