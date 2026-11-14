/**
 * Failure isolation for batched workflow calls.
 *
 * Medusa workflows roll a failed run back (compensation), so a batch that
 * throws left nothing behind and can safely be replayed item by item: the good
 * items go through, the bad ones are reported — and one poisoned record no
 * longer aborts the whole Moloni sync.
 */

export interface ItemFailure<T> {
  item: T
  error: unknown
}

export interface FallbackResult<T> {
  succeeded: T[]
  failed: ItemFailure<T>[]
}

export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === "string") return e
  // Medusa workflows reject with a serialized error ({ message, name, stack }).
  if (e && typeof e === "object" && typeof (e as any).message === "string") {
    return (e as any).message
  }
  try {
    return JSON.stringify(e)
  } catch {
    return String(e)
  }
}

/**
 * Run `items` through `run` in batches of `size`. When a batch throws it is
 * retried one item at a time; `onBatchError` is told before that happens.
 * Never throws (unless a callback does).
 */
export async function runInBatchesWithFallback<T>(
  items: T[],
  size: number,
  run: (batch: T[]) => Promise<unknown>,
  onBatchError?: (error: unknown, batch: T[]) => void
): Promise<FallbackResult<T>> {
  const succeeded: T[] = []
  const failed: ItemFailure<T>[] = []
  for (let i = 0; i < items.length; i += size) {
    const batch = items.slice(i, i + size)
    try {
      await run(batch)
      succeeded.push(...batch)
      continue
    } catch (error) {
      if (batch.length === 1) {
        failed.push({ item: batch[0], error })
        continue
      }
      onBatchError?.(error, batch)
    }
    for (const item of batch) {
      try {
        await run([item])
        succeeded.push(item)
      } catch (error) {
        failed.push({ item, error })
      }
    }
  }
  return { succeeded, failed }
}
