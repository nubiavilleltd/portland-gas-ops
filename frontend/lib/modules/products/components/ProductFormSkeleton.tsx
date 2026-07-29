"use client";

export default function ProductFormSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Page header */}
      <div className="space-y-2">
        <div className="h-8 w-56 rounded bg-gray-200" />
        <div className="h-4 w-96 rounded bg-gray-100" />
      </div>

      {/* Form card */}
      <div className="rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Section heading */}
        <div className="space-y-2">
          <div className="h-5 w-44 rounded bg-gray-200" />
          <div className="h-4 w-72 rounded bg-gray-100" />
        </div>

        {/* Form fields */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="h-10 rounded bg-gray-100" />
          </div>

          <div className="space-y-2">
            <div className="h-4 w-20 rounded bg-gray-200" />
            <div className="h-10 rounded bg-gray-100" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <div className="h-4 w-28 rounded bg-gray-200" />
            <div className="h-24 rounded bg-gray-100" />
          </div>

          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="h-10 rounded bg-gray-100" />
          </div>

          <div className="space-y-2">
            <div className="h-4 w-28 rounded bg-gray-200" />
            <div className="h-10 rounded bg-gray-100" />
          </div>
        </div>

        {/* Images */}
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-gray-200" />
          <div className="h-32 rounded border-2 border-dashed border-gray-200 bg-gray-50" />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <div className="h-10 w-28 rounded bg-gray-100" />
          <div className="h-10 w-36 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}