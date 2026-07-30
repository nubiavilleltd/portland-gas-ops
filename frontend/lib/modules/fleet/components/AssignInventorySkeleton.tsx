import AppLayout from "@/components/layout/AppLayout";

export default function AssignInventorySkeleton() {
  return (
    <AppLayout pageTitle="Assign Inventory">
      <div className="h-4 w-28 rounded-md bg-brand-border/60 animate-pulse mb-5" />

      <div className="space-y-2 mb-6">
        <div className="h-6 w-48 rounded-md bg-brand-border/60 animate-pulse" />
        <div className="h-4 w-72 rounded-md bg-brand-border/60 animate-pulse" />
      </div>

      <div className="divide-y divide-brand-border">
        {Array.from({ length: 2 }).map((_, sectionIdx) => (
          <section key={sectionIdx} className="py-6 first:pt-0">
            <div className="flex items-center justify-between pb-2 border-b border-brand-border">
              <div className="h-5 w-32 rounded-md bg-brand-border/60 animate-pulse" />
              <div className="h-4 w-16 rounded-md bg-brand-border/60 animate-pulse" />
            </div>

            <div className="p-6 space-y-3">
              {Array.from({ length: 2 }).map((_, itemIdx) => (
                <div
                  key={itemIdx}
                  className="border border-brand-border rounded-xl overflow-hidden"
                >
                  <div className="px-4 py-3 bg-gray-50 border-b border-brand-border flex items-center justify-between">
                    <div className="h-4 w-32 rounded-md bg-brand-border/60 animate-pulse" />
                    <div className="h-5 w-24 rounded-md bg-brand-border/60 animate-pulse" />
                  </div>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="h-4 w-40 rounded-md bg-brand-border/60 animate-pulse" />
                    <div className="h-8 w-28 rounded-md bg-brand-border/60 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Progress bar */}
        <div className="py-6">
          <div className="h-4 w-full rounded-md bg-brand-border/60 animate-pulse" />
        </div>
      </div>
    </AppLayout>
  );
}