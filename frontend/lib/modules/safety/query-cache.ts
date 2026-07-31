import type { QueryClient, QueryKey } from "@tanstack/react-query";

export function replaceRecordById<T extends { id: string }>(
  items: T[] | undefined,
  updated: T,
): T[] | undefined {
  if (!items) return items;
  let found = false;
  const nextItems = items.map((item) => {
    if (item.id !== updated.id) return item;
    found = true;
    return updated;
  });
  return found ? nextItems : items;
}

export function writeMappedRecordToSafetyCaches<T extends { id: string }>({
  queryClient,
  detailKey,
  listKey,
  updated,
}: {
  queryClient: QueryClient;
  detailKey: QueryKey;
  listKey: QueryKey;
  updated: T;
}) {
  queryClient.setQueryData(detailKey, updated);
  queryClient.setQueriesData<T[]>(
    { queryKey: listKey },
    (oldData) => replaceRecordById(oldData, updated),
  );
}

export function invalidateSafetyWorkflowCaches(
  queryClient: QueryClient,
  requestType: string,
  requestId: string,
) {
  return Promise.allSettled([
    queryClient.invalidateQueries({ queryKey: ["my-approvals"] }),
    queryClient.invalidateQueries({ queryKey: ["my-requests"] }),
    queryClient.invalidateQueries({ queryKey: ["audit-trail", requestType, requestId] }),
  ]);
}

export function queueSafetyInvalidations(invalidations: Promise<unknown>[]) {
  void Promise.allSettled(invalidations);
}
