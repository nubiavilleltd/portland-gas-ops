type SafetyProcessFormSkeletonProps = {
  sections?: number;
};

export default function SafetyProcessFormSkeleton({
  sections = 4,
}: SafetyProcessFormSkeletonProps) {
  return (
    <div className="mx-auto w-full space-y-5 animate-pulse">
      {Array.from({ length: sections }).map((_, sectionIndex) => (
        <section
          key={sectionIndex}
          className="overflow-hidden rounded-2xl border border-brand-border bg-white"
        >
          <div className="border-b border-brand-border bg-gray-50 px-5 py-4 md:px-6">
            <div className="h-4 w-44 rounded bg-gray-200" />
            <div className="mt-2 h-3 w-2/3 rounded bg-gray-100" />
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2 md:p-6">
            {Array.from({ length: sectionIndex === 0 ? 4 : 6 }).map((__, fieldIndex) => (
              <div
                key={fieldIndex}
                className={fieldIndex === 0 && sectionIndex > 1 ? "md:col-span-2" : ""}
              >
                <div className="mb-2 h-3 w-32 rounded bg-gray-200" />
                <div className="h-11 rounded-xl bg-gray-100" />
              </div>
            ))}
          </div>
        </section>
      ))}
      <div className="flex gap-3 pt-1">
        <div className="h-10 w-32 rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}
