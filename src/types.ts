import { cacheMiddleware } from './middlewares'

export interface RedisInitOptions {
  redisUrl: string
  redisNamespace?: string
  redisIndexesName?: string
}

export interface PluginOptions {
  excludedCollections?: string[]
  excludedGlobals?: string[]
  includedPaths?: string[]
  middleware?: typeof cacheMiddleware
}

export interface JwtToken {
  id: string
  collection: string
  email: string
}

export const DEFAULT_USER_COLLECTION = 'loggedout'

export interface CacheMiddlewareArgs {
  includedCollections: string[]
  includedGlobals: string[]
  includedPaths: string[]
  apiBaseUrl: string
}
