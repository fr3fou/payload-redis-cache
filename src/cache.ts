import type { Config, Plugin } from 'payload/config'
import { CollectionConfig, GlobalConfig } from 'payload/types'
import { initRedisContext, InitRedisContextParams } from './adapters/redis'
import { invalidateCacheAfterChangeHook, invalidateCacheAfterDeleteHook } from './hooks'
import { cacheMiddleware } from './middlewares'
import { PluginOptions, RedisInitOptions } from './types'
import { extendWebpackConfig } from './webpack'

export const initRedis = (params: InitRedisContextParams) => {
  const { url, namespace = 'payload', indexesName = 'payload-cache-index', ...rest } = params
  initRedisContext({ url, namespace, indexesName, ...rest })
}

export const cachePlugin =
  (pluginOptions: PluginOptions): Plugin =>
  (config: Config): Config | Promise<Config> => {
    const includedCollections: string[] = []
    const includedGlobals: string[] = []
    // Merge incoming plugin options with the default ones
    const { excludedCollections = [], excludedGlobals = [], includedPaths = [] } = pluginOptions

    const collections = config?.collections
      ? config.collections?.map((collection): CollectionConfig => {
          const { hooks } = collection

          if (!excludedCollections.includes(collection.slug)) {
            includedCollections.push(collection.slug)
          }

          return {
            ...collection,
            hooks: {
              ...hooks,
              afterChange: [...(hooks?.afterChange || []), invalidateCacheAfterChangeHook],
              afterDelete: [...(hooks?.afterDelete || []), invalidateCacheAfterDeleteHook]
            }
          }
        })
      : []

    const globals = config?.globals
      ? config.globals?.map((global): GlobalConfig => {
          const { hooks } = global

          if (!excludedGlobals.includes(global.slug)) {
            includedGlobals.push(global.slug)
          }

          return {
            ...global,
            hooks: {
              ...hooks,
              afterChange: [...(hooks?.afterChange || []), invalidateCacheAfterChangeHook]
            }
          }
        })
      : []

    const middlewareOptions = {
      includedCollections,
      includedGlobals,
      includedPaths,
      apiBaseUrl: config?.routes?.api || '/api'
    }

    return {
      ...config,
      admin: {
        ...(config?.admin || {}),
        webpack: extendWebpackConfig({ config })
      },
      collections,
      globals,
      express: {
        preMiddleware: [
          ...(config?.express?.preMiddleware || []),
          pluginOptions.middleware?.(middlewareOptions) ?? cacheMiddleware(middlewareOptions)
        ]
      }
    }
  }
