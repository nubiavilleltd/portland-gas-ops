interface AssignmentProgressProps {
  trackedAssigned: number;
  trackedTotal: number;

  consumablesAssigned: number;
  consumablesTotal: number;
}

export default function AssignmentProgress({
  trackedAssigned,
  trackedTotal,
  consumablesAssigned,
  consumablesTotal,
}: AssignmentProgressProps) {
  const ready =
    trackedAssigned === trackedTotal &&
    consumablesAssigned === consumablesTotal;

  return (
    <div className="rounded-xl border border-brand-border bg-gray-50 p-4">
      <h3 className="text-sm font-semibold text-brand-text-primary mb-3">
        Inventory Progress
      </h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-brand-text-secondary">
            Tracked Items
          </span>

          <span className="font-medium">
            {trackedAssigned} / {trackedTotal}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-brand-text-secondary">
            Consumables
          </span>

          <span className="font-medium">
            {consumablesAssigned} / {consumablesTotal}
          </span>
        </div>
      </div>

      <div className="mt-4 border-t border-brand-border pt-3">
        {ready ? (
          <p className="text-sm font-medium text-green-700">
            ✓ Ready to mark trip ready
          </p>
        ) : (
          <p className="text-sm text-amber-700">
            Complete all assignments to continue.
          </p>
        )}
      </div>
    </div>
  );
}