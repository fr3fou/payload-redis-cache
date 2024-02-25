import { invalidateCache } from '../adapters/cacheHelpers'

/* Explicit type as CollectionAfterChangeHook | GlobalAfterChangeHook
   can lead to a type error in the payload configuration. */
export const invalidateCacheAfterChangeHook = ({ doc }) => {
  // invalidate cache
  invalidateCache()
  return doc
}

export const invalidateCacheAfterDeleteHook = ({ doc }) => {
  // invalidate cache
  invalidateCache()
  return doc
}
