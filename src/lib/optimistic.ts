import type { QueryClient, QueryKey } from "@tanstack/react-query";

type WithId = { id: number };

export type OptimisticContext<T> = {
  snapshots: Array<[QueryKey, T[] | undefined]>;
  tempId?: number;
};

/** Generate a stable temporary id while a create call is in flight. */
export function tempItemId(): number {
  return -Date.now() - Math.floor(Math.random() * 1000);
}

/** Snapshot every list cached under `rootKey` so we can roll back on error.
 *
 * Filters out non-array entries because `getQueriesData` matches by prefix
 * and may surface unrelated caches (e.g. the combined due-reminders cache).
 */
export async function snapshotLists<T>(
  queryClient: QueryClient,
  rootKey: QueryKey
): Promise<Array<[QueryKey, T[] | undefined]>> {
  await queryClient.cancelQueries({ queryKey: rootKey });
  const all = queryClient.getQueriesData<T[]>({ queryKey: rootKey });
  return all.filter(([, value]) => value === undefined || Array.isArray(value));
}

/** Restore every snapshot taken with snapshotLists. */
export function restoreSnapshots<T>(
  queryClient: QueryClient,
  snapshots: Array<[QueryKey, T[] | undefined]>
) {
  for (const [key, data] of snapshots) {
    queryClient.setQueryData(key, data);
  }
}

/** Apply a transform to every list cached under `rootKey`.
 *
 * Note: `setQueriesData` matches by prefix, so the same `rootKey` can also
 * touch sibling caches whose value is not an array (e.g. the combined
 * due-reminders cache that lives under `["events", ...]`). We skip anything
 * that isn't an array so we don't trample those values or throw.
 */
export function patchLists<T>(
  queryClient: QueryClient,
  rootKey: QueryKey,
  transform: (list: T[]) => T[]
) {
  queryClient.setQueriesData<T[]>({ queryKey: rootKey }, (old) => {
    if (!Array.isArray(old)) return old;
    return transform(old);
  });
}

/** Prepend an optimistic item to every list cached under `rootKey`. */
export function prependOptimistic<T extends WithId>(
  queryClient: QueryClient,
  rootKey: QueryKey,
  item: T
) {
  patchLists<T>(queryClient, rootKey, (list) => [item, ...list]);
}

/** Replace an item (matched by id) in every list cached under `rootKey`. */
export function replaceItem<T extends WithId>(
  queryClient: QueryClient,
  rootKey: QueryKey,
  matchId: number,
  next: T
) {
  patchLists<T>(queryClient, rootKey, (list) =>
    list.map((item) => (item.id === matchId ? next : item))
  );
}

/** Update fields of an item (matched by id) without replacing the rest. */
export function mergeItem<T extends WithId>(
  queryClient: QueryClient,
  rootKey: QueryKey,
  matchId: number,
  patch: Partial<T>
) {
  patchLists<T>(queryClient, rootKey, (list) =>
    list.map((item) => (item.id === matchId ? { ...item, ...patch } : item))
  );
}

/** Remove an item (matched by id) from every list cached under `rootKey`. */
export function removeItem<T extends WithId>(
  queryClient: QueryClient,
  rootKey: QueryKey,
  matchId: number
) {
  patchLists<T>(queryClient, rootKey, (list) =>
    list.filter((item) => item.id !== matchId)
  );
}
