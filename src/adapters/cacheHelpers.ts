import { crypto } from './crypto'
import { redisContext } from './redis'
import payload from 'payload'

interface CacheBaseArgs {
  userCollection: string
  requestedUrl: string
  authorization: string
  logger?: typeof payload.logger
}

interface CacheExtendedArgs extends CacheBaseArgs {
  body: unknown
}

export const generateCacheHash = ({
  userCollection,
  requestedUrl,
  authorization
}: CacheBaseArgs): string => {
  const requestUrlAndUserCollection = `${userCollection}-${requestedUrl}-${authorization}`
  const pathHash = crypto.createHash('sha256').update(requestUrlAndUserCollection).digest('hex')
  const namespace = redisContext.getNamespace()
  return `${namespace}:${pathHash}`
}

export const getCacheItem = async ({
  userCollection,
  requestedUrl,
  authorization,
  logger
}: CacheBaseArgs): Promise<string | null> => {
  const redisClient = redisContext.getRedisClient()
  logger ??= redisContext.getLogger()
  if (!redisClient) {
    logger.error(
      { url: requestedUrl, userCollection },
      `Redis Client not available, can't get cache item`
    )
    return null
  }

  const hash = generateCacheHash({ userCollection, requestedUrl, authorization })
  const jsonData = await redisClient.GET(hash)
  if (!jsonData) {
    logger.info({ url: requestedUrl, userCollection }, `Cache Miss`)
    return null
  }
  logger.info({ url: requestedUrl, userCollection }, `Cache Hit`)
  return jsonData
}

export const setCacheItem = async ({
  userCollection,
  requestedUrl,
  authorization,
  body,
  logger
}: CacheExtendedArgs): Promise<void> => {
  const redisClient = redisContext.getRedisClient()
  logger ??= redisContext.getLogger()
  if (!redisClient) {
    logger.error(
      { url: requestedUrl, userCollection },
      `Redis Client not available, can't set cache item`
    )
    return
  }

  const hash = generateCacheHash({ userCollection, requestedUrl, authorization })

  try {
    const data = JSON.stringify(body)
    await redisClient.SET(hash, data)

    const indexesName = redisContext.getIndexesName()
    await redisClient.SADD(indexesName, hash)
  } catch (e) {
    logger.error(e, "Couldn't set cache item")
  }
  logger.info({ url: requestedUrl, userCollection }, `Set cache item`)
}

export const invalidateCache = async (logger?: CacheBaseArgs['logger']): Promise<void> => {
  const redisClient = redisContext.getRedisClient()
  logger ??= redisContext.getLogger()
  if (!redisClient) {
    logger.error(`Redis Client not available, can't invalidate cache`)
    return
  }

  const indexesName = redisContext.getIndexesName()
  const indexes = await redisClient.SMEMBERS(indexesName)
  indexes.forEach((index) => {
    redisClient.DEL(index)
    redisClient.SREM(indexesName, index)
  })

  logger.info('Cache Invalidated')
}
