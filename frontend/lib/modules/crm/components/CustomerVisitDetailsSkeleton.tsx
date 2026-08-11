// components/skeletons/CustomerVisitDetailsSkeleton.tsx

import { Skeleton } from "@/lib/modules/crm/components/Skeleton";

export default function CustomerVisitDetailsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-20 rounded-xl" />
      </div>

      {/* Requester */}
      <Skeleton className="h-36 rounded-xl" />

      {/* Visit Information */}
      <div className="rounded-xl p-6 space-y-6">
        <Skeleton className="h-6 w-52" />

        <Skeleton className="h-10 w-full" />

        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>

        <Skeleton className="h-28" />
        <Skeleton className="h-20" />
      </div>

      {/* Planning */}
      <div className="rounded-xl p-6 space-y-6">
        <Skeleton className="h-6 w-40" />

        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      </div>

      {/* Outcome */}
      <div className="rounded-xl  p-6 space-y-5">
        <Skeleton className="h-6 w-48" />

        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>

      {/* Activity */}
      <div className="rounded-xl  p-6 space-y-4">
        <Skeleton className="h-6 w-32" />

        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
