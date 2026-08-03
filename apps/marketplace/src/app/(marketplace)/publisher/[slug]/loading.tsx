export default function Loading() {
  return (
    <div
      className="min-h-screen bg-gray-50/50"
      role="status"
      aria-live="polite"
      aria-label="جاري تحميل صفحة دار النشر"
    >
      <div className="h-64 w-full animate-pulse bg-gray-200 md:h-80" />
      <div className="container relative z-10 mx-auto -mt-20 mb-12 px-4">
        <div className="flex flex-col gap-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-xl md:flex-row md:items-end md:p-8">
          <div className="-mt-16 h-32 w-32 animate-pulse rounded-2xl bg-gray-200 md:-mt-20 md:h-40 md:w-40" />
          <div className="flex-1 space-y-4">
            <div className="h-9 w-64 animate-pulse rounded bg-gray-200" />
            <div className="h-5 w-44 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-full max-w-3xl animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 h-8 w-52 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-80 animate-pulse rounded-xl bg-gray-200"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
